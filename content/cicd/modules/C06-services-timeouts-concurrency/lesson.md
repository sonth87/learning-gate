# Service Containers (Postgres/Redis), Timeout bảo vệ ví & Concurrency

Unit Test với dữ liệu giả lập (`vi.mock('pg')`) chạy rất nhanh nhưng có một điểm mù chết người: câu lệnh SQL bạn viết sai tên cột hay migration Prisma/Drizzle bị vấp khoá ngoại vẫn có thể… báo xanh mượt mà! Trên laptop, bạn gõ `docker compose up -d postgres redis` để test thật. Vậy khi đẩy code lên GitHub Actions, làm sao dựng ngay một cụm **PostgreSQL 16** và **Redis 7** sống cùng vòng đời với Job kiểm thử tích hợp, đồng thời bảo vệ hoá đơn thẻ tín dụng của công ty khỏi các tiến trình treo 6 tiếng hay những cú push dồn dập đè lên nhau?

---

## 1. Cái bẫy 360 phút mặc định và kỷ luật `timeout-minutes`

Ít ai đọc kỹ dòng chữ nhỏ trong tài liệu GitHub Actions: **nếu bạn không khai báo `timeout-minutes`, một Job bị treo sẽ tiếp tục chạy và tính tiền suốt 360 phút (6 tiếng đồng hồ!)** trước khi bị hệ thống cưỡng chế tắt. Chỉ cần một kết nối database trong bài test quên gọi `await pool.end()` khiến tiến trình Node.js không chịu thoát, 10 Pull Request trong ngày sẽ nướng sạch **3.600 phút CI**!

Quy tắc bắt buộc ở mọi dự án chuyên nghiệp: luôn đặt trần thời gian hợp lý ở cấp Job (thường là **`timeout-minutes: 10`** hoặc **`15`** cho CI tiêu chuẩn):

```yaml
jobs:
  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```

---

## 2. Kiểm soát tranh chấp với `concurrency`: Khi nào Huỷ, khi nào Xếp hàng?

Khi lập trình viên phát hiện gõ nhầm chính tả, họ sửa rồi `git push` liên tiếp 4 commit trong vòng 2 phút lên cùng một nhánh Pull Request. Nếu không cấu hình `concurrency`, cả 4 workflow chạy song song chiếm hết máy chạy, trong khi kết quả của 3 commit cũ hoàn toàn vô giá trị! Nhưng ngược lại, trên nhánh `main` đang triển khai lên **Production**, nếu huỷ ngang một đợt deploy đang chạy dở database migration thì hệ thống sẽ rơi vào trạng thái nửa sống nửa chết!

Vì vậy, `concurrency` có **hai chiến lược đối lập nhau** tuỳ môi trường:

| Ngữ cảnh | Giá trị `group:` | `cancel-in-progress` | Hành vi điều phối |
| :--- | :--- | :--- | :--- |
| **Kiểm thử nhánh / PR** | `ci-${{ github.workflow }}-${{ github.ref }}` | **`true`** | Vừa có commit mới trên cùng nhánh/PR -> **huỷ ngay lập tức** lượt chạy cũ để tiết kiệm phút CI |
| **Triển khai Production** | `deploy-production` (cố định theo môi trường) | **`false`** | Giữ bản đang chạy hoàn tất an toàn; bản mới được giữ ở hàng đợi (`Pending`) chờ đến lượt |

---

## 3. Service Containers: Thay thế `compose.yaml` ngay bên trong Job

Khối `services:` của GitHub Actions cho phép đính kèm các container phụ trợ (như `postgres:16-alpine`, `redis:7-alpine`) khởi chạy ngay trước các Step của Job và tự động tiêu huỷ sạch sẽ khi Job khép lại. Khi các Step chạy trực tiếp trên máy chủ `ubuntu-latest`, bạn cần ánh xạ cổng (`ports: ["5432:5432"]`) để ứng dụng Node.js kết nối tới `localhost:5432` và `localhost:6379`.

### Bẫy kinh điển: Container `Up` chưa chắc Database đã sẵn sàng nhận kết nối!
Docker đánh dấu container Postgres là `Running` ngay mili-giây tiến trình PID 1 vừa khởi chạy, nhưng bên trong Postgres còn mất thêm 2–4 giây để khởi tạo thư mục dữ liệu `initdb` rồi mới mở socket lắng nghe cổng `5432`. Nếu Step `npm run db:migrate` chạy ngay lập tức, bạn sẽ ăn lỗi đỏ chót **`ECONNREFUSED 127.0.0.1:5432`**!

Cách giải quyết chuẩn mực không phải là đoán mò `sleep 10`, mà là truyền cờ Docker Healthcheck vào trường `options:`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: test_ephemeral_password
      POSTGRES_DB: app_test
    ports:
      - "5432:5432"
    options: >-
      --health-cmd "pg_isready -U app -d app_test"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 5s
      --health-timeout 3s
      --health-retries 5
```

Khi có `--health-cmd`, GitHub Runner sẽ kiên nhẫn đứng đợi cho tới khi `pg_isready` và `redis-cli ping` báo trạng thái **`healthy`** mới bắt đầu chạy Step đầu tiên! Sau đó trong `env:` của Job, ứng dụng Node.js chỉ việc đọc `DATABASE_URL: postgresql://app:test_ephemeral_password@localhost:5432/app_test` và `REDIS_URL: redis://localhost:6379` để chạy migration thật, truy vấn SQL thật với độ tin cậy 100%.

---

## 4. Lưu ý vàng cho Node.js Dev: Mạng `localhost` và Đóng kết nối cuối bài Test

Có hai chi tiết thực tế giúp bạn tiết kiệm hàng giờ gỡ lỗi khi dùng Service Containers với Node.js:

1. **`localhost` vs Tên dịch vụ (`postgres` / `redis`)**: Khi các Step của bạn chạy trực tiếp trên máy ảo `runs-on: ubuntu-latest` (cách phổ biến nhất), tiến trình Node.js nằm ngoài Docker network nên **bắt buộc kết nối qua `localhost:5432` và `localhost:6379`** (nhờ cấu hình `ports:` đã ánh xạ cổng ra máy chủ). Ngược lại, chỉ khi nào cả Job của bạn bọc trong `container: node:22-alpine` thì mới gọi qua hostname `postgres:5432`.
2. **Đóng sạch Connection Pool trong `afterAll()`**: Các thư viện như `pg.Pool`, `PrismaClient` hay `ioredis` giữ TCP socket mở ngầm trong Event Loop của Node.js. Nếu quên gọi `await prisma.$disconnect()` và `await redis.quit()` trong hook `afterAll` của Vitest/Jest, bộ test dù chạy xanh 100% vẫn sẽ đứng im không thoát cho tới khi chạm trần `timeout-minutes: 10`! Kết hợp đóng kết nối gọn gàng trong code và đặt `timeout-minutes` trên YAML chính là lá chắn kép hoàn hảo.

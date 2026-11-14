# Service Containers (Postgres/Redis), Timeout bảo vệ ví & Concurrency

Unit Test với dữ liệu giả lập (`vi.mock('pg')`) chạy rất nhanh nhưng mang một điểm mù nguy hiểm: câu lệnh SQL gõ sai tên cột hay migration Prisma/Drizzle vấp khoá ngoại vẫn có thể… báo xanh mượt mà! Trên laptop, bạn gõ `docker compose up -d postgres redis` để kiểm thử thật. Khi đưa lên GitHub Actions, bạn cần kết hợp **3 tấm khiên vận hành thực chiến**: dựng cụm **PostgreSQL 16 + Redis 7** sống cùng vòng đời Job, khoá trần **`timeout-minutes`** chống đốt ví 6 tiếng, và điều phối **`concurrency`** thông minh giữa Pull Request với Production!

```visual
kind: groups
title: "Bộ Ba Lá Chắn Sống Còn Cho Đường Ống Kiểm Thử & Triển Khai [!badge:emerald:Production Grade]"
columns: 3
items:
  - num: 1
    icon: shield-alert
    title: "timeout-minutes"
    badge: "Chống bẫy 360 phút"
    tone: rose
    desc: "Cắt đứt ngay các tiến trình treo kết nối thay vì để cháy túi suốt 6 giờ."
    bullets:
      - "Mặc định nếu bỏ trống, GitHub cho Job chạy tới ==**360 phút (6 tiếng)**== mới tự huỷ!"
      - "Luôn khai báo rõ `timeout-minutes: 10` (hoặc `15`) ở mọi Job CI"
  - num: 2
    icon: layers
    title: "concurrency"
    badge: "Chống đua tranh & Lãng phí"
    tone: amber
    desc: "Kiểm soát các lượt chạy trùng nhánh trên PR hoặc xếp hàng an toàn trên Production."
    bullets:
      - "Trên PR: `cancel-in-progress: true` để huỷ ngay bản chạy cũ lỗi thời"
      - "Trên Production: `cancel-in-progress: false` để xếp hàng tuần tự, bảo vệ DB migration"
  - num: 3
    icon: database
    title: "services:"
    badge: "Postgres 16 & Redis 7"
    tone: sky
    desc: "Đính kèm container cơ sở dữ liệu thật dùng một lần ngay bên cạnh Job kiểm thử."
    bullets:
      - "Tự động bật trước Step đầu tiên và **xoá sạch dữ liệu** khi Job khép lại"
      - "Kết hợp `--health-cmd` để loại bỏ hoàn toàn lỗi `ECONNREFUSED`"
```

## 1. Cái bẫy 360 phút mặc định và kỷ luật `timeout-minutes`

```visual
kind: illustration
diagram: "cicd:c06"
alt: "Ba lá chắn vận hành gồm Service Containers (PostgreSQL 16 + Redis 7 kèm healthcheck), trần thời gian timeout-minutes và điều phối concurrency"
title: "Giải Phẫu Bộ Ba Vận Hành CI: Service Containers, Trần Timeout & Concurrency"
subtitle: "Kiểm thử tích hợp trên cơ sở dữ liệu thật dùng một lần, chặn đứng tiến trình treo 6 tiếng và điều tiết tranh chấp luồng"
caption: "Cụm PostgreSQL/Redis đính kèm vòng đời Job với healthcheck tự động, rào chắn timeout-minutes: 10 và hai chế độ concurrency cho PR vs Production"
callouts:
  - num: 1
    label: "Service Containers kèm cổng gác Healthcheck"
    desc: "Khởi chạy PostgreSQL 16 và Redis 7 thật ngay cạnh Job; cờ --health-cmd đảm bảo các bước kiểm thử chỉ chạy sau khi DB đã sẵn sàng."
    tone: sky
  - num: 2
    label: "timeout-minutes chặn bẫy đốt tiền 360 phút"
    desc: "Thay thế mức trần mặc định 6 tiếng nguy hiểm của GitHub bằng ngưỡng 10-15 phút hợp lý để tự cắt ngay các kết nối bị treo."
    tone: rose
  - num: 3
    label: "concurrency đối lập giữa PR và Production"
    desc: "Bật cancel-in-progress: true trên nhánh PR để huỷ bản cũ lỗi thời, nhưng bắt buộc đặt false trên Production để xếp hàng tuần tự an toàn."
    tone: amber
```

Ít người để ý dòng quy định mặc định của GitHub Actions: **nếu bạn quên viết `timeout-minutes`, một Job bị treo sẽ tiếp tục chạy và trừ tiền suốt ==360 phút (6 giờ đồng hồ)==** trước khi bị hệ thống cưỡng chế dừng! Chỉ cần một bài kiểm thử tích hợp quên đóng kết nối database khiến tiến trình Node.js đứng im, 10 Pull Request trong ngày sẽ thiêu rụi **3.600 phút CI** của cả đội.

```yaml
jobs:
  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 10   # Bắt buộc khai báo trần hợp lý (10–15 phút)!
```

## 2. Kiểm soát tranh chấp với `concurrency`: Khi nào Huỷ, khi nào Xếp hàng?

Khi lập trình viên phát hiện lỗi chính tả rồi `git push` dồn dập 4 commit trong 2 phút lên cùng một nhánh PR, để cả 4 workflow chạy song song là sự lãng phí vô nghĩa. Nhưng ngược lại, trên nhánh `main` đang chạy **Production deployment** kèm cập nhật schema cơ sở dữ liệu, nếu rút phích cắm ngang hông bản đang chạy thì hệ thống sẽ hỏng khoá trạng thái (*state lock*) và sập ngay lập tức!

```visual
kind: compare
title: "Hai Chiến Lược Đối Lập Của concurrency: Pull Request vs Production"
subtitle: "Cùng một từ khoá nhưng đảo ngược cờ cancel-in-progress theo đúng mức độ rủi ro của môi trường"
left:
  badge: "KIỂM THỬ NHÁNH / PR · Huỷ bản cũ"
  title: "Tiết kiệm tài nguyên cho commit mới nhất"
  tone: sky
  code: |
    concurrency:
      group: ci-${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true
  lang: yaml
  bullets:
    - "Nhóm theo `github.workflow` + `github.ref` để **cô lập riêng từng nhánh/PR** (tuyệt đối không dùng khoá toàn cục làm huỷ nhầm PR của đồng nghiệp khác!)"
    - "**`cancel-in-progress: true`**: Vừa đẩy commit sửa lỗi mới lên nhánh -> huỷ tức khắc lượt chạy cũ đang dở dang"
right:
  badge: "TRIỂN KHAI PRODUCTION · Xếp hàng tuần tự"
  title: "Bảo vệ an toàn tuyệt đối cho DB Migration & Terraform"
  tone: emerald
  code: |
    concurrency:
      group: deploy-production
      cancel-in-progress: false
  lang: yaml
  bullets:
    - "Đặt tên nhóm cố định theo môi trường đích (`deploy-production`)"
    - "**`cancel-in-progress: false`**: Tuyệt đối không ngắt ngang bản đang chạy! Đợt deploy mới nhất được giữ ở trạng thái chờ (**`Pending`**) cho tới khi bản trước hoàn tất trọn vẹn"
```

## 3. Service Containers: Thay thế `compose.yaml` kèm Healthcheck chuẩn xác

Khối ==`services:`== cho phép đính kèm `postgres:16-alpine` và `redis:7-alpine` chạy song hành cùng Job. Tuy nhiên, có một cái bẫy kinh điển: Docker báo container `Running` ngay mili-giây tiến trình PID 1 vừa bật, nhưng bên trong PostgreSQL còn mất thêm 2–4 giây chạy `initdb` mới mở cổng TCP `5432`. Nếu Step `npm run db:migrate` nổ súng quá sớm, bạn sẽ dính lỗi đỏ chót ==`ECONNREFUSED 127.0.0.1:5432`==!

```visual
kind: flow
title: "Vòng Đời Khởi Động Service Containers Chống Lỗi ECONNREFUSED"
steps:
  - icon: container
    badge: "1. Khởi tạo Container"
    title: "Pull & Map Ports"
    desc: "Bật postgres:16-alpine (5432:5432) & redis:7-alpine (6379:6379)"
    code: "ports: [\"5432:5432\"]"
    tone: sky
    edge: "kiểm tra sức khoẻ"
  - icon: doctor
    badge: "2. Chốt chặn Healthcheck"
    title: "Đợi trạng thái healthy"
    desc: "Runner kiên nhẫn chờ pg_isready và redis-cli ping trả mã 0"
    code: "--health-cmd pg_isready"
    tone: amber
    edge: "DB sẵn sàng 100%"
  - icon: play
    badge: "3. Thực thi Step"
    title: "Migrate & Test Thật"
    desc: "Node.js trên host VM gọi thẳng localhost:5432 và localhost:6379"
    code: "localhost:5432"
    tone: emerald
    edge: "Job kết thúc"
  - icon: trash
    badge: "4. Dọn sạch Ephemeral"
    title: "Huỷ Container & Dữ Liệu"
    desc: "Xoá sổ toàn bộ DB tạm ngay lập tức, lần chạy sau lại sạch tinh"
    code: "Auto Destroy"
    tone: rose
```

Thay vì đoán mò `sleep 10`, hãy cấu hình cờ Docker Healthcheck chuẩn mực trong `options:`:

```yaml
jobs:
  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 10
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

## 4. Hai lưu ý vàng cho lập trình viên Node.js: Mạng `localhost` & Đóng Pool `afterAll()`

- [x] **Kết nối qua `localhost` (nhờ `ports:`) khi chạy trực tiếp trên VM:** Khi các Step chạy thẳng trên máy chủ `runs-on: ubuntu-latest` (không bọc `container:`), tiến trình Node.js nằm ở mạng máy chủ bên ngoài Docker network. Do đó bạn **bắt buộc ánh xạ `ports: ["5432:5432"]` và kết nối qua `localhost:5432` / `localhost:6379`** (`postgresql://app:test_ephemeral_password@localhost:5432/app_test`). *(Chỉ khi nào cả Job bọc trong `container: node:22-alpine` thì mới gọi qua tên dịch vụ `postgres:5432`).*
- [!] **Đóng sạch Connection Pool trong hook `afterAll()`:** Các thư viện như `pg.Pool`, `PrismaClient` hay `ioredis` giữ TCP socket mở ngầm trong Event Loop. Nếu quên gọi `await prisma.$disconnect()`, `await pool.end()` và `await redis.quit()` trong `afterAll()`, bộ test dù chạy xanh 100% vẫn sẽ treo đứng im cho tới lúc đụng trần `timeout-minutes: 10`!

> [!REMEMBER] Ghi nhớ bỏ túi
> - Không đặt `timeout-minutes` = mặc định chạy tối đa **360 phút** -> luôn khai báo `timeout-minutes: 10` (hoặc `15`).
> - `concurrency`: Dùng `ci-${{ github.workflow }}-${{ github.ref }}` kèm **`cancel-in-progress: true` cho PR**, nhưng bắt buộc **`cancel-in-progress: false` cho Production**.
> - `services:` mang tính **Ephemeral** (tự xoá sạch khi xong Job): nhớ mở `ports:` để gọi qua **`localhost`**, thêm `--health-cmd` (**`pg_isready`** cho Postgres, **`redis-cli ping`** cho Redis), và đóng kết nối DB trong `afterAll()`.

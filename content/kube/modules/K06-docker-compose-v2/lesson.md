# Điều phối đa dịch vụ tại máy cá nhân với Docker Compose v2

Một ứng dụng thực tế hiếm khi sống cô độc một mình: API Node.js của bạn cần **PostgreSQL 16** để lưu đơn hàng, cần **Redis 7** để lưu phiên đăng nhập và hàng đợi BullMQ. Nếu phải gõ tay 4 câu lệnh `docker network create`, `docker volume create` và hàng chục cờ `-e`, `-p`, `-v` rời rạc mỗi sáng bật máy làm việc, sớm muộn gì các thành viên trong nhóm cũng gõ lệch cấu hình của nhau.

**Docker Compose v2** cho phép bạn gom toàn bộ kiến trúc đa container (dịch vụ, mạng nội bộ, ổ đĩa bền vững, kiểm tra sức khoẻ) vào một tệp YAML khai báo duy nhất tên là **`compose.yaml`** — bước đệm tư duy hoàn hảo trước khi bạn bước sang các Manifest YAML của Kubernetes ở Cấp độ 2!

---

## 1. Chuẩn Docker Compose v2 năm 2026: Tạm biệt những di sản cũ!

Khi tìm kiếm tài liệu trên mạng hoặc đọc code từ giai đoạn 2018–2021, bạn sẽ thấy rất nhiều cú pháp cũ đã bị khai tử. Hãy cập nhật ngay bảng đối chiếu chuẩn hiện đại:

| Hạng mục | Kiểu cũ đã lỗi thời (Compose v1) | Chuẩn hiện đại năm 2026 (**Compose v2**) |
| --- | --- | --- |
| **Câu lệnh CLI** | `docker-compose up` *(có dấu gạch ngang, viết bằng Python)* | **`docker compose up -d`** *(tích hợp sẵn bằng Go làm plugin chính thức của Docker CLI)* |
| **Tên tệp chuẩn** | `docker-compose.yml` | **`compose.yaml`** *(ngắn gọn, ưu tiên số 1 theo Compose Specification)* |
| **Khoá `version:` đầu tệp** | `version: "3.8"` hoặc `version: "2.4"` | **BỎ HOÀN TOÀN!** Nếu cố viết `version:`, Compose v2 sẽ in cảnh báo `the attribute 'version' is obsolete` |
| **Kết nối giữa 2 dịch vụ** | Khai báo `links:` thủ công | Tự động tạo mạng chung; gọi thẳng nhau qua **tên dịch vụ (Service Name)** |

---

## 2. Quy tắc vàng về DNS nội bộ: Quên `localhost` đi, hãy gọi bằng Tên Dịch Vụ!

Đây là lỗi chiếm tới 80% câu hỏi cầu cứu của lập trình viên Node.js lần đầu viết `compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: dev-only-placeholder
      POSTGRES_DB: shop_db

  redis:
    image: redis:7-alpine

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      # ❌ SAI LẦM KINH ĐIỂN: DB_HOST: localhost -> báo lỗi ECONNREFUSED 127.0.0.1:5432!
      # ✅ ĐÚNG CHUẨN: Dùng chính tên khoá dưới "services:" làm hostname!
      DB_HOST: postgres
      DB_PORT: "5432"
      REDIS_HOST: redis
```

Khi bạn chạy `docker compose up -d`, Compose tự động tạo một mạng riêng cho dự án (ví dụ `myshop_default`) và đăng ký từng khoá dưới mục `services:` (`postgres`, `redis`, `api`) vào máy chủ DNS nội bộ.
- Nếu từ **trình duyệt hoặc DBeaver trên máy Mac/Windows bên ngoài** kết nối vào container (khi đã mở `ports: ["5432:5432"]`), bạn dùng `localhost:5432`.
- Nhưng khi **container `api` nói chuyện với container `postgres`**, cả hai đang đứng ngang hàng trong mạng nội bộ — bạn **bắt buộc dùng hostname `postgres` và cổng nội bộ `5432`**!

---

## 3. Bảo toàn dữ liệu Database qua các lần `down` / `up` bằng khối `volumes:`

Để dữ liệu PostgreSQL không bốc hơi khi dọn dẹp container bằng `docker compose down`, bạn cần thực hiện đủ **2 vế** trong `compose.yaml`:
1. Gắn `pgdata:/var/lib/postgresql/data` bên trong dịch vụ `postgres`.
2. Khai báo tên `pgdata:` ở mục **`volumes:` cấp cao nhất (top-level)** cuối tệp:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: dev-only-placeholder
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Lưu ý sống còn khi gõ lệnh:
- `docker compose down`: Tắt và xoá các container + mạng, nhưng **GIỮ NGUYÊN** dữ liệu trong `pgdata` (an toàn hàng ngày).
- `docker compose down -v`: Xoá luôn cả các Named Volume như `pgdata` — chỉ gõ cờ `-v` khi bạn thực sự muốn xoá sạch Database làm lại từ đầu!

---

## 4. Khởi động đúng trình tự sẵn sàng: `healthcheck` + `service_healthy`

Nếu bạn chỉ viết ngắn gọn:
```yaml
depends_on:
  - postgres
```
Docker Compose chỉ chờ đến giây đầu tiên tiến trình container `postgres` **vừa bật lên** là lập tức chạy `api` ngay! Trong khi đó, PostgreSQL lần đầu khởi tạo tệp dữ liệu mất khoảng 2–4 giây mới thực sự mở cổng `5432` nhận kết nối. Kết quả: Prisma/TypeORM bên trong `api` kết nối quá sớm, ăn lỗi từ chối kết nối và sập ngay lập tức!

Cách giải quyết chuẩn Production là dạy cho Postgres tự báo cáo trạng thái bằng `pg_isready`, và bảo `api` chờ đúng điều kiện **`condition: service_healthy`**:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: dev-only-placeholder
      POSTGRES_DB: shop_db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop -d shop_db"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    image: node:22-alpine
    depends_on:
      postgres:
        condition: service_healthy
```

---

## 5. Tính năng hiện đại: `docker compose watch` và `profiles`

- **`develop.watch` (Compose v2.22+):** Thay vì dùng Bind Mount `- .:/app` dễ làm hỏng thư mục `node_modules` biên dịch riêng cho Linux, cấu hình `develop.watch` cho phép đồng bộ nóng (`action: sync`) riêng thư mục `./src` vào `/app/src` và tự động build lại Image (`action: rebuild`) chỉ khi `package.json` thay đổi!
- **`profiles: ["debug"]`:** Cho phép gắn nhãn tuỳ chọn cho các dịch vụ nặng như Prometheus, Grafana hay pgAdmin — bình thường `docker compose up -d` bỏ qua cho nhẹ máy, chỉ khi nào cần đo đạc mới bật bằng `docker compose --profile debug up -d`.

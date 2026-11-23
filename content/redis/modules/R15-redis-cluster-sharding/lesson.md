# Redis Cluster & Phân mảnh 16.384 Hash Slots

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Ở bài `R14`, mô hình **1 Master + 2 Replica + Sentinel** đảm bảo tính sẵn sàng cao nhưng vẫn bị giới hạn bởi tài nguyên của **một nút Master duy nhất**:
> 1. **Giới hạn RAM:** Khi dữ liệu tăng lên `100 GB – 500 GB` trên một máy, việc sao lưu nền (`BGSAVE`) hay khôi phục khi khởi động lại sẽ rất chậm.
> 2. **Giới hạn CPU cho lệnh Ghi:** Mọi lệnh ghi (`SET`, `HSET`, `ZADD`, `XADD`) vẫn đi qua **1 luồng chính duy nhất của Master** (`~100k – 150k lệnh/giây`).
>
> **==Redis Cluster== (Phân mảnh ngang — *Horizontal Sharding*)** vượt qua giới hạn này bằng cách chia dữ liệu ra nhiều nút Master chạy song song thông qua 3 cơ chế:
> - **`Hash Slot` (`0` đến `16383`):** Toàn bộ không gian khóa được chia cố định thành **16,384 Hash Slot**. Với cụm 3 nút Master (**3 Shards**): Node 1 quản lý slot `0..5460`, Node 2 quản lý `5461..10922`, Node 3 quản lý `10923..16383`.
> - **Định tuyến trực tiếp bằng công thức băm:** Với mỗi tên khóa, client tính `CRC16(key) % 16384` để xác định chính xác slot và gửi thẳng tới nút Master sở hữu slot đó chỉ trong **1 bước mạng (1-hop)** mà không cần proxy trung gian.
> - **Lỗi `CROSSSLOT` & `{HashTag}`:** Các lệnh đa khóa (`MGET`, `MULTI/EXEC`, `EVAL` Lua) yêu cầu mọi khóa phải nằm trên **cùng 1 Hash Slot**, nếu không sẽ báo lỗi `CROSSSLOT`. Khi đặt cặp ngoặc nhọn `{u42}` trong tên khóa (ví dụ `user:{u42}:profile` và `user:{u42}:cart`), Redis chỉ băm chuỗi `u42` bên trong ngoặc để đảm bảo mọi khóa của cùng một đối tượng rơi vào chung 1 slot.

## 1. Giải phẫu Kiến trúc 16.384 Hash Slots & Định tuyến Thông minh

Công thức định tuyến chuẩn của mọi thư viện Redis Cluster:

$$\text{HASH\_SLOT}(k) = \text{CRC16}(\text{effective\_key}(k)) \bmod 16384$$

```visual
kind: illustration
src: "/illustrations/redis/redis-cluster-hash-ring.jpg"
diagram: "redis:r15"
alt: "Kiến trúc phân mảnh 16.384 Hash Slots, Gossip Bus và co-location bằng HashTag trên Redis Cluster"
badge: "Horizontal Sharding · R15"
title: "Bản đồ Phân mảnh 16.384 Hash Slots & Cơ chế Gom Cụm {HashTag}"
subtitle: "Mỗi Master nắm giữ một dải Slot tách biệt kèm Replica dự phòng riêng, kết nối ngang hàng qua Gossip Bus (cổng +10000)"
caption: "Client thông minh lưu sẵn bảng ánh xạ Slot -> Node trong RAM để bắn thẳng truy vấn tới đúng Master chỉ sau 1 chặng mạng (1-hop)."
callouts:
  - num: 1
    label: "16.384 Hash Slots (CRC16 mod 16384)"
    desc: "Chia nhỏ không gian khoá thành 16.384 đơn vị di chuyển độc lập; cụm tối thiểu 6 nút gồm 3 Master chia đều dải Slot và 3 Replica bảo vệ chéo."
    tone: cyan
  - num: 2
    label: "Smart Client & Phản hồi -MOVED / -ASK"
    desc: "Không cần Proxy trung gian: nếu bảng định tuyến của Client bị cũ khi đang di dời Slot, nút Redis trả về địa chỉ mới qua mã -MOVED (vĩnh viễn) hoặc -ASK (tạm thời)."
    tone: amber
  - num: 3
    label: "Co-location bằng {HashTag} chống CROSSSLOT"
    desc: "Khi khoá chứa cặp ngoặc nhọn hợp lệ {u42}, hàm CRC16 chỉ băm chuỗi bên trong ngoặc giúp MSET, MULTI/EXEC và Lua EVAL chạy an toàn trên cùng một phân mảnh."
    tone: emerald
```

> [!TIP] Vì sao Redis chọn con số `16.384` (`2^14`) thay vì `65.536` (`2^16`)? Và khi nào nên lên Cluster?
> - Các máy chủ trong cụm liên tục gửi tin nhắn hỏi thăm nhau (*Gossip PING/PONG*) kèm bản đồ bit các ngăn mình giữ: với `16,384` ngăn, bản đồ này chỉ nặng đúng **`2 KB`** (thay vì `8 KB`), tiết kiệm 75% băng thông nội bộ và dư sức chia đều cho tới 1,000 máy chủ!
> - **Lời khuyên kiến trúc thực tế:** Đừng vội dựng Cluster 6 máy phức tạp nếu dữ liệu của bạn mới dưới `16 GB` và dưới `80,000 ops/s` — khi đó 1 cụm **Sentinel HA** (hoặc dùng engine đa luồng dọc như **DragonflyDB** / **Valkey Multi-AZ**) đơn giản hơn rất nhiều và không bao giờ lo lỗi `CROSSSLOT`! Chỉ bật **Redis Cluster / Valkey Cluster** khi thực sự cần vượt trần RAM hoặc vượt trần tốc độ Ghi của 1 máy.

## 2. Hai cổng mạng song hành & Tín hiệu chỉ đường `-MOVED` vs `-ASK`

Mỗi nút Redis chạy chế độ Cluster **luôn cần mở 2 cổng TCP trên tường lửa**:
- [>] **Cổng phục vụ ứng dụng (`port`, mặc định `6379`):** Nói chuyện với code Python / Node.js / Go.
- [>] **Cổng nội bộ liên lạc giữa các nút (`port + 10000`, mặc định `16379`):** Nơi các nút Redis tự bầu cử đưa Replica lên thay Master bị hỏng (**không cần chạy thêm Sentinel bên ngoài!**) và cập nhật bản đồ ngăn tủ. Quên mở cổng `16379` giữa các máy chủ là lỗi cấu hình phổ biến nhất khiến cụm không thể ghép nối!

Khi bạn thêm máy chủ thứ 4 và di dời bớt một số ngăn tủ sang nhà mới ngay lúc hệ thống đang chạy (*Live Resharding*), thư viện Smart Client tự động xử lý 2 tín hiệu chỉ đường:

```visual
kind: compare
title: "Đối chiếu Tín hiệu Điều hướng -MOVED và -ASK khi Di dời Slot (Live Resharding)"
subtitle: "Hiểu rõ cách Smart Client (redis-py / ioredis / go-redis / Lettuce) tự cập nhật bản đồ mà không rớt request"
left:
  title: "-MOVED 4096 10.0.0.12:6379"
  badge: "Đã chuyển nhà hoàn tất"
  tone: emerald
  items:
    - "Báo rằng toàn bộ Ngăn `4096` đã bàn giao **xong 100%** sang `Máy B` (`10.0.0.12:6379`)."
    - "Thư viện Client tự động gửi lại câu lệnh sang `Máy B`."
    - "Đồng thời Client **cập nhật luôn bản đồ lưu trong RAM** để từ lần sau đi thẳng tới `Máy B`."
right:
  title: "-ASK 4096 10.0.0.12:6379"
  badge: "Đang dọn nhà dở dang (Migrating)"
  tone: amber
  items:
    - "Xảy ra khi Ngăn `4096` đang chuyển dở (nửa số khoá còn ở `Máy A`, nửa kia đã sang `Máy B`)."
    - "Client gửi kèm lời chào **`ASKING`** tới `Máy B` cho **riêng lượt truy vấn này**."
    - "Client **chưa sửa bản đồ cố định** cho tới khi toàn bộ ngăn chuyển xong."
```

## 3. Hóa giải lỗi `CROSSSLOT` bằng `{HashTag}` & Tránh bẫy Hot-Slot

Trên Redis Cluster, mọi câu lệnh chạm vào nhiều khóa cùng lúc (`MGET`, `MSET`, `SUNION`, `MULTI/EXEC`, kịch bản `EVAL` Lua) bắt buộc tất cả khóa đó phải nằm trong **cùng 1 Hash Slot**, nếu không sẽ văng lỗi:

```text
(error) CROSSSLOT Keys in request don't hash to the same slot
```

- [+] **Cách giải quyết chuẩn — Gắn `{HashTag}` theo ID đối tượng nhỏ:**
  Khi tên khóa chứa cặp ngoặc `{...}` có ít nhất 1 ký tự ở giữa, Redis chỉ lấy đúng phần bên trong ngoặc đầu tiên để băm `CRC16`:
  - ==`user:{u42}:profile` và `user:{u42}:cart`== -> cùng băm chuỗi `"u42"` -> cùng rơi vào Slot `12182`!
  - Nhờ đó giao dịch thanh toán giỏ hàng của `u42` chạy nguyên tử mượt mà trên cùng 1 máy, trong khi hàng triệu khách hàng `{u43}`, `{u44}`... vẫn được rải đều sang tất cả các máy chủ trong cụm!

> [!WARNING] Đại kỵ số #1 trên Cluster: Đặt nhãn chung `{all}` hoặc `{app}` gây nghẽn "Hot-Slot"!
> Đừng bao giờ "chữa cháy" lỗi `CROSSSLOT` bằng cách đặt tên mọi khóa trong dự án là `cache:{all}:product:1`, `cache:{all}:product:2`...! Khi làm vậy, **100% dữ liệu toàn công ty đều băm đúng chữ `"all"` và đổ dồn hết vào duy nhất 1 máy chủ**, làm máy đó tràn RAM sập nguồn trong khi các máy chủ còn lại ngồi chơi `0%` tải! Luôn gắn `{HashTag}` theo đơn vị nhỏ nhất cần gom nhóm (`{userId}`, `{orderId}`).

## 4. Cấu hình Nút Cluster & Kết nối Smart Client (Python & TypeScript)

Trong tệp cấu hình `redis.conf` của từng nút Cluster, có một tham số quan trọng cần đổi sang `no`:

```ini
port 6379
bind 127.0.0.1 10.0.10.11
protected-mode yes

cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# QUAN TRỌNG: Đổi từ mặc định yes sang no để nếu 1 phân mảnh hỏng cả Master lẫn Replica,
# các phân mảnh khoẻ mạnh còn lại VẪN TIẾP TỤC PHỤC VỤ bình thường!
cluster-require-full-coverage no

appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```

Kết nối tới Redis Cluster cực kỳ đồng nhất trên cả **Python (`redis-py`)** lẫn **Node.js (`ioredis`)**:

```python
# Python (redis-py >= 4.2 tích hợp sẵn RedisCluster chính chủ!):
from redis.cluster import RedisCluster, ClusterNode

rc = RedisCluster(
    startup_nodes=[ClusterNode("10.0.10.11", 6379), ClusterNode("10.0.10.12", 6379)],
    decode_responses=True,
    read_from_replicas=True,  # Tự động chia tải lệnh Đọc sang các Replica!
)

# Dùng {u42} để MSET nhiều khoá an toàn không bao giờ bị lỗi CROSSSLOT:
rc.mset({"user:{u42}:profile": "An", "user:{u42}:cart": "3_items"})
```

```ts
// Node.js / TypeScript (ioredis.Cluster):
import Redis from 'ioredis';

export const cluster = new Redis.Cluster(
  [{ host: '10.0.10.11', port: 6379 }, { host: '10.0.10.12', port: 6379 }],
  { scaleReads: 'slave' }
);
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R15
> 1. **Redis Cluster** chia kho khóa thành cố định ==`16.384` Hash Slots== (`CRC16(key) % 16384`); cụm Production tối thiểu gồm **6 nút** (3 Master + 3 Replica bảo vệ chéo).
> 2. Luôn mở đủ **2 cổng TCP** giữa các nút: cổng dữ liệu `port` (`6379`) và cổng nội bộ **Cluster Bus `port + 10000` (`16379`)**.
> 3. Gom các khóa liên quan vào chung 1 Slot bằng **`{HashTag}` chi tiết** (`{u42}`), tránh tuyệt đối nhãn chung `{all}`, và luôn đặt ==`cluster-require-full-coverage no`==.

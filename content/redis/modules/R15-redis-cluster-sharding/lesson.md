# Redis Cluster & Phân mảnh 16.384 Hash Slots

Ở mô-đun `R14`, kiến trúc **Master–Replica + Sentinel** đã trao cho chúng ta khả năng tự động chuyển đổi dự phòng (*Auto-Failover*), nhưng toàn bộ hệ thống vẫn vấp phải **2 bức tường vật lý không thể xuyên thủng của một Master duy nhất**:
1. **Trần dung lượng RAM & Thời gian `fork()`:** Khi tập dữ liệu chạm ngưỡng `64GB–128GB` trên một tiến trình đơn lẻ, mỗi lần `BGSAVE` hoặc Full Resync làm bảng trang bộ nhớ (*Page Table*) phình to khiến lệnh `fork()` đóng băng luồng chính hàng trăm mili-giây!
2. **Trần thông lượng Ghi (*Write Throughput*):** Mọi bản sao Replica chỉ gánh hộ lưu lượng đọc; 100% lệnh ghi (`SET`, `HSET`, `ZADD`, `XADD`) vẫn đập vào **một nhân CPU duy nhất** của Master (~`100k–150k ops/s`).

Để bẻ gãy hoàn toàn hai giới hạn này — mở rộng tuyến tính lên `1TB RAM` và `1.000.000 lệnh ghi/giây` mà **không cần đặt Proxy đứng giữa làm nghẽn cổ chai** — Redis cung cấp kiến trúc phân mảnh phi tập trung nguyên bản: **==Redis Cluster==**.

> [!ANALOGY] Ẩn dụ 16.384 Ngăn Tủ Bưu Chính & Thẻ Phân Loại `{HashTag}`
> Thay vì giao cả thành phố cho 1 bưu cục duy nhất quản lý, Tổng công ty Bưu chính chia toàn bộ bản đồ thành cố định **16.384 ngăn tủ đánh số từ `0` đến `16383`**.
> - Nếu thành phố có **3 bưu cục lớn (3 Master Shards)**: Bưu cục A giữ ngăn `0..5460`, Bưu cục B giữ ngăn `5461..10922`, Bưu cục C giữ ngăn `10923..16383`. Khi mở thêm Bưu cục D, người ta chỉ việc bưng một vài trăm ngăn tủ từ A, B, C sang D mà không phải đánh số lại từ đầu!
> - Mỗi bức thư (khoá `key`) được máy quét tính mã băm `CRC16(key) mod 16384` để biết chính xác nằm ở ngăn nào. Đặc biệt, nếu ngoài bì thư có kẹp **nhãn ngoặc nhọn `{u42}`** (ví dụ `user:{u42}:profile` và `user:{u42}:cart`), máy quét **chỉ đọc đúng chữ `u42` bên trong ngoặc** — đảm bảo mọi hồ sơ của khách hàng `u42` luôn nằm chung một bưu cục để nhân viên xử lý trọn gói trong một lần giao dịch!

## 1. Giải phẫu Kiến trúc 16.384 Hash Slots & Định tuyến Thông minh

Khác với vòng băm nhất quán truyền thống (*Consistent Hashing Ring*), Redis Cluster sử dụng tầng trung gian cố định gồm **16.384 khe băm (*Hash Slots*)**:

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

> [!TIP] Tại sao Salvatore Sanfilippo (tác giả Redis) chọn con số `16.384` (`2^14`) thay vì `65.536` (`2^16`)?
> Mỗi giây các nút trong cụm gửi gói tin nhịp tim **Gossip (`PING`/`PONG`)** đính kèm bản đồ bitmap các Slot mà mình sở hữu:
> - Ở mức `16.384` slots, bitmap chỉ nặng `16384 / 8 = 2 KB`!
> - Nếu nâng lên `65.536` slots, bitmap sẽ phình lên `8 KB` cho **mọi gói tin nhịp tim**, đốt gấp 4 lần băng thông mạng nội bộ trong khi Redis Cluster thực tế khuyến nghị quy mô tối đa dưới `1.000` nút Master (`16.384` slots là quá dư dả để chia đều)!

## 2. Hai Cổng Mạng Song Hành & Luồng Định Tuyến `-MOVED` vs `-ASK`

Mỗi tiến trình Redis chạy ở chế độ Cluster **bắt buộc mở đồng thời 2 cổng TCP**:
- [>] **Cổng dữ liệu Client (`port`, mặc định `6379`):** Phục vụ ứng dụng bằng giao thức RESP quen thuộc.
- [>] **Cổng Cluster Bus (`port + 10000`, mặc định `16379`):** Giao thức nhị phân tốc độ cao chỉ dành riêng cho các nút Redis trò chuyện ngang hàng (*Node-to-Node Gossip*): phát hiện nút chết, bầu cử thăng cấp Replica lên thay Master gãy (không cần cài thêm Sentinel bên ngoài!), và phát tán bản đồ Slot mới. **Cảnh báo:** Nếu Firewall/Security Group quên mở cổng `16379` giữa các nút, cụm Cluster sẽ kẹt cứng không thể hình thành!

Khi cụm đang vận hành hoặc đang **Resharding trực tuyến** (di chuyển dần từng khoá của Slot `4096` từ `Node A` sang `Node B` mà không dừng dịch vụ), Smart Client xử lý 2 tín hiệu điều hướng:

```visual
kind: compare
title: "Đối chiếu Tín hiệu Điều hướng -MOVED và -ASK khi Di dời Slot (Live Resharding)"
subtitle: "Hiểu rõ cách Smart Client (ioredis / Lettuce / go-redis) tự chữa lành bảng định tuyến mà không rớt request"
left:
  title: "-MOVED 4096 10.0.0.12:6379"
  badge: "Chuyển hộ khẩu Vĩnh viễn"
  tone: emerald
  items:
    - "Xảy ra khi toàn bộ Slot `4096` đã bàn giao **hoàn tất 100%** sang `Node B` (`10.0.0.12:6379`)."
    - "Client lập tức gửi lại lệnh sang `10.0.0.12:6379`."
    - "Đồng thời Client **cập nhật luôn bộ nhớ đệm Slot Map** nội bộ (`CLUSTER SLOTS`) để từ lần sau gọi thẳng `Node B` không hỏi nhầm `Node A` nữa."
right:
  title: "-ASK 4096 10.0.0.12:6379"
  badge: "Đang chuyển nhà dở dang (Migrating)"
  tone: amber
  items:
    - "Xảy ra khi Slot `4096` đang ở trạng thái **MIGRATING** (nửa số khoá còn ở `Node A`, nửa kia đã sang `Node B`) và khoá cần tìm đã sang `Node B`."
    - "Client gửi kèm tiền tố **`ASKING`** rồi mới gửi lệnh chính tới `10.0.0.12:6379` cho **duy nhất lượt truy vấn này**."
    - "Client **KHÔNG** cập nhật bảng Slot Map cố định cho tới khi quá trình di dời hoàn tất."
```

## 3. Cú Sốc Lớn Nhất Khi Lên Cluster: Lỗi `CROSSSLOT` & Nghệ thuật `{HashTag}`

Trên Redis đơn lẻ, bạn thoải mái gõ `MGET user:42:profile user:42:cart` hoặc chạy Lua Script trừ kho và ghi hoá đơn cùng lúc. Nhưng ngay ngày đầu tiên nâng cấp lên Redis Cluster, ứng dụng lập tức nổ tung với lỗi đỏ rực:

```text
(error) CROSSSLOT Keys in request don't hash to the same slot
```

**Nguyên nhân gốc rễ:** `CRC16("user:42:profile") % 16384 = 1096` (nằm ở Máy chủ 1), còn `CRC16("user:42:cart") % 16384 = 8945` (nằm ở Máy chủ 2). Redis Cluster **không hỗ trợ giao dịch hai pha xuyên mạng (*Distributed 2PC*)** vì nó sẽ phá nát độ trễ dưới 1ms! Do đó, mọi thao tác đa khoá (`MGET`, `MSET`, `SUNION`, `RENAME`, `MULTI/EXEC`, `EVAL` Lua) **bắt buộc tất cả các khoá tham gia phải thuộc cùng một Hash Slot**.

- [+] **Giải pháp Chuẩn Kiến trúc — `{HashTag}` theo Thực thể (*Entity-Scoped HashTag*):**
  Quy tắc của bộ giải mã Redis: Nếu trong tên khoá có cặp `{...}` và **có ít nhất 1 ký tự nằm giữa `{` đầu tiên và `}` kế tiếp**, Redis chỉ lấy đúng phần chuỗi bên trong ngoặc đó để tính `CRC16`!
  - `user:{u42}:profile` → băm chuỗi `"u42"` → Slot `12182`
  - `user:{u42}:cart` → băm chuỗi `"u42"` → Slot `12182`
  - `user:{u42}:orders` → băm chuỗi `"u42"` → Slot `12182`
  Ba khoá của khách hàng `u42` chắc chắn `100%` cư trú cùng một Master, cho phép `MSET`, `MGET` và Lua `EVAL` chạy nguyên tử mượt mà, trong khi khách hàng `{u43}`, `{u44}`... vẫn được chia đều hoàn hảo ra khắp các máy chủ khác!

> [!TRAP] Đại Kỵ Kiến Trúc Số 1: Phản mẫu `{all}` hoặc `{global}` gây Hot-Slot (Jumbo Slot)!
> Nhiều lập trình viên lười sửa code khi gặp lỗi `CROSSSLOT` đã đặt tên khoá kiểu `cache:{all}:user:1`, `cache:{all}:user:2`... cho toàn bộ hàng triệu bản ghi! Hậu quả thảm khốc: **100% dữ liệu của toàn công ty cùng băm chữ `"all"` rơi vào đúng 1 Slot duy nhất (`5798`)**! Máy chủ giữ Slot `5798` nổ tung RAM `OOM` và cháy `100%` CPU, còn 9 máy chủ đắt tiền bên cạnh chỉ chiếm `0%` tải! Luôn gắn `{HashTag}` theo **ID hạt mịn** (`{userId}`, `{orderId}`, `{tenantId}`), tuyệt đối không dùng hằng số chung!

## 4. Cấu hình Nút Redis Cluster Chuẩn Production

Dưới đây là tệp `redis-cluster-node.conf` thực chiến đảm bảo tính sẵn sàng cao ngay cả khi một phân mảnh gặp sự cố nghiêm trọng:

```ini
port 6379
bind 127.0.0.1 10.0.10.11
protected-mode yes

# Kích hoạt chế độ Redis Cluster
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# QUAN TRỌNG: Không để 1 phân mảnh gãy kéo sập toàn bộ các phân mảnh khoẻ mạnh khác!
cluster-require-full-coverage no

# Nâng độ bền: cần ít nhất 1 Replica để Master an tâm phục vụ
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
```

- [!] **Lưu ý sống còn về `cluster-config-file nodes.conf`:** Tệp này **KHÔNG PHẢI** do con người tự tay biên tập! Tiến trình Redis tự động sinh ra và cập nhật `nodes.conf` mỗi khi cấu trúc cụm thay đổi (thêm nút, Failover, di dời Slot). Trên Docker/Kubernetes, tệp `nodes.conf` bắt buộc phải nằm trên ổ đĩa bền vững (`/data/nodes.conf`) để khi Pod khởi động lại vẫn nhớ căn cước (`Node ID`) của mình trong cụm.
- [!] **Vì sao phải đổi `cluster-require-full-coverage` từ mặc định `yes` sang `no`?** Ở mặc định `yes`, nếu cụm có 10 phân mảnh mà chẳng may phân mảnh số 7 chết đồng thời cả Master lẫn Replica (mất 10% dữ liệu), Redis sẽ chặn đứng cả **90% người dùng ở 9 phân mảnh hoàn toàn khoẻ mạnh còn lại** bằng lỗi `CLUSTERDOWN The cluster is down`! Đặt `no` giúp khoanh vùng bán kính thiệt hại (*Blast Radius*) chỉ trong đúng phân mảnh bị hỏng.

## 5. Kết nối Smart Client & Tối ưu Pipeline trên Redis Cluster

Trong ứng dụng TypeScript/Node.js thực tế, bạn không bao giờ dùng Client đơn lẻ mà khởi tạo `Cluster` Client (như `ioredis.Cluster`) truyền danh sách các nút hạt giống (*seed nodes*):

```ts
import Redis from 'ioredis';

export const cluster = new Redis.Cluster(
  [
    { host: '10.0.10.11', port: 6379 },
    { host: '10.0.10.12', port: 6379 },
    { host: '10.0.10.13', port: 6379 },
  ],
  {
    scaleReads: 'slave', // Chia tải các lệnh chỉ đọc (GET/HGETALL) sang các Replica
    enableReadyCheck: true,
    maxRedirections: 16,
  }
);

// Mẹo Pipeline trên Cluster: gom các khoá cùng {HashTag} để đạt tốc độ 1-RTT!
export async function checkoutCartAtomic(userId: string) {
  const tag = `{${userId}}`;
  const pipe = cluster.pipeline();
  pipe.hgetall(`user:${tag}:cart`);
  pipe.get(`user:${tag}:voucher`);
  return pipe.exec(); // Cả 2 lệnh bay tới ĐÚNG 1 Master trong 1 gói TCP duy nhất!
}
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R15
> 1. **Redis Cluster** chia không gian khoá thành cố định **`16.384` Hash Slots** theo công thức `CRC16(key) mod 16384`; cụm Production tối thiểu cần **6 nút** (3 Master + 3 Replica bảo vệ chéo).
> 2. Mỗi nút luôn cần mở **2 cổng TCP**: cổng dữ liệu `port` (vd `6379`) và cổng **Cluster Gossip Bus `port + 10000`** (vd `16379`).
> 3. Mọi thao tác đa khoá (`MSET`, `MGET`, `MULTI`, `EVAL`) đòi hỏi các khoá phải chung Hash Slot — hãy dùng **`{HashTag}` cấp thực thể** (như `user:{u42}:profile` và `user:{u42}:cart`), tuyệt đối tránh nhãn toàn cục `{all}` gây nghẽn **Hot-Slot**.
> 4. Luôn cấu hình **`cluster-require-full-coverage no`** trong Production để cô lập bán kính sự cố khi một phân mảnh đơn lẻ mất khả năng phục vụ.

/**
 * Tạo nội dung cho Tab "Câu chuyện & Tư duy giải quyết vấn đề" (Story & Mindset) ở cột phải bàn học.
 * Kết hợp câu chuyện bối cảnh thực chiến (Real-world scenario & naive-to-production mindset)
 * với bản đồ tiến hoá kiến trúc qua từng bước của bài học.
 */
import type { BilingualText } from '@/components/scale-workbench/types';
import type { SdModule, SdStepBlock } from '../types';

interface StoryEntry {
  hookTitle: string;
  scenario: string;
  naiveAttempt: string;
  mindsetShift: string;
}

const CURATED_STORIES: Record<string, StoryEntry> = {
  'S0-01': {
    hookTitle: 'Buổi phỏng vấn "Vì sao em chọn Redis?" và cái bẫy 15 Microservices',
    scenario:
      'Trong một buổi thiết kế hệ thống, khi được hỏi làm sao tăng tốc trang chủ đang phản hồi chậm 3 giây, phản xạ phổ biến nhất của người mới là trả lời ngay: "Em sẽ dựng thêm Redis Cache vì Redis rất nhanh". Một trường hợp khác: một nhóm khởi nghiệp chưa có người dùng thực tế đã quyết định tách sản phẩm thành 15 Microservices ngay từ tháng đầu tiên vì đọc blog của các tập đoàn lớn.',
    naiveAttempt:
      'Nhảy thẳng vào công cụ quen thuộc (Code-first / Solution-first) trước khi đo đạc: lắp xong cụm Redis mới phát hiện 85% độ trễ nằm ở 1 câu SQL thiếu Index hoặc gọi API bên thứ ba. Với nhóm tách 15 Microservices sớm, mỗi lần sửa 1 trường dữ liệu nhỏ phải phối hợp deploy suốt 2 giờ và gỡ lỗi qua hàng chục chặng mạng.',
    mindsetShift:
      'Công nghệ giống như thuốc điều trị: không bao giờ kê đơn trước khi xét nghiệm triệu chứng. Hãy luôn đi theo chiều thuận: Định lượng triệu chứng (chậm ở đâu, bao nhiêu ms) → Hỏi Why tìm nguyên nhân gốc → Đặt các phương án từ đơn giản nhất (thêm Index, giữ Modular Monolith) lên bàn cân chi phí vận hành rồi mới chọn.',
  },
  'S0-02': {
    hookTitle: 'Ảo tưởng về "Kiến trúc hoàn hảo không điểm yếu"',
    scenario:
      'Một kỹ sư muốn thiết kế hệ thống vừa có độ trễ dưới 10 ms, vừa nhất quán tuyệt đối 100% không bao giờ đọc phải dữ liệu cũ, vừa chịu được đứt cáp liên lục địa mà chi phí hạ tầng lại thấp nhất.',
    naiveAttempt:
      'Cố gắng tối ưu đồng thời mọi trục kỹ thuật (vừa bật sao chép đồng bộ xuyên vùng để giữ nhất quán, vừa đòi độ trễ ghi cực thấp). Kết quả là hệ thống bị kẹt bởi giới hạn vật lý của tốc độ ánh sáng trong cáp quang và chi phí vận hành đội lên gấp nhiều lần ngân sách.',
    mindsetShift:
      'Trong thiết kế hệ thống, không có giải pháp tốt nhất tuyệt đối — chỉ có sự đánh đổi (Trade-off) phù hợp nhất với bối cảnh hiện tại. Mọi lựa chọn thêm vào (như thêm Cache) đều là một hợp đồng hai mặt: mua tốc độ đọc bằng cái giá của độ phức tạp làm mới dữ liệu (Cache Invalidation) và chi phí RAM.',
  },
  'S0-03': {
    hookTitle: 'Khi ứng dụng vượt khỏi phạm vi một hàm trong mã nguồn',
    scenario:
      'Khi mới học lập trình, toàn bộ ứng dụng nằm gọn trong một tiến trình duy nhất nói chuyện với một tệp dữ liệu cục bộ. Nhưng khi hàng chục nghìn người dùng cùng bấm nút "Đăng ảnh" một lúc, một máy chủ đơn lẻ vừa nhận kết nối mạng, vừa nén ảnh, vừa ghi ổ đĩa sẽ lập tức treo cứng.',
    naiveAttempt:
      'Cố tối ưu từng vòng lặp `for` trong code nhưng vẫn giữ mọi vai trò (đón lưu lượng, xử lý nghiệp vụ, lưu trữ nóng, xử lý nền) nhồi chung vào một khối duy nhất.',
    mindsetShift:
      'Chuyển góc nhìn từ "viết hàm" sang "ghép nối các khối chuyên biệt" (Building Blocks): để Load Balancer lo chia tải ở cửa ngõ, App Server phi trạng thái lo nghiệp vụ, Cache lo dữ liệu đọc nóng trên RAM, Database giữ nguồn sự thật bền vững, và Message Queue + Worker tách riêng các việc nặng chạy nền.',
  },
  'S0-04': {
    hookTitle: 'Bản vẽ đẹp trên bảng trắng nhưng sập ngay tuần đầu vận hành',
    scenario:
      'Một kiến trúc đa tầng sử dụng Kafka, Elasticsearch, Redis Cluster và Kubernetes được vẽ rất hoành tráng, nhưng đội kỹ thuật chỉ có 3 lập trình viên Backend chưa từng vận hành Kubernetes và ngân sách đám mây tối đa là 300 USD/tháng.',
    naiveAttempt:
      'Thiết kế trong môi trường chân không (giả định CPU, RAM, băng thông mạng, số kết nối Database và nhân sự trực đêm là vô hạn).',
    mindsetShift:
      'Kỹ thuật thực chất là nghệ thuật giải bài toán dưới các ràng buộc (Constraints). Giới hạn phần cứng (RAM 128 GB, ổ đĩa IOPS, trần kết nối Postgres) và giới hạn con người (quy mô đội ngũ, thời gian ra mắt) không phải là rào cản phụ, mà chính là những đường biên trực tiếp định hình bản thiết kế.',
  },
  'S0-05': {
    hookTitle: '3 phút tính nhẩm trên giấy nháp cứu cả dự án khỏi chọn sai kiến trúc',
    scenario:
      'Đề bài yêu cầu thiết kế hệ thống phục vụ "10 triệu người dùng hoạt động mỗi ngày (10M DAU), mỗi người thực hiện 20 thao tác". Nghe con số 200 triệu lượt mỗi ngày, nhiều người mới hoảng sợ nghĩ ngay tới việc phải dựng hàng trăm máy chủ và phân mảnh cơ sở dữ liệu phức tạp.',
    naiveAttempt:
      'Đoán mò quy mô bằng cảm tính ("200 triệu là rất to nên chắc chắn phải dùng NoSQL Sharding ngay từ ngày đầu").',
    mindsetShift:
      'Dùng phép tính nhẩm (Napkin Math) với hằng số vàng `86.400 giây/ngày ≈ 100.000 giây`: 200 triệu lượt/ngày chia cho `100.000` chỉ tương đương **2.000 req/s trung bình** (và khoảng `6.000 req/s` ở đỉnh tải ×3). Con số định lượng này chỉ ra ngay rằng 2–3 máy App kết hợp một tầng Redis Cache và 1 cụm Postgres có Read Replica là đã dư sức gánh, không hề cần Sharding phức tạp!',
  },
  'S1-01': {
    hookTitle: 'Câu hỏi kinh điển lúc 2 giờ sáng: "API đang chậm ở chặng nào?"',
    scenario:
      'Người dùng phàn nàn trang chi tiết sản phẩm tải mất hơn 600 ms. Trong cuộc họp khẩn, người đề xuất nâng gấp đôi số máy App Server, người đòi đổi ngôn ngữ lập trình, người lại bảo do mạng người dùng yếu.',
    naiveAttempt:
      'Sửa mò ở tầng dễ thấy nhất (thêm máy App Server hoặc sửa code giao diện) mà không bóc tách đường đi của request qua từng thành phần.',
    mindsetShift:
      'Nhìn hệ thống như một dây chuyền gồm 5 trạm nối tiếp (`Client 50ms → Load Balancer 5ms → App Server 20ms → Cache / Database 500ms`). Khi đo từng trạm, bạn thấy ngay Database đang chiếm 86% tổng thời gian — mọi nỗ lực tối ưu ở App Server chỉ giúp tiết kiệm vài mili-giây vô nghĩa nếu không giải quyết trạm Database.',
  },
  'S1-02': {
    hookTitle: 'Bài học 98 giây chờ tải video và trình duyệt quay vòng vô tận',
    scenario:
      'Trong phiên bản đầu tiên của tính năng tải video lên hệ thống, lập trình viên viết một hàm xử lý đồng bộ duy nhất: lưu file gốc lên S3 (2 giây) → cắt ảnh thu nhỏ thumbnail (5 giây) → chuyển mã sang 720p (30 giây) → chuyển mã sang 1080p (60 giây) → gửi email thông báo (1 giây).',
    naiveAttempt:
      'Bắt kết nối HTTP của người dùng đứng chờ toàn bộ 5 bước chạy tuần tự xong mới trả về `200 OK`. Tổng thời gian chờ là **98 giây**! Kết quả là cổng Gateway tự cắt kết nối Timeout ở giây thứ 60, còn lúc có 50 người cùng tải video thì toàn bộ luồng (worker threads) của máy chủ bị treo sạch.',
    mindsetShift:
      'Tách bạch rạch ròi giữa "việc người dùng cần kết quả ngay để đi tiếp" (lưu file gốc 2 giây) và "việc nặng có thể hoàn tất ở hậu trường" (96 giây chuyển mã). Chỉ cần đẩy một thông điệp vào **Message Queue** rồi trả ngay `202 Accepted` sau 2 giây, trải nghiệm người dùng trở nên tức thì và cụm Worker phía sau có thể nhịp nhàng xử lý theo đúng sức của mình.',
  },
  'S1-06': {
    hookTitle: 'Database chỉ chạy mất 5 ms nhưng người dùng ở xa vẫn chờ hơn 1 giây',
    scenario:
      'Trên bảng giám sát nội bộ tại trung tâm dữ liệu Singapore, thời gian xử lý trung bình của API và Database chỉ là 12 ms. Thế nhưng khách hàng truy cập mạng di động 4G từ châu Âu hoặc Bắc Mỹ lại báo trang đầu tiên mất hơn 1.000 ms mới hiển thị.',
    naiveAttempt:
      'Chỉ nhìn vào log thời gian thực thi bên trong code Backend (`controller + SQL query`) mà quên mất hành trình vật lý trên đường truyền mạng trước khi byte đầu tiên chạm tới code của bạn.',
    mindsetShift:
      'Trước khi Web Server đọc được dòng HTTP đầu tiên, trình duyệt của khách phải đi qua chuỗi bắt tay nhiều vòng khứ hồi (RTT): phân giải DNS (1 RTT) → bắt tay TCP 3 bước `SYN / SYN-ACK / ACK` (1 RTT) → bắt tay mật mã TLS (1–2 RTT) → gửi HTTP request (1 RTT). Khi mỗi vòng RTT xuyên lục địa mất 200 ms, riêng việc thiết lập kết nối đã ngốn gần 1 giây! Hiểu thác nước (Waterfall) này giúp bạn biết phải dùng CDN Edge, Keep-Alive, TLS 1.3 (1-RTT) và HTTP/2 Multiplexing thay vì cặm cụi tối ưu câu SQL 5 ms.',
  },
  'S1-07': {
    hookTitle: 'Nghịch lý CPU mới 90% nhưng hệ thống đã chậm gấp 10 lần',
    scenario:
      'Giám đốc kỹ thuật nhìn biểu đồ thấy CPU cụm máy chủ trung bình ở mức 92% ("vẫn còn dư 8% công suất, chưa chạm 100%"), nhưng trên thực tế độ trễ đuôi p99 của khách hàng đã vọt từ 15 ms lên tới 400 ms và hàng đợi kết nối liên tục báo động đỏ.',
    naiveAttempt:
      'Tư duy tuyến tính kiểu "máy chạy 50% tải mất 10 ms thì chạy 95% tải chắc cũng chỉ mất khoảng 19 ms".',
    mindsetShift:
      'Theo lý thuyết hàng đợi ($W = S / (1 - \\rho)$), khi mức sử dụng $\\rho$ vượt qua ngưỡng 75–80%, thời gian chờ trong hàng đợi không tăng cộng thêm mà **dựng đứng theo hàm mũ** (đường cong gậy khúc côn cầu Hockey-Stick)! Cộng thêm Định luật Little ($L = \\lambda \\cdot W$), khi độ trễ $W$ tăng gấp 10 lần thì số luồng bị ngâm đồng thời $L$ cũng phình gấp 10 lần, làm cạn sạch Connection Pool. Đó là lý do các hệ thống thực tế luôn phải giữ khoảng thở (Headroom) ở mức $\\rho \\le 70\\%$.',
  },
  'S2-01': {
    hookTitle: 'Đêm Black Friday lưu lượng tăng 50 lần và bài toán 5 máy chủ rời rạc',
    scenario:
      'Bình thường hệ thống thương mại điện tử chạy êm trên 1 máy chủ đơn lẻ (công suất tối đa 1.000 req/s, tải ngày thường 800 req/s). Đêm Black Friday, lưu lượng vọt lên **5.000 req/s** — thời gian phản hồi nhảy từ 200 ms lên 15 giây rồi máy chủ sập hoàn toàn.',
    naiveAttempt:
      'Phương án 1 (Scale Up): Nâng cấp máy chủ từ 4 CPU / 8GB RAM ($200/tháng) lên 16 CPU / 64GB RAM ($1.200/tháng), nhưng cũng chỉ chịu được 4.000 req/s là đụng trần và vẫn là điểm lỗi đơn (SPOF). Phương án 2 (Scale Out): Thuê 5 máy nhỏ ($200/máy = $1.000/tháng, tổng công suất 5.000 req/s), nhưng vừa bật 5 máy có 5 địa chỉ IP khác nhau lên thì cả đội sững lại: **"Làm sao ứng dụng của khách hàng biết phải gửi request vào máy nào, và nhỡ máy số 3 bị sập thì sao?"**',
    mindsetShift:
      'Load Balancer ra đời không chỉ để "chia đều request", mà để **biến một dàn máy chủ rời rạc thành một thực thể dịch vụ thống nhất** phía sau một địa chỉ Virtual IP duy nhất. Khi đi vào vận hành thực tế, bạn sẽ thấy chia đều mù quáng (Round Robin) vẫn chết nếu có những request báo cáo nặng nhẹ khác nhau (cần **Least Connections**), máy sập ngầm cần **Health Check** tự động cách ly, và chính bản thân Load Balancer cũng phải có cặp **Active-Standby** để không trở thành điểm chết duy nhất.',
  },
  'S2-02': {
    hookTitle: 'Cú sốc khi Cache Hit Ratio chỉ giảm 4% nhưng Database lại sập vì tải tăng gấp 5 lần',
    scenario:
      'Hệ thống đang phục vụ 10.000 lượt đọc/giây với Redis Cache đạt tỷ lệ trúng (Hit Ratio) 99% — tức chỉ có 1% (100 req/s) đi xuống Database. Sau một đợt cập nhật danh mục làm Hit Ratio tụt nhẹ từ **99% xuống 95%**, toàn bộ cụm Database bất ngờ quá tải 100% CPU và ngừng phản hồi.',
    naiveAttempt:
      'Nghĩ đơn giản rằng "Hit Ratio giảm từ 99% xuống 95% là chỉ giảm có 4%, sao Database lại chết được?". Ngoài ra, đặt cùng một thời gian hết hạn `TTL = 3600s` cho tất cả các khóa熱門 lúc nửa đêm.',
    mindsetShift:
      'Tải đổ xuống Database phụ thuộc vào **Tỷ lệ trượt (Miss Ratio = $1 - h$)** chứ không phải Hit Ratio! Khi Hit Ratio giảm từ 99% xuống 95%, tỷ lệ trượt tăng từ **1% lên 5% — tức tải đọc dội thẳng vào Database tăng gấp 5 lần (từ 100 lên 500 req/s)**! Và khi một khóa cực nóng hết hạn TTL đúng lúc có 5.000 người cùng truy cập (Cache Stampede), cả 5.000 request cùng thấy Miss và lao xuống đánh sập Database nếu bạn không dùng **TTL Jitter** (cộng độ lệch ngẫu nhiên) và **Singleflight / Mutex Lock** (chỉ cử 1 luồng đi lấy dữ liệu mới).',
  },
  'S2-06': {
    hookTitle: 'Khách hàng vừa đăng nhập xong, bấm chuyển trang thì bị văng ra bắt đăng nhập lại',
    scenario:
      'Khi hệ thống chỉ chạy trên 1 máy App Server duy nhất, việc lưu biến `session[user_id]` trong bộ nhớ RAM của tiến trình hoặc lưu ảnh đại diện người dùng vào thư mục `/uploads` trên ổ cứng máy đó chạy hoàn toàn bình thường. Nhưng ngay ngày đầu tiên thêm máy App thứ 2 phía sau Load Balancer, tổng đài ngập tràn khiếu nại: cứ bấm sang trang thứ hai là bị mất giỏ hàng và văng khỏi tài khoản!',
    naiveAttempt:
      'Bật chế độ dính phiên (Sticky Session / IP Hash) trên Load Balancer để ép một người dùng luôn quay về đúng máy App A. Nhưng khi máy App A khởi động lại để cập nhật code hoặc gặp sự cố, hàng nghìn khách hàng đang dính vào máy A lập tức mất sạch giỏ hàng, còn ảnh tải lên ở máy A thì máy B không sao đọc được.',
    mindsetShift:
      'Muốn mở rộng ngang tự do, tầng App Server bắt buộc phải **Phi trạng thái (Stateless)** — coi mỗi máy App như một công nhân có thể thay thế bất kỳ lúc nào giữa hai request liên tiếp. Mọi trạng thái phiên phải được đẩy ra kho dùng chung bên ngoài (**Redis Session Store** hoặc thẻ **JWT** có chữ ký số), và mọi tệp tải lên phải cất vào **Object Storage (S3)**.',
  },
  'S2-08': {
    hookTitle: 'Hiện tượng "Ảo ảnh": Khách vừa bấm Lưu hồ sơ xong, tải lại trang thấy dữ liệu biến mất!',
    scenario:
      'Để giảm tải cho Database chính, đội kỹ thuật tách luồng Ghi vào `Primary DB` và đẩy toàn bộ luồng Đọc sang 3 máy `Read Replicas` sao chép bất đồng bộ. Ngay chiều hôm đó, khách hàng báo lỗi: họ vừa đổi số điện thoại và bấm Lưu (thành công), trang web tự tải lại thì vẫn hiện số điện thoại cũ, khiến họ tưởng nút Lưu bị hỏng nên bấm Lưu đi Lưu lại hàng chục lần.',
    naiveAttempt:
      'Định tuyến cứng nhắc "mọi lệnh `INSERT/UPDATE` vào Primary, mọi lệnh `SELECT` vào Read Replica ngẫu nhiên" mà quên mất độ trễ sao chép (Replication Lag) vài trăm mili-giây.',
    mindsetShift:
      'Sao chép bất đồng bộ luôn có một khoảng trễ vật lý (WAL shipping + apply). Đối với dữ liệu của người khác thì trễ 1 giây không sao, nhưng với **dữ liệu do chính người dùng đó vừa sửa**, hệ thống bắt buộc phải đảm bảo tính chất **Read-Your-Writes** (bằng cách ghim lượt đọc của chính user đó về `Primary` trong 3–5 giây sau khi ghi, hoặc đính kèm mốc vị trí `LSN / GTID` để chỉ đọc từ Replica nào đã bắt kịp mốc đó).',
  },
  'S2-09': {
    hookTitle: 'Khi 15 phân mảnh Database ngồi chơi nhưng hệ thống vẫn sập vì 1 phân mảnh bốc cháy',
    scenario:
      'Hệ thống đã được chia thành 16 phân mảnh (Shards) theo hàm băm `hash(author_id) mod 16`. Trong ngày thường tải rải rất đều. Nhưng khi một ca sĩ nổi tiếng (hoặc một gian hàng Flash Sale) mở bán sản phẩm độc quyền, toàn bộ 80% lưu lượng của cả nền tảng đều truy vấn vào đúng 1 `author_id` duy nhất — làm `Shard #3` quá tải 100% và sập, trong khi 15 Shard còn lại chỉ chạy ở mức 5% CPU.',
    naiveAttempt:
      'Cố tăng tổng số phân mảnh từ 16 lên 32 hoặc 64 Shard. Nhưng vì mọi truy vấn của mặt hàng đó vẫn có chung 1 khóa `author_id`, tất cả 100% tải nóng vẫn tiếp tục rơi vào đúng 1 Shard duy nhất!',
    mindsetShift:
      'Hàm băm chỉ rải đều khi có nhiều khóa khác nhau, chứ hoàn toàn bất lực trước **một khóa đơn lẻ siêu nóng (Hot Key / phân phối Zipf)**. Để phá điểm nóng này, bạn phải kết hợp **Hot-Key Cache** ở tầng trước và kỹ thuật **Tách khóa (Key Salting / Sub-sharding)**: gắn thêm hậu tố ngẫu nhiên `hotkey#0 .. hotkey#7` lúc ghi để dàn trải tải của 1 thực thể nóng ra 8 phân mảnh khác nhau.',
  },
  'S2-10': {
    hookTitle: 'Thảm kịch thêm 1 máy Cache mới làm sập toàn bộ Database phía sau',
    scenario:
      'Cụm 3 máy Cache đang gánh 95% tải đọc cho Database bằng công thức định tuyến quen thuộc `node = hash(key) mod 3`. Khi lưu lượng tăng cao vào giờ cao điểm, kỹ sư trực hệ thống tự tin bật thêm máy Cache thứ 4 (`mod 4`) để tăng công suất.',
    naiveAttempt:
      'Dùng phép chia lấy dư `hash(key) mod N` cho một cụm máy chủ có lưu trạng thái (Stateful Cache / Storage shards). Ngay khoảnh khắc đổi từ `mod 3` sang `mod 4`, có tới **3/4 (75%) tổng số khóa bị đổi kết quả phép chia** và trỏ sang máy khác chưa có dữ liệu! Cả cụm Cache biến thành "Cache rỗng" cùng một lúc, đẩy cơn lũ 75% Cache Miss dội thẳng xuống đánh sập Origin Database.',
    mindsetShift:
      'Với các tầng có trạng thái, thêm hoặc bớt 1 máy chỉ được phép làm xê dịch phần dữ liệu của đúng chiếc máy đó ($1/N$). Bằng cách uốn không gian băm thành một **Vòng tròn băm nhất quán (Consistent Hashing Ring)** kết hợp hàng trăm **Nút ảo (Virtual Nodes)** đan xen, việc thêm máy thứ 4 chỉ lấy bớt đúng ~25% khóa từ các máy cũ, giữ ấm 75% dữ liệu còn lại và bảo vệ an toàn cho Database.',
  },
  'S2-11': {
    hookTitle: 'Đơn hàng đã lưu vào Database nhưng khách không bao giờ nhận được hàng vì mất sự kiện',
    scenario:
      'Sau khi tách hệ thống sang kiến trúc hướng sự kiện (Pub/Sub), hàm xử lý đặt hàng thực hiện 2 dòng lệnh liên tiếp: dòng 1 `orderDb.save(order)` (đã COMMIT thành công), dòng 2 `eventBus.publish("OrderCreated", order)`. Đúng vào mili-giây giữa dòng 1 và dòng 2, container ứng dụng bị khởi động lại hoặc mạng tới Kafka chập chờn.',
    naiveAttempt:
      'Thực hiện **Ghi kép (Dual-Write)** trực tiếp từ code ứng dụng vào hai hệ thống lưu trữ khác nhau (Database và Message Broker) mà không có cơ chế nguyên tử.',
    mindsetShift:
      'Bạn không thể bắt SQL Database và Kafka cùng tham gia một giao dịch nhanh mà không giảm hiệu năng. Thay vào đó, hãy gom cả hai vào **cùng một giao dịch ACID cục bộ trên chính Database** bằng mẫu **Transactional Outbox**: ghi bản ghi `orders` và bản ghi sự kiện `outbox_events` trong cùng một lệnh `COMMIT`, sau đó để một tiến trình Relay / CDC độc lập đọc bảng `outbox` đẩy lên Event Bus theo cơ chế At-Least-Once kết hợp với người nhận lũy đẳng (Idempotent Consumer).',
  },
  'S3-01': {
    hookTitle: 'Khi cáp quang biển bị đứt: Khoá giao dịch để giữ đúng số dư hay vẫn cho khách mua hàng?',
    scenario:
      'Một nền tảng thương mại và ví điện tử vận hành hai trung tâm dữ liệu tại Mỹ (US) và châu Âu (EU). Giữa giờ giao dịch, đường trục mạng liên lục địa giữa US và EU bị đứt hoàn toàn (Network Partition) — cả hai cụm máy chủ vẫn sống khỏe mạnh nhưng không thể nói chuyện với nhau.',
    naiveAttempt:
      'Đòi hỏi hệ thống vừa phải cho phép khách ở cả hai bên nạp/rút tiền và đặt hàng bình thường 100% (Availability), vừa phải đảm bảo số dư ví và chiếc vé cuối cùng không bao giờ bị chi tiêu kép giữa hai châu lục (Strong Consistency).',
    mindsetShift:
      'Trong mạng phân tán, chia cắt mạng ($P$) là sự thật vật lý không thể tránh khỏi. Định lý CAP và mở rộng PACELC dạy chúng ta không áp dụng một chính sách cứng nhắc cho toàn bộ công ty, mà phải **phân tách theo nghiệp vụ**: với **Sổ cái trừ tiền / Giữ chiếc ghế cuối** thì bắt buộc chọn **CP** (thà báo lỗi tạm ngưng ở nhánh thiểu số còn hơn âm tiền); nhưng với **Giỏ hàng / Bảng tin / Lượt thích** thì chọn **AP** (cho phép ghi ở cả hai nơi rồi hợp nhất dữ liệu sau khi mạng nối lại).',
  },
  'S3-03': {
    hookTitle: 'Cơn ác mộng "Hai Vua" (Split-Brain) và bóng ma Zombie Leader sau kỳ nghỉ Garbage Collection',
    scenario:
      'Trong một cụm 2 máy chủ Primary-Standby, đường mạng kiểm tra nhịp tim (Heartbeat) giữa hai máy bị nghẽn trong 3 giây. Máy Standby tưởng Primary đã chết nên tự phong mình làm Primary mới. Cùng lúc đó, Primary cũ thực chất vẫn đang sống (chỉ vừa trải qua một đợt tạm dừng JVM Garbage Collection dài 5 giây) — giờ đây cả hai máy cùng nhận lệnh ghi và ghi đè nát dữ liệu của nhau!',
    naiveAttempt:
      'Dùng cụm số chẵn (2 máy) tự thăng cấp khi mất kết nối, và để kho lưu trữ bên dưới chấp nhận mọi lệnh ghi từ bất kỳ máy nào tự xưng là Leader.',
    mindsetShift:
      'Đồng thuận phân tán (như thuật toán **Raft**) giải quyết bài toán này bằng hai chốt chặn: (1) **Đa số quá bán (Majority Quorum $\\lfloor N/2 \\rfloor + 1$)** trên số máy lẻ (3 hoặc 5 máy) cùng **Nhiệm kỳ tăng dần (Term)** để tại một nhiệm kỳ chỉ có tối đa 1 nhánh đủ phiếu bầu Leader; và (2) **Thẻ rào chắn (Fencing Token)** tăng đơn điệu đính kèm vào mọi lệnh ghi để chính kho lưu trữ tự từ chối các lệnh ghi trễ từ một Zombie Leader có số Term cũ.',
  },
  'S3-04': {
    hookTitle: 'Trừ tiền thẻ thành công nhưng hết phòng khách sạn — vì sao không thể gõ lệnh ROLLBACK?',
    scenario:
      'Khách hàng đặt gói du lịch trọn gói gồm 3 bước qua 3 dịch vụ độc lập: (1) `Flight Service` giữ ghế máy bay (thành công, đã COMMIT vào Flight DB), (2) `Payment Service` trừ 15 triệu trong thẻ khách (thành công, đã COMMIT vào Payment DB), (3) `Hotel Service` đặt phòng khách sạn — nhưng đúng giây đó căn phòng cuối cùng vừa hết và `Hotel DB` trả về lỗi!',
    naiveAttempt:
      'Cách 1: Quên xử lý lỗi liên dịch vụ khiến khách mất 15 triệu mà chuyến đi không thành. Cách 2: Bọc cả 3 dịch vụ vào giao thức khóa chặn **2-Phase Commit (2PC)** — nhưng khi bộ điều phối Coordinator bị treo ở giữa Pha 1 (Prepare) và Pha 2 (Commit), toàn bộ các dòng dữ liệu ghế bay và số dư trong 3 Database bị khóa cứng (in-doubt locks) làm tê liệt cả hệ thống!',
    mindsetShift:
      'Khi đã tách Database riêng cho từng dịch vụ, hãy từ bỏ giấc mơ giữ khóa giao dịch toàn cục kéo dài qua mạng. Thay vào đó, hãy dùng mẫu **Saga**: cho phép từng bước `T1, T2` commit cục bộ ngay lập tức để giải phóng khóa, nhưng thiết kế sẵn cặp **Giao dịch bù trừ ngược chiều (`C2: Hoàn tiền`, `C1: Hủy giữ vé`)** có tính lũy đẳng (Idempotent), đồng thời sắp xếp bước dễ thất bại nhất (kiểm tra phòng khách sạn) lên làm trước bước trừ tiền!',
  },
  'S3-05': {
    hookTitle: 'Vì sao dùng UUID v4 ngẫu nhiên làm khoá chính lại khiến Database chậm đi 10 lần khi bảng lớn?',
    scenario:
      'Khi tách Database đơn hàng thành nhiều phân mảnh, nhóm bỏ `AUTO_INCREMENT` (vì sinh trùng ID `1, 2, 3` giữa các máy) và chuyển sang dùng `UUID v4` (chuỗi 36 ký tự ngẫu nhiên hoàn toàn như `f47ac10b-58cc-...`) làm khóa chính `PRIMARY KEY` trong MySQL/Postgres. Ở 1 triệu dòng đầu mọi thứ rất êm, nhưng khi bảng vượt mốc 150 triệu dòng, ổ đĩa NVMe bỗng nhiên bận 100% IOPS và tốc độ ghi đơn hàng mới tụt dốc thê thảm.',
    naiveAttempt:
      'Chọn `UUID v4` ngẫu nhiên 128-bit làm Clustered Primary Key mà không để ý đến cấu trúc vật lý của cây chỉ mục B+Tree trên ổ đĩa.',
    mindsetShift:
      'Cây chỉ mục B+Tree lưu các dòng dữ liệu sắp xếp theo thứ tự khóa chính trong các trang đĩa 16 KB. Khi ID tăng dần theo thời gian, bản ghi mới luôn được nối gọn vào trang cuối cùng đang nằm sẵn trên RAM. Ngược lại, vì `UUID v4` ngẫu nhiên hoàn toàn, mỗi đơn hàng mới lại đâm vào một trang bất kỳ ở giữa cây, ép Database phải đọc trang cũ từ đĩa lên, **tách đôi trang (Page Split)** và gây phân mảnh nặng. Giải pháp vừa không cần máy chủ cấp số tập trung, vừa thân thiện 100% với B+Tree là dùng định danh **có thứ tự thời gian ở các bit đầu** như **Snowflake 64-bit** (`41 bit timestamp + 10 bit machine + 12 bit sequence`) hoặc **UUID v7**!',
  },
  'S3-07': {
    hookTitle: 'Hai khách hàng cùng nhận được vé của chiếc ghế A12 duy nhất và sai lầm gọi API trong Transaction',
    scenario:
      'Trong đợt mở bán vé hòa nhạc, chỉ còn duy nhất ghế `A12` đang trống (`status = AVAILABLE`). Đúng ở mili-giây `10:00:00.120`, hai yêu cầu của khách A và khách B cùng chạy câu `SELECT status FROM seats WHERE id = "A12"` trên hai máy App. Cả hai cùng thấy `AVAILABLE`, cùng chạy `UPDATE seats SET status = "BOOKED", user = ...` rồi cùng báo đặt vé thành công!',
    naiveAttempt:
      'Bọc câu `SELECT` và `UPDATE` vào trong `BEGIN ... COMMIT` ở mức cô lập mặc định `Read Committed` và tin rằng có chữ Transaction là Database sẽ tự chặn đọc trùng. Sau khi sửa bằng `SELECT ... FOR UPDATE`, lập trình viên lại đặt luôn lời gọi HTTP sang cổng thanh toán Visa/Mastercard (mất 1,5 giây) vào bên trong khối giữ khóa đó — làm 100 kết nối Database bị ngâm cứng và toàn trang web sập chỉ sau 3 giây!',
    mindsetShift:
      'Một nguyên tắc sống còn: **Không bao giờ gọi mạng ra dịch vụ bên ngoài khi đang mở Transaction giữ khóa trong Database!** Hãy tách quy trình đặt vé thành 2 pha rõ rệt: Pha 1 dùng giao dịch cực ngắn (< 5 ms với khóa bi quan `SELECT FOR UPDATE` hoặc kiểm soát lạc quan `WHERE version = v`) để chuyển ghế sang trạng thái **Giữ chỗ tạm (`RESERVED`, hết hạn sau 5 phút)** rồi `COMMIT` ngay; Pha 2 mới thong thả gọi cổng thanh toán ở ngoài Transaction rồi quay lại chốt `CONFIRMED`.',
  },
  'S4-05': {
    hookTitle: 'Một script cào dữ liệu của đối thủ làm sập toàn bộ trang mua hàng của khách thật',
    scenario:
      'Lúc 9 giờ sáng, một bot tự động từ vài địa chỉ IP bắn liên tục 4.000 req/s vào API tìm kiếm sản phẩm để cào giá. Vì hệ thống không có tầng kiểm soát tốc độ ở cửa ngõ, toàn bộ 4.000 req/s này đi xuyên qua API Gateway xuống thẳng Database, làm các khách hàng thật đang thanh toán giỏ hàng gặp lỗi `504 Gateway Timeout`.',
    naiveAttempt:
      'Viết một biến đếm `counter` lưu trong bộ nhớ RAM cục bộ của từng máy API Gateway theo cửa sổ phút cố định (Fixed Window). Hệ quả là: (1) khi có 5 máy Gateway, kẻ tấn công vẫn lọt qua gấp 5 lần hạn mức; (2) kẻ tấn công bắn dồn ở giây `00:59` và giây `01:01` lọt qua gấp đôi tải ở ranh giới phút; và (3) khi dùng Redis tập trung nhưng viết `GET` rồi `INCR` tách rời thì bị lỗi Race Condition dưới tải đồng thời cao.',
    mindsetShift:
      'Rate Limiting hiệu quả ở quy mô phân tán cần thuật toán **Token Bucket** (cho phép người dùng thật bấm nhanh một cụm ngắn `burst` nhưng vẫn kẹp chặt tốc độ trung bình dài hạn `ratePerSec`) hoặc **Sliding Window Counter**, được thực thi nguyên tử bằng một kịch bản **Redis Lua Script** duy nhất tại tầng rìa và trả về mã `429 Too Many Requests` kèm header `Retry-After` rõ ràng.',
  },
  'S4-10': {
    hookTitle: 'Cái bẫy "Hàng đợi không giới hạn": Server báo 202 Accepted nhưng 100% người dùng đều Timeout!',
    scenario:
      'Để tránh làm rơi request khi tải tăng đột biến lên 2.000 req/s (trong khi Worker phía sau chỉ xử lý được 1.000 req/s), đội kỹ thuật cấu hình một hàng đợi không giới hạn dung lượng (`Unbounded Queue`). Sau 2 phút, hàng đợi tích tụ 120.000 yêu cầu.',
    naiveAttempt:
      'Tưởng rằng "cứ nhận hết vào hàng đợi để không mất request nào là tốt nhất". Nhưng với 120.000 việc đang xếp hàng và tốc độ xử lý 1.000 việc/giây, mỗi request mới vào phải nằm chờ trong hàng đợi đúng **120 giây** mới tới lượt! Trong khi đó ứng dụng khách hàng đã cắt kết nối Timeout từ giây thứ 5. Vậy là các máy chủ Worker vẫn gồng mình chạy 100% CPU chỉ để xử lý những yêu cầu mà người dùng đã bỏ đi từ lâu (**Goodput = 0%**) trước khi cả cụm nổ tung vì tràn bộ nhớ (OOM)!',
    mindsetShift:
      'Hàng đợi chỉ giúp làm phẳng các đỉnh nhọn ngắn hạn, hoàn toàn không tự sinh ra thêm công suất xử lý. Mọi hàng đợi trong sản xuất bắt buộc phải có **Giới hạn trần (`Bounded Queue`)** để tạo **Phản áp lực (Back-pressure)**, kết hợp với **Xả tải chủ động theo độ ưu tiên (Priority Load Shedding)**: khi quá tải, thà từ chối sớm (`HTTP 503`) các tác vụ phụ (gợi ý, thống kê P2) ngay ở cửa trong 1 ms để bảo toàn 100% tài nguyên cho luồng thanh toán cốt lõi (P0).',
  },
  'S4-11': {
    hookTitle: 'Khi cơ chế "Tự động thử lại (Retry)" biến một vết xước nhỏ thành vụ sập toàn hệ thống',
    scenario:
      'Dịch vụ Thanh toán gặp một đợt nghẽn mạng ngắn làm thời gian phản hồi chậm lại. Để "tăng độ tin cậy", lập trình viên ở cả 3 tầng (`Mobile App → API Gateway → Checkout Service → Payment Service`) đều cấu hình tự động thử lại ngay lập tức 3 lần (`maxRetries = 3`) khi thấy lỗi hoặc chậm.',
    naiveAttempt:
      'Gọi mạng không đặt Timeout chặt, cộng thêm Retry tức thì ở nhiều tầng nối tiếp nhau. Khi `Payment` hơi chậm, `Checkout` giữ hết luồng chờ và bắn 3 lần thử lại; `API Gateway` thấy `Checkout` chậm cũng bắn 3 lần; `Mobile App` bắn thêm 3 lần — tạo thành hệ số nhân **$3 \\times 3 \\times 3 = 27$ lần lưu lượng** dội thẳng vào dịch vụ `Payment` đang hấp hối! Ngay cả khi sự cố gốc đã qua, cơn bão Retry tự duy trì này vẫn đè chết hệ thống (Metastable Failure).',
    mindsetShift:
      'Gọi qua mạng trong hệ phân tán phải tuân thủ bộ tứ phòng vệ: (1) **Timeout chặt + Deadline Propagation** (không làm tiếp việc đã hết hạn); (2) **Exponential Backoff + Full Jitter** và chỉ Retry ở **một tầng duy nhất** kèm ngân sách `Retry Budget ≤ 10%`; (3) **Circuit Breaker** (`CLOSED → OPEN → HALF-OPEN`) để ngắt mạch nhanh khi đối tác đang sập; và (4) **Vách ngăn Bulkhead** tách riêng Thread Pool cho từng dịch vụ con để lỗi ở nhánh Khuyến mãi không bao giờ làm cạn luồng của nhánh Xem hàng.',
  },
  'S5-01': {
    hookTitle: 'Từ Monolith sang Microservices: Khi tách 10 dịch vụ nhưng lại tạo ra "Quái vật Distributed Monolith"',
    scenario:
      'Một hệ thống thương mại điện tử ban đầu chạy trên một khối Monolith duy nhất. Khi đội ngũ lớn lên 40 kỹ sư, việc cùng sửa chung một codebase gây xung đột liên tục và một lỗi rò rỉ bộ nhớ ở tính năng xuất báo cáo làm sập luôn cả luồng đặt hàng. Nhóm quyết định tách thành các Microservices (`Orders`, `Catalog`, `Payments`).',
    naiveAttempt:
      'Tách mã nguồn thành 3 dịch vụ chạy trên các container riêng biệt, nhưng để "tiện lấy dữ liệu", cả 3 dịch vụ vẫn mở kết nối đọc ghi trực tiếp vào **cùng một cơ sở dữ liệu chung** và gọi nối tiếp nhau thành chuỗi đồng bộ dài. Khi đội `Catalog` đổi tên một cột trong bảng sản phẩm, dịch vụ `Orders` sập ngay lập tức — họ đã tạo ra một **Distributed Monolith** hội tụ đủ nhược điểm của cả hai thế giới!',
    mindsetShift:
      'Tiến hóa kiến trúc phải đi theo lộ trình thực dụng: bắt đầu từ **Modular Monolith** có ranh giới mô-đun rõ ràng; chỉ tách những miền có nhu cầu mở rộng hoặc tốc độ phát triển khác biệt bằng mẫu **Strangler Fig** (đặt API Gateway ở trước để chuyển dần từng đường dẫn từ Monolith sang dịch vụ mới); và mỗi Microservice bắt buộc phải **sở hữu hoàn toàn Database riêng (Database-per-Service)**, chỉ giao tiếp qua hợp đồng API hoặc sự kiện.',
  },
  'S5-03': {
    hookTitle: 'Bài toán News Feed mạng xã hội: Khi một bức ảnh của ngôi sao 50 triệu người theo dõi làm tê liệt hàng đợi',
    scenario:
      'Bạn thiết kế bảng tin (News Feed) cho mạng xã hội có 90% lưu lượng là người dùng mở ứng dụng lướt xem bảng tin và 10% là đăng bài mới. Một người dùng trung bình theo dõi 300 tài khoản khác.',
    naiveAttempt:
      'Bước 1 (Fan-out on Read / Pull): Mỗi khi người dùng mở app, chạy câu truy vấn tìm tất cả bài viết của 300 người họ theo dõi rồi sắp xếp theo thời gian — ở mức 5.000 lượt mở app/giây, Database sập ngay vì phải gánh hàng triệu phép đọc ngẫu nhiên. Bước 2 (Fan-out on Write / Push): Để đọc nhanh, mỗi khi ai đăng bài mới, hệ thống đẩy ngay `post_id` vào danh sách `Timeline Cache (Redis)` dựng sẵn của tất cả người theo dõi. Cách này giúp đọc Feed cực nhanh dưới 10 ms — **cho đến khi một ngôi sao có 50 triệu người theo dõi đăng 1 bài viết**: chỉ 1 cú bấm đăng bài đẻ ra **50 triệu tác vụ ghi Redis** làm tắc nghẽn toàn bộ hàng đợi hàng chục phút!',
    mindsetShift:
      'Không có một chiến lược duy nhất cho mọi đối tượng khi dữ liệu phân phối lệch cực đoan. Kiến trúc chuẩn cho Social Feed là **Mô hình Lai (Hybrid Fan-out)**: với **99% tài khoản thông thường** (< 100.000 người theo dõi), dùng **Fan-out on Write (Push)** đẩy `post_id` (8 byte) vào Redis Timeline Cache của người theo dõi đang hoạt động; riêng với **1% tài khoản Người nổi tiếng (Celebrities)**, tuyệt đối không Push lúc đăng mà chỉ ghi vào danh sách riêng của ngôi sao đó, rồi lúc người hâm mộ mở app mới **Fan-out on Read (Pull)** lấy bài mới của vài ngôi sao họ theo dõi trộn (merge) với Timeline Cache có sẵn!',
  },
  'S6-10': {
    hookTitle: 'Khoá giải mã nằm ngay cạnh bản sao lưu và sự cố chứng chỉ TLS hết hạn lúc nửa đêm',
    scenario:
      'Một công ty đã cẩn thận mã hóa toàn bộ cơ sở dữ liệu khách hàng bằng thuật toán AES-256 và tải các bản sao lưu (backup snapshots) hằng đêm lên một bucket lưu trữ đám mây. Thế nhưng để tiện cho script khôi phục, lập trình viên lại lưu luôn khóa giải mã AES trong biến môi trường hoặc tệp cấu hình nằm chung trong cùng bản sao lưu đó!',
    naiveAttempt:
      'Dùng một khóa tĩnh duy nhất để mã hóa hàng trăm GB dữ liệu (khiến việc xoay vòng khóa là bất khả thi vì phải giải mã rồi mã hóa lại toàn bộ DB), lưu mật khẩu DB cứng trong file `.env` trên Git, và chỉ bật HTTPS ở ngoài Load Balancer còn mạng nội bộ giữa các service thì truyền bản rõ.',
    mindsetShift:
      'Bảo mật dữ liệu sản xuất dựa trên 3 trụ cột kiến trúc: (1) **Mã hóa trên đường truyền** bằng TLS 1.3 ở biên và **mTLS** xác thực hai chiều trong mạng nội bộ Zero Trust; (2) **Mã hóa phong bì (Envelope Encryption)** tách khóa dữ liệu (**DEK** mã hóa bản ghi) khỏi khóa gốc (**KEK** không bao giờ rời khỏi phần cứng HSM của **KMS** — giúp xoay vòng khóa hoặc thu hồi quyền đọc bản sao lưu trong 1 giây); và (3) Dùng **Secrets Manager** cấp mật khẩu động ngắn hạn cùng **Tokenization Vault** cho dữ liệu thẻ thanh toán.',
  },
  'S7-01': {
    hookTitle: '20 triệu kết nối mở đồng thời và cơn bão kết nối lại khi 1 máy chủ WebSocket sập',
    scenario:
      'Trong hệ thống nhắn tin thời gian thực như WhatsApp/Slack/Messenger, máy chủ không thể chờ người nhận tự hỏi (Polling) mà phải đẩy tin nhắn xuống ngay trong dưới 100 ms. Để làm được điều đó, 20 triệu thiết bị đang online phải duy trì 20 triệu kết nối TCP/WebSocket mở liên tục.',
    naiveAttempt:
      'Gộp chung việc giữ kết nối WebSocket có trạng thái (Stateful) với toàn bộ logic xử lý lưu tin nhắn, tìm nhóm chat và quản lý trạng thái Online/Offline (Presence) vào chung một tầng máy chủ. Khi một máy chủ giữ 100.000 kết nối bị sập để khởi động lại, cả 100.000 điện thoại lập tức bắn yêu cầu kết nối lại + tải lịch sử tin nhắn trong cùng 1 giây (Reconnect Storm), đánh sập luôn cụm Database và các máy chủ còn lại!',
    mindsetShift:
      'Tách bạch hoàn toàn **Tầng giữ ống kết nối (Stateful WebSocket Gateways)** thật mỏng nhẹ với **Tầng nghiệp vụ phi trạng thái (Chat Service)**: dùng **Session Registry / Pub-Sub** để định tuyến tin nhắn từ Gateway của người gửi A sang đúng Gateway đang giữ kết nối của người nhận B (hoặc rẽ nhánh sang **Push Notification APNs/FCM** nếu B ngoại tuyến); cấp số thứ tự tăng dần (`seq_id`) kèm `client_msg_id` để khử trùng và đồng bộ bù; đồng thời bắt buộc thiết bị dùng **Jittered Backoff** khi kết nối lại.',
  },
  'S7-03': {
    hookTitle: '10 triệu thông báo khuyến mãi làm kẹt cứng mã OTP đăng nhập và chuyển tiền',
    scenario:
      'Lúc 12 giờ trưa, bộ phận Marketing bấm nút phát chiến dịch thông báo giảm giá tới **10 triệu người dùng**. Chỉ 2 phút sau, bộ phận Chăm sóc khách hàng báo động khẩn: hàng nghìn người dùng đang đăng nhập hoặc xác nhận chuyển tiền không nhận được mã OTP, hoặc đến 20 phút sau khi mã đã hết hạn thì tin nhắn OTP mới tới điện thoại!',
    naiveAttempt:
      'Đổ cả thông báo giao dịch khẩn cấp (OTP, biến động số dư) lẫn thông báo tiếp thị hàng loạt (Marketing Blast) vào **chung một hàng đợi FIFO duy nhất (`Shared Queue`)** và dùng chung một nhóm Delivery Workers. Ngoài ra, khi cổng SMS đối tác bên thứ ba bị chậm 300 ms, các Worker lại bật Retry tức thì làm nghẽn cứng toàn bộ luồng gửi.',
    mindsetShift:
      'Một hệ thống thông báo đa kênh chuẩn sản xuất phải áp dụng nguyên tắc **Phân làn cô lập (Priority Lanes & Bulkhead)**: tách từ cửa `Notification API` thành các đường ống hoàn toàn độc lập — **Làn Cao cấp (`High-Priority OTP Queue → Dedicated OTP Workers`)** và **Làn Số lượng lớn (`Low-Priority Marketing Queue → Paced Marketing Workers`)**; kết hợp **Kho khử trùng (`Dedup Cache`)** chặn gửi lặp cùng एक `dedup_key` và **Bộ điều tiết tốc độ đầu ra (`Outbound Rate Shaper + Circuit Breaker`)** khớp với hạn mức của từng đối tác APNs/FCM/SMS/Email.',
  },
  'S7-04': {
    hookTitle: '1 triệu tài xế phát tín hiệu GPS mỗi 4 giây và điểm nóng tắc nghẽn tại sân bay giờ cao điểm',
    scenario:
      'Trong ứng dụng gọi xe như Grab/Uber, có 1 triệu tài xế đang bật ứng dụng trên đường, mỗi điện thoại gửi tọa độ `(kinh độ, vĩ độ)` về hệ thống định kỳ 4 giây/lần — tạo ra lưu lượng ghi liên tục **250.000 lượt cập nhật vị trí mỗi giây**! Đồng thời, mỗi khi hành khách mở app đặt xe, hệ thống phải tìm ra 10 tài xế rảnh trong bán kính 2 km chỉ trong vài chục mili-giây.',
    naiveAttempt:
      'Ghi trực tiếp `UPDATE drivers SET lat = ..., lng = ...` xuống bảng SQL trên ổ đĩa và dùng câu truy vấn quét khoảng cách tọa độ. Ở mức 250.000 lệnh ghi/giây, ổ đĩa của cụm SQL sập ngay tức khắc. Khi chuyển sang chia lưới bản đồ tĩnh (Geohash), đến khung giờ máy bay hạ cánh tại sân bay Tân Sơn Nhất / Nội Bài, hàng nghìn tài xế và hành khách cùng dồn vào đúng 1 ô lưới Geohash duy nhất làm phân mảnh giữ ô đó quá tải đỏ rực.',
    mindsetShift:
      'Vị trí tài xế là dữ liệu tạm thời thay đổi từng giây nên phải được giữ và cập nhật trực tiếp trên **Bộ nhớ RAM phân mảnh theo không gian (`In-Memory Geo Index Shards`)** dùng lưới **Geohash** (đọc kèm 8 ô lân cận để chống lỗi biên giới ô) hoặc cây **Quadtree** (tự động chia nhỏ ô thành 4 góc phần tư khi mật độ xe dày đặc); kết hợp **Tách khóa ô nóng (`Hot-Cell Salting`)** cho khu vực sân bay và tách luồng **Hành khách → Dispatch Service → WebSocket hai chiều** để ghép chuyến tức thời.',
  },
  'S7-05': {
    hookTitle: 'Từ 1 tệp video gốc 4K nặng 2 GB đến luồng phát mượt mà trên cả Wi-Fi lẫn 3G yếu',
    scenario:
      'Một nhà sáng tạo nội dung tải lên tệp video 4K dung lượng 2 GB. Ngay khi video được xuất bản, có 500.000 khán giả cùng bấm xem: người dùng TV màn hình lớn trên cáp quang muốn xem bản 4K sắc nét, còn người đang đi tàu điện trên sóng di động chập chờn cần video không bị đứng hình.',
    naiveAttempt:
      'Cho tệp 2 GB chảy xuyên qua bộ nhớ của máy chủ API lúc tải lên, chuyển mã tuần tự trên 1 máy đơn lẻ, rồi phát nguyên 1 tệp `.mp4` duy nhất từ máy chủ gốc (Origin Server) cho tất cả người xem.',
    mindsetShift:
      'Thiết kế Video Streaming dựa trên sự bất đối xứng hoàn toàn giữa đường Ghi và đường Đọc: (1) **Đường tải lên** dùng **Presigned URL** để trình duyệt cắt tệp thành từng mảnh nhỏ (Chunked Upload) đẩy thẳng lên **Object Storage** mà không chạm vào RAM của API Server; (2) **Đường chuyển mã bất đồng bộ** tách video theo các cụm khung hình độc lập (GOP) để hàng chục **Transcode Workers** chạy song song sinh ra các phân đoạn nhỏ 4 giây ở nhiều mức chất lượng (`1080p, 720p, 480p, 360p`) theo chuẩn **HLS / DASH**; và (3) **Đường phát lại** đẩy 95%+ băng thông ra các trạm **CDN Edge** sát người xem để trình phát tự động chuyển đổi độ phân giải (Adaptive Bitrate) theo tốc độ mạng từng giây.',
  },
  'S7-06': {
    hookTitle: 'Khi mạng chập chờn đúng lúc bấm "Thanh toán": Làm sao không bao giờ trừ tiền khách hai lần?',
    scenario:
      'Khách hàng đứng trong thang máy bấm nút "Thanh toán 1.500.000đ". Yêu cầu đi qua máy chủ Thanh toán sang Cổng ngân hàng (PSP), ngân hàng đã trừ tiền thành công nhưng đúng lúc trả kết quả về thì sóng điện thoại của khách bị rớt. Thấy màn hình báo "Lỗi kết nối", khách hàng bấm nút "Thanh toán" thêm lần nữa!',
    naiveAttempt:
      'Mỗi lần nhận HTTP request là tạo một lệnh thu tiền mới gọi sang cổng ngân hàng, và lưu số dư tài khoản bằng một cột `balance` duy nhất được cộng trừ đè tại chỗ (`UPDATE accounts SET balance = balance - 1500000`). Khi có tranh chấp hoặc lệch tiền cuối ngày, không ai truy vết được số dư đó bị sai ở giao dịch nào.',
    mindsetShift:
      'Hệ thống thanh toán đứng vững trên 4 nguyên tắc bất di bất dịch: (1) **Khóa lũy đẳng (`Idempotency-Key`)** gắn với từng phiên thanh toán để dù khách hay hệ thống có gửi lại 10 lần thì ngân hàng cũng chỉ trừ tiền đúng 1 lần và trả lại kết quả cũ; (2) **Sổ cái kép chỉ ghi nối đuôi (Append-only Double-Entry Ledger)** nơi mọi biến động đều gồm 1 dòng Nợ (Debit) và 1 dòng Có (Credit) có tổng bằng 0 thay vì sửa đè số dư; (3) **Transactional Outbox** để phát sự kiện đơn hàng an toàn; và (4) **Đối soát tự động cuối ngày (T+1 Reconciliation)** với tệp sao kê ngân hàng để phát hiện mọi sai lệch.',
  },
  'S7-07': {
    hookTitle: 'Gợi ý từ khoá sau từng phím gõ ở tốc độ 50.000 truy vấn/giây dưới 100 mili-giây',
    scenario:
      'Mỗi khi người dùng gõ một chữ cái vào ô tìm kiếm (`"s"` → `"sy"` → `"sys"` → `"syst"`), thanh gợi ý (Autocomplete / Typeahead) phải trả về ngay 5 cụm từ phổ biến nhất trước khi ngón tay người dùng kịp gõ phím tiếp theo (ngưỡng tổng thời gian < 100 ms), với lưu lượng toàn hệ thống lên tới **50.000 QPS**.',
    naiveAttempt:
      'Mỗi phím gõ trên bàn phím bắn ngay 1 request về Backend và chạy câu truy vấn `SELECT query FROM search_logs WHERE query LIKE "sys%" GROUP BY query ORDER BY COUNT(*) DESC LIMIT 5` trên Database, đồng thời mỗi khi có người tìm kiếm xong lại khóa cây dữ liệu để cập nhật ngay số đếm tần suất.',
    mindsetShift:
      'Để đạt độ trễ vài mili-giây ở 50.000 QPS, hệ thống phải phối hợp 4 tầng: (1) **Phía Client dùng Debouncing (150–200 ms)** để gộp các phím gõ liên tiếp, cắt giảm 70% số request thừa; (2) **Prefix Cache (Redis)** lưu sẵn kết quả của các tiền tố ngắn 1–3 ký tự (chỉ khoảng ~18.000 tổ hợp nhưng gánh tới **90% tổng lượt gõ**!); (3) **Cụm Trie Shards trên RAM** lưu sẵn danh sách **Top-5 ngay tại mỗi nút của cây Trie** để tra cứu trong $O(p)$ mà không cần duyệt cây con; và (4) **Tách hoàn toàn luồng ghi ra đường ống Offline (Log → Aggregator → Trie Builder)** để dựng bản chụp cây Trie mới định kỳ rồi tráo đổi nguyên tử (Atomic Swap), giữ cho đường đọc 100% không bị khóa.',
  },
};

export interface SdRawStepLike {
  heading: string;
  block: SdStepBlock | null;
  body: string;
}

function cleanStepTitle(h: string): string {
  return h.replace(/^\s*\d+\.\s*/, '').trim();
}

export function buildSdModuleStory(
  mod: SdModule,
  sections: readonly SdRawStepLike[]
): BilingualText {
  const curated = CURATED_STORIES[mod.id];
  const firstStep = sections[0];
  const problemStep = sections.find((s) => s.block?.category === 'PROBLEM') ?? sections[1] ?? firstStep;
  const pitfallStep = sections.find((s) => s.block?.category === 'PITFALL');
  const recapStep = sections[sections.length - 1];

  const extractFirstParagraph = (md: string | undefined): string => {
    if (!md) return '';
    const lines = md
      .replace(/```[\s\S]*?```/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('>'));
    return lines.slice(0, 2).join(' ');
  };

  const hookTitle = curated?.hookTitle ?? `${mod.id} · Bối cảnh thực tế của "${mod.title}"`;
  const scenarioText =
    curated?.scenario ??
    (extractFirstParagraph(firstStep?.body) || mod.summary);
  const naiveText =
    curated?.naiveAttempt ??
    (extractFirstParagraph(problemStep?.body) ||
      (pitfallStep ? extractFirstParagraph(pitfallStep.body) : mod.summary));
  const mindsetText =
    curated?.mindsetShift ??
    (recapStep?.block?.callout?.vi ||
      firstStep?.block?.callout?.vi ||
      extractFirstParagraph(recapStep?.body) ||
      mod.summary);

  // Xây dựng bản đồ tiến hoá Pipeline qua từng bước để người học nắm trọn bức tranh tổng thể
  const pipelineLines = sections.map((sec, idx) => {
    const title = cleanStepTitle(sec.heading);
    const changes = (sec.block?.whatChanged ?? [])
      .slice(0, 2)
      .map((c) => c.replace(/^[+~-]\s*/, '').trim())
      .filter(Boolean);
    const calloutVi = sec.block?.callout?.vi;
    const detail = changes.length > 0 ? changes.join(' · ') : calloutVi ? calloutVi : '';
    return `- **Bước ${idx + 1} — ${title}:** ${detail || 'Phân tích cơ chế và tác động lên hệ thống.'}`;
  });

  const objectivesLines = mod.objectives.map((o) => `- ${o.vi}`);

  const viMarkdown = [
    `### 1. Hoàn cảnh & Bài toán thực tế`,
    `> [!ANALOGY] ${hookTitle}`,
    `> ${scenarioText}`,
    '',
    `### 2. Phản xạ ngây thơ đầu tiên & Vì sao vấp giới hạn?`,
    naiveText,
    '',
    `### 3. Tư tưởng giải quyết vấn đề (Problem-Solving Mindset)`,
    `> [!IMPORTANT] Tư duy cốt lõi thay vì học thuộc lý thuyết suông`,
    `> ${mindsetText}`,
    '',
    `### 4. Bản đồ tiến hoá Pipeline qua ${sections.length} bước trong bài`,
    ...pipelineLines,
    '',
    `### 5. Trọng tâm cần nắm vững sau bài này`,
    ...objectivesLines,
  ].join('\n');

  return {
    vi: viMarkdown,
    en: viMarkdown,
  };
}

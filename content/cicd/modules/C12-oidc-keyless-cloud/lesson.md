# Xác thực Đám mây Không Khoá Tĩnh (Keyless OIDC), Chính sách Tin cậy IAM & Chứng thực Nguồn gốc Bản dựng

Hãy thành thật kiểm tra xem tổ chức của bạn có đang vận hành theo lối mòn đầy rủi ro này không:
- [!] Một quản trị viên vào AWS IAM tạo tài khoản dịch vụ `ci-deployer`, xuất ra cặp khoá dài hạn **`AWS_ACCESS_KEY_ID` (`AKIAIOSFODNN7EXAMPLE`)** và **`AWS_SECRET_ACCESS_KEY`** có hạn sử dụng... vĩnh viễn!
- [!] Cặp khoá đó được copy-paste vào mục **GitHub Secrets** của 15 kho mã nguồn khác nhau, và suốt 3 năm không ai dám xoay vòng (*rotate*) vì sợ làm gãy đường ống triển khai!

Nếu một ngày khoá tĩnh đó bị rò rỉ qua một Action bên thứ ba bị xâm nhập, tin tặc có thể ngồi từ bất kỳ quán cà phê nào trên thế giới dùng cặp khoá ấy đào tiền ảo hoặc xoá sạch cơ sở dữ liệu AWS của bạn suốt nhiều tuần mà không hề bị hết hạn!

Chuẩn mực công nghiệp năm 2026 đã **xoá sổ hoàn toàn {rose:khoá tĩnh dài hạn} trong CI/CD** bằng giao thức liên kết danh tính ==OpenID Connect (OIDC)== ({sky:JWT ngắn hạn}) kết hợp {emerald:Chứng thực Nguồn gốc Bản dựng (Artifact Build Provenance)}.

---

## 1. Cơ chế bắt tay "Không Mật khẩu" của OpenID Connect (OIDC)

> [!ANALOGY] Hãy hình dung như sau
> Thay vì cất một chiếc chìa khoá sắt vĩnh viễn trong két GitHub Secrets, **Keyless OIDC** biến mỗi lượt chạy Workflow thành một **"Thẻ căn cước điện tử dùng 1 lần có chữ ký mật mã của GitHub" (JWT)** — mang đi đổi lấy thẻ ra vào AWS chỉ sống đúng **15–60 phút** rồi tự huỷ!

```visual
kind: flow
title: "Luồng Bắt Tay Xác Thực Đám Mây Không Khoá Tĩnh (Keyless OIDC Handshake) [!badge:emerald:Zero Static Secrets]"
subtitle: Chuyển đổi từ thẻ định danh JWT ký số của GitHub sang phiên làm việc tạm thời trên AWS STS hoàn toàn tự động
steps:
  - icon: workflow
    badge: "Bước 1 · Xin thẻ"
    title: GitHub Actions Job
    desc: Nhờ quyền id-token:write, Runner gọi tới OIDC Endpoint nội bộ của GitHub
    code: "id-token: write"
    tone: sky
    edge: ký số JWT
  - icon: key
    badge: "Bước 2 · Đúc thẻ JWT"
    title: GitHub OIDC Provider
    desc: Phát hành thẻ JWT ngắn hạn chứa danh tính repo, nhánh ref, commit sha
    code: "aud: sts.amazonaws.com"
    tone: violet
    edge: AssumeRoleWithWebIdentity
  - icon: shield-check
    badge: "Bước 3 · Đối chiếu"
    title: AWS STS & Trust Policy
    desc: Xác minh chữ ký công khai GitHub + kiểm tra khớp chặt aud và sub
    code: "sub == repo:acme-corp/..."
    tone: amber
    edge: cấp phiên ngắn hạn
  - icon: cloud
    badge: "Bước 4 · Triển khai"
    title: Short-lived Token (1h)
    desc: Cấp thông tin đăng nhập tạm thời tự huỷ sau 15-60 phút để đẩy lên EKS/S3
    code: "Auto-expires in <= 1h"
    tone: emerald
```

### Ba lợi ích vượt trội và Hai cấu hình bắt buộc trên Workflow
- [x] **Không còn bất kỳ khoá tĩnh nào lưu trong GitHub Secrets:** Không có gì để bị đánh cắp dài hạn hay phải đặt lịch nhắc xoay vòng mật khẩu mỗi 90 ngày.
- [x] **Tự động hết hạn cực ngắn:** Ngay khi Job kết thúc (hoặc tối đa sau 1 giờ), phiên làm việc tự động vô hiệu hoá.
- [x] **Kiểm soát ngữ cảnh chi tiết tới từng nhánh:** Đám mây biết chính xác yêu cầu xuất phát từ kho nào, nhánh nào, môi trường nào.

```visual
kind: compare
title: "Chuyển Đổi Cấu Hình AWS Trên GitHub Actions: Khoá Tĩnh Cũ vs Keyless OIDC"
subtitle: "Xoá bỏ hoàn toàn cặp aws-access-key-id & aws-secret-access-key khỏi cả YAML lẫn GitHub Secrets!"
left:
  badge: "CÁCH CŨ RỦI RO CAO · Khoá tĩnh vĩnh viễn"
  title: "Lưu cặp Access Key / Secret Key dài hạn"
  tone: rose
  code: |
    deploy-aws:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: aws-actions/configure-aws-credentials@v4
          with:
            # Lộ 2 biến này là mất quyền AWS dài hạn!
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: ap-southeast-1
  lang: yaml
  bullets:
    - "Phải sinh khoá tĩnh `AKIAIOSFODNN7EXAMPLE` không tự hết hạn và rải thủ công vào từng kho Git"
    - "Không thể giới hạn ở phía AWS rằng khoá đó chỉ được phép gọi từ đúng nhánh `main`"
right:
  badge: "CHUẨN HIỆN ĐẠI 2026 · Keyless OIDC"
  title: "Dùng id-token: write + role-to-assume"
  tone: emerald
  code: |
    deploy-aws:
      runs-on: ubuntu-latest
      permissions:
        id-token: write       # BẮT BUỘC để xin thẻ OIDC JWT!
        contents: read
      steps:
        - uses: actions/checkout@v4
        - uses: aws-actions/configure-aws-credentials@v4
          with:
            role-to-assume: arn:aws:iam::123456789012:role/github-oidc-shop-api-prod
            aws-region: ap-southeast-1
  lang: yaml
  bullets:
    - "Bắt buộc khai báo quyền ==`id-token: write`== trong `permissions:` để Runner đúc thẻ JWT"
    - "Xoá sạch `aws-access-key-id` và `aws-secret-access-key`; chỉ truyền chuỗi ARN định danh ==`role-to-assume`=="
```

---

## 2. Tử huyệt cấu hình đám mây: Khoá chặt trường `sub` trong **AWS IAM Trust Policy**!

> [!WARNING] Cảnh báo đỏ ở phía AWS / GCP / Azure!
> Hàng triệu người dùng trên khắp thế giới đều dùng chung **cùng một máy chủ phát hành thẻ OIDC** là `https://token.actions.githubusercontent.com`!
> Nếu trong chính sách tin cậy **IAM Role Trust Policy** trên AWS, bạn chỉ kiểm tra nhà phát hành mà **quên khoá điều kiện `token.actions.githubusercontent.com:sub` (Subject)** — hoặc cẩu thả viết ký tự đại diện `"repo:*"` — thì **bất kỳ người lạ nào tạo một kho GitHub cá nhân rồi điền ARN Role của bạn vào cũng chiếm đoạt được toàn quyền AWS của công ty bạn**!

```visual
kind: anatomy
title: Giải Phẫu 3 Trường Danh Tính Sống Còn Trong Thẻ OIDC JWT & IAM Trust Policy
subtitle: AWS STS dùng khoá công khai của GitHub xác minh chữ ký rồi kiểm tra từng trường trong khối Condition.StringEquals
items:
  - keyword: "iss (Issuer)"
    role: Nhà phát hành thẻ
    tone: sky
    summary: Xác nhận thẻ JWT thực sự do hệ thống GitHub Actions chính thức ký phát hành.
    bullets:
      - "**Chưa đủ để phân quyền!** Vì mọi tài khoản GitHub trên toàn cầu đều có chung `iss` này"
    example: "https://token.actions.githubusercontent.com"
    lang: text
  - keyword: "aud (Audience)"
    role: Dịch vụ đám mây đích
    tone: amber
    summary: Chỉ định rõ thẻ JWT này được đúc riêng cho dịch vụ AWS Security Token Service.
    bullets:
      - "Giá trị chuẩn mặc định khi xác thực với AWS STS luôn là ==`sts.amazonaws.com`=="
    example: "token.actions.githubusercontent.com:aud: \"sts.amazonaws.com\""
    lang: yaml
  - keyword: "sub (Subject)"
    role: Định danh Kho & Nhánh gốc
    tone: emerald
    summary: Chuỗi định danh duy nhất khoá cứng đúng Tổ chức + đúng Kho + đúng Nhánh được phép đảm nhận Role.
    bullets:
      - "Khoá bằng `StringEquals` vào `repo:acme-corp/shop-api:ref:refs/heads/main` sẽ từ chối thẳng thừng cả nhánh thử nghiệm `feat/*` hay PR nội bộ!"
    example: "token.actions.githubusercontent.com:sub: \"repo:acme-corp/shop-api:ref:refs/heads/main\""
    lang: yaml
```

Cấu hình điều kiện chuẩn mực trong **AWS IAM Role Trust Policy**:

```yaml
Condition:
  StringEquals:
    token.actions.githubusercontent.com:aud: sts.amazonaws.com
    token.actions.githubusercontent.com:sub: repo:acme-corp/shop-api:ref:refs/heads/main
```

---

## 3. Chống giả mạo sản phẩm đầu ra: **Build Provenance Attestation (SLSA)**

Giả sử mã nguồn đã được bảo vệ kỹ, nhưng làm sao cụm Kubernetes Production có thể chắc chắn 100% rằng bức ảnh container `ghcr.io/acme/shop-api:sha-9f8e7d` đang chuẩn bị kéo về **thực sự được biên dịch tự động trên máy chủ GitHub Actions chính thống từ nhánh `main`**, chứ không phải do ai đó lén build ảnh cài cửa hậu (*backdoor*) trên laptop cá nhân rồi đẩy đè lên Registry?

Cũng nhờ nền tảng định danh **OIDC (`id-token: write`)** kết hợp quyền ==`attestations: write`==, khung tiêu chuẩn chuỗi cung ứng **SLSA (*Supply-chain Levels for Software Artifacts*)** cho phép cấp **"giấy khai sinh mật mã không thể chối bỏ"** ngay lúc đóng gói bằng `actions/attest-build-provenance@v2` (hoặc ký không khoá qua **Sigstore Cosign**):

```yaml
permissions:
  contents: read
  packages: write
  id-token: write
  attestations: write

steps:
  # ... sau bước build & push ảnh container xuất ra digest ...
  - name: Ký chứng thực nguồn gốc bản dựng (SLSA Build Provenance)
    uses: actions/attest-build-provenance@v2
    with:
      subject-name: ghcr.io/acme/shop-api
      subject-digest: ${{ steps.push.outputs.digest }}
      push-to-registry: true
```

Trước khi khởi chạy Pod trên cụm Kubernetes (thông qua **Kyverno** / Policy Controller) hoặc qua dòng lệnh `gh attestation verify`, hệ thống sẽ xác minh chữ ký mật mã này trong tích tắc — đảm bảo gói phần mềm sinh ra từ đúng kho Git, đúng mã Commit và đúng tệp Workflow chuẩn!

> [!REMEMBER] Ghi nhớ bỏ túi
> - Trên Workflow GitHub Actions: Bật **`permissions: { id-token: write }`**, xoá sạch `aws-access-key-id` / `aws-secret-access-key` và thay bằng **`role-to-assume`**.
> - Trên **AWS IAM Trust Policy**: Bắt buộc khoá đồng thời **`aud: "sts.amazonaws.com"`** và **`sub: "repo:acme-corp/shop-api:ref:refs/heads/main"`** (tuyệt đối cấm `"repo:*"`!).
> - Dùng **`actions/attest-build-provenance@v2`** (`attestations: write`) theo chuẩn **SLSA** để ký chứng thực nguồn gốc bản dựng không thể giả mạo.

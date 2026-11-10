# Xác thực Đám mây Không Khoá Tĩnh (Keyless OIDC), Chính sách Tin cậy IAM & Chứng thực Nguồn gốc Bản dựng

Hãy thành thật kiểm tra xem tổ chức của bạn có đang vận hành theo cách truyền thống đầy rủi ro này không:
1. Một quản trị viên vào AWS IAM tạo một tài khoản dịch vụ `ci-deployer`, xuất ra cặp khoá dài hạn **`AWS_ACCESS_KEY_ID` (`AKIA...`)** và **`AWS_SECRET_ACCESS_KEY`** có hạn sử dụng... vĩnh viễn!
2. Cặp khoá đó được copy-paste vào mục **GitHub Secrets** của 15 kho mã nguồn khác nhau, và suốt 3 năm không ai dám xoay vòng (rotate) vì sợ làm gãy đường ống triển khai!

Nếu một ngày một tài khoản quản trị hoặc một Action bên thứ ba bị tấn công rò rỉ khoá tĩnh đó, tin tặc có thể ngồi từ bất kỳ quán cà phê nào trên thế giới dùng cặp `AKIA...` ấy đào tiền ảo hoặc xoá sạch cơ sở dữ liệu AWS của bạn suốt nhiều tuần mà không bị hết hạn!

Chuẩn mực công nghiệp năm 2026 đã **xoá sổ hoàn toàn khoá tĩnh dài hạn trong CI/CD** bằng giao thức liên kết danh tính **OpenID Connect (OIDC)** kết hợp **Chứng thực Nguồn gốc Bản dựng (Artifact Provenance Attestation)**.

---

## 1. Cơ chế bắt tay "Không Mật khẩu" của **OpenID Connect (OIDC)**

Thay vì lưu một chiếc chìa khoá sắt vĩnh viễn trong két GitHub, **OIDC** biến mỗi lượt chạy Workflow thành một tấm "Thẻ căn cước điện tử dùng 1 lần có chữ ký số" (JWT) chỉ sống trong vòng **15–60 phút**:

```text
[1. Job GitHub Actions]  ──(Yêu cầu cấp thẻ nhờ quyền id-token: write)──► [ Nhà cung cấp OIDC của GitHub ]
         │                                                                            │
         │ ◄────── Trả về thẻ JWT ký số chứa danh tính: ──────────────────────────────┘
         │         • iss: "https://token.actions.githubusercontent.com"
         │         • aud: "sts.amazonaws.com"
         │         • sub: "repo:acme-corp/shop-api:ref:refs/heads/main"
         ▼
[2. Gửi thẻ JWT sang AWS STS (AssumeRoleWithWebIdentity)]
         │
         ├──► AWS kiểm tra chữ ký công khai của GitHub + Đối chiếu IAM Trust Policy!
         │    (Đúng kho acme-corp/shop-api? Đúng nhánh main?)
         ▼
[3. AWS cấp Token phiên ngắn hạn (tự huỷ sau 1 giờ) để triển khai EKS / S3!]
```

### Ba lợi ích vượt trội của Keyless OIDC:
1. **Không còn bất kỳ khoá tĩnh nào lưu trong GitHub Secrets** — không có gì để bị đánh cắp dài hạn hay phải đặt lịch nhắc xoay vòng mật khẩu mỗi 90 ngày!
2. **Tự động hết hạn cực ngắn:** Ngay khi Job kết thúc hoặc sau 1 giờ, phiên xác thực tự động vô hiệu hoá.
3. **Kiểm soát ngữ cảnh siêu chi tiết:** Đám mây biết chính xác yêu cầu đến từ kho nào, nhánh nào, môi trường nào!

### Hai cấu hình bắt buộc trên Workflow GitHub Actions:
1. Cấp quyền **`id-token: write`** trong khối `permissions:` của Job (nếu thiếu quyền này, Action không thể xin GitHub cấp thẻ JWT OIDC!).
2. Trong `aws-actions/configure-aws-credentials@v4`, xoá sạch `aws-access-key-id` / `aws-secret-access-key` và chỉ truyền **`role-to-assume`** + **`aws-region`**:

```yaml
deploy-aws:
  runs-on: ubuntu-latest
  permissions:
    id-token: write       # BẮT BUỘC để đúc thẻ OIDC JWT!
    contents: read
  steps:
    - uses: actions/checkout@v4
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/github-oidc-shop-api-prod
        aws-region: ap-southeast-1
```

---

## 2. Tử huyệt cấu hình đám mây: Khoá chặt trường `sub` trong **AWS IAM Trust Policy**!

Hãy hết sức cảnh giác ở phía AWS (hoặc GCP / Azure): cả triệu người dùng trên khắp thế giới đều dùng chung một máy chủ phát hành thẻ OIDC là `https://token.actions.githubusercontent.com`!

Nếu trong chính sách tin cậy **IAM Role Trust Policy** trên AWS, bạn chỉ kiểm tra nhà phát hành mà quên khoá điều kiện **`token.actions.githubusercontent.com:sub` (Subject)** — hoặc cẩu thả viết dấu sao đại diện `"repo:*"` — thì **bất kỳ sinh viên hay tin tặc nào tạo một kho GitHub cá nhân của riêng họ rồi điền ARN Role của bạn vào cũng mượn được quyền quản trị AWS của công ty bạn**!

Chính sách tin cậy chuẩn mực bắt buộc khoá cứng đồng thời cả **`aud` (`sts.amazonaws.com`)** và **`sub` (đúng Tổ chức + đúng Kho + đúng Nhánh `refs/heads/main`)**:

```yaml
Condition:
  StringEquals:
    token.actions.githubusercontent.com:aud: sts.amazonaws.com
    token.actions.githubusercontent.com:sub: repo:acme-corp/shop-api:ref:refs/heads/main
```
Với dòng khoá `StringEquals` này, ngay cả chính lập trình viên trong công ty mở một nhánh thử nghiệm `feat/test` trong cùng kho `acme-corp/shop-api` cũng bị AWS STS từ chối thẳng thừng không thể chạm vào Role của môi trường Production!

---

## 3. Chống giả mạo sản phẩm đầu ra: **Build Provenance Attestation (SLSA)**

Giả sử bạn đã bảo mật mã nguồn rất kỹ, nhưng làm sao cụm Kubernetes Production có thể chắc chắn 100% rằng bức ảnh container `ghcr.io/acme/shop-api:sha-9f8e7d` đang chuẩn bị kéo về **thực sự được biên dịch tự động trên máy chủ GitHub Actions chính thống từ nhánh `main`**, chứ không phải do một tài khoản bị lộ lén build ảnh chứa cửa hậu (backdoor) trên laptop cá nhân rồi đẩy đè lên Registry?

Cũng nhờ nền tảng định danh **OIDC (`id-token: write`)** kết hợp quyền **`attestations: write`**, tiêu chuẩn chuỗi cung ứng **SLSA (Supply-chain Levels for Software Artifacts)** cho phép ký nhận giấy khai sinh mật mã không thể làm giả ngay lúc đóng gói bằng **`actions/attest-build-provenance@v2`** (hoặc ký chữ ký số không khoá với **Sigstore Cosign**):

```yaml
permissions:
  contents: read
  packages: write
  id-token: write
  attestations: write

steps:
  # ... sau bước build & push ảnh container ...
  - name: Ký chứng thực nguồn gốc bản dựng (SLSA Build Provenance)
    uses: actions/attest-build-provenance@v2
    with:
      subject-name: ghcr.io/acme/shop-api
      subject-digest: ${{ steps.push.outputs.digest }}
      push-to-registry: true
```
Trước khi triển khai trên cụm Kubernetes (thông qua Kyverno hoặc Policy Controller) hay bằng lệnh `gh attestation verify`, hệ thống có thể xác minh chữ ký mật mã này chỉ trong tích tắc để chặn đứng mọi gói phần mềm không rõ nguồn gốc!

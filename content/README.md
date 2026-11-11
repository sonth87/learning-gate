# Hướng dẫn Biên soạn & Kiểm định Nội dung (`content/`)

Thư mục `content/` là **nguồn nội dung duy nhất (Single Source of Truth)** cho tính năng **"Học"** của hai ứng dụng:
- **Docker & K8s Mastery** (`content/kube/` → biên dịch ra `src/data/courses/kube/*.json`)
- **CI/CD Architecture** (`content/cicd/` → biên dịch ra `src/data/courses/cicd/*.json`)

> **Lưu ý quan trọng:** Tuyệt đối **không sửa tay** các file JSON trong `src/data/courses/`. Mọi thay đổi nội dung phải thực hiện trong `content/<course>/` rồi chạy lệnh biên dịch và kiểm định bên dưới.

---

## 1. Quy trình 3 lệnh bắt buộc khi sửa nội dung

Sau mỗi lần thêm/sửa bài học, câu hỏi quiz, flashcard, cấu hình thật hoặc bài thực hành:

```bash
# 1. Biên dịch Markdown + JSON nguồn thành gói dữ liệu cho trình duyệt
npm run course:build

# 2. Chạy bộ kiểm định tự động (course:doctor)
npm run course:doctor

# 3. Chạy unit test cho bộ máy chấm bài (YAML / Dockerfile / CLI / Troubleshoot)
npm run course:test
```

`npm run course:doctor` sẽ tự động kiểm tra:
1. Không trùng mã module, ID bài tập, câu hỏi quiz, flashcard hay cặp thứ tự học `(level, order)`.
2. Mọi bài học (`lesson.md`) có trích dẫn `sources` (URL tài liệu chính thức hợp lệ).
3. Mọi câu hỏi quiz (`mc`, `tf`, `output`) có đáp án nằm trong phạm vi hợp lệ.
4. **Kiểm tra bài thực hành thật 100%:**
   - Code khởi đầu (`starter`) **BẮT BUỘC CHƯA ĐẠT** (tránh lộ sẵn đáp án).
   - Lời giải mẫu (`solution`) **BẮT BUỘC ĐẠT 100%** mọi test mà không phát sinh `import_error`.
   - Lời giải mẫu không dùng cú pháp cũ đã ngừng hỗ trợ (`docker-compose` v1, `::set-output`, `actions/checkout@v2..v3`, `extensions/v1beta1`, `npm prune --production`...).
5. Mọi đường dẫn cấu hình thật (`readings` và `ref`) đều tồn tại thực sự trong `readings/catalog.json` và `readings/files/`.
6. **Quét bí mật (Secret Scan):** Chặn đứng Slack/Discord Webhook, GitHub/GitLab PAT, AWS Access Key thật, hoặc Private Key PEM trước khi commit lên Git.

---

## 2. Cấu trúc thư mục

```text
content/
├── README.md
├── kube/                         # Khoá Docker & K8s Mastery (7 cấp: 0..6, 20 module K00..K19)
│   ├── course.json               # Tên các cấp học (levels) và ngưỡng đỗ quiz (passQuiz: 0.7)
│   ├── modules/
│   │   └── K04-layer-cache-dockerignore/
│   │       ├── module.json       # Metadata: id, level, order, title, sources, relatedTools, readings
│   │       ├── lesson.md         # Nội dung bài học (Markdown tiếng Việt, thuật ngữ tiếng Anh)
│   │       ├── exercises.json    # Danh sách bài thực hành có bộ kiểm tra xác định (spec)
│   │       ├── quiz.json         # Câu hỏi kiểm tra (mc | tf | output)
│   │       ├── cards.json        # Thẻ ghi nhớ lặp lại ngắt quãng (SRS Leitner 5 hộp)
│   │       └── drills.json       # Đoạn cấu hình / lệnh ngắn để luyện gõ chuẩn không Tab
│   └── readings/
│       ├── catalog.json          # Danh mục cấu hình thật (category, level, flags, sourceUrl)
│       └── files/                # Các file Dockerfile, compose.yaml, K8s YAML nguyên bản
└── cicd/                         # Khoá CI/CD Architecture (6 cấp: 0..5, 18 module C00..C17)
    ├── course.json
    ├── modules/
    │   └── C00-exit-codes-and-ci/ ... C17-cicd-incident-warroom/
    └── readings/
        ├── catalog.json
        └── files/
```

### Thứ tự học `(level, order)`
- Trang **Lộ trình** và nút **"Việc nên làm tiếp"** sắp xếp module nghiêm ngặt theo `(level, order)` tăng dần, **không** sắp theo tên thư mục hay mã chữ cái.
- Khi chèn thêm một module mới vào giữa Cấp 1, chỉ cần gán `level: 1` và cập nhật `order` của các module sau mà không cần đổi mã ID cũ (để bảo toàn tiến độ IndexedDB của người học).

---

## 3. Các loại bài thực hành & Bộ máy chấm (`spec`)

Định nghĩa kiểu đầy đủ nằm tại [`src/features/devops-course/types.ts`](../src/features/devops-course/types.ts). Hệ thống **không dùng so khớp chuỗi từ khoá thô** mà phân tích cú pháp / mô phỏng trạng thái thật trong trình duyệt:

| `kind` | `language` | Engine xử lý | Cách kiểm tra chính |
| :--- | :--- | :--- | :--- |
| `yaml` | `yaml` | `yamlGrader.ts` | Parse đa tài liệu (`---`) bằng `yaml`, chặn ký tự Tab cứng (báo số dòng), truy vấn AST theo đường dẫn (`spec.containers[0].ports[containerPort=3000]`), quy đổi đơn vị K8s (`500m` ↔ `0.5` CPU, `512Mi` ↔ `0.5Gi`), đối chiếu chéo `selector` ↔ `labels`, `Service` ↔ `Pod`, `Ingress` ↔ `Service`, `NetworkPolicy`, render `helmTemplate`, và bắt lỗi `Script Injection` / ghim SHA trong GitHub Actions. |
| `dockerfile` | `dockerfile` | `dockerfileGrader.ts` | Phân tích Dockerfile theo từng `Stage` (`FROM ... AS ...`), nối dòng `\`, tách cờ `--from=...`, kiểm tra `Exec Form` mảng JSON (`CMD ["node", "server.js"]`), thứ tự `Layer Cache` (`order`: `COPY package*.json` trước `RUN npm ci` trước `COPY . .`), và `non-root-user` ở stage cuối. |
| `dockerignore` | `dockerfile` | `dockerfileGrader.ts` | Chạy bộ khớp glob `.dockerignore` (hỗ trợ `*`, `**`, phủ định `!README.md`) trên tập đường dẫn mẫu để đảm bảo chặn `node_modules`/`.env`/`.git` nhưng không chặn nhầm `src/`. |
| `cli` | `shell` | `cliSimEngine.ts` | Thực thi tuần tự lệnh `docker`, `docker compose`, `kubectl`, `git` trên máy trạng thái (`SimWorldState`) có sẵn container/pod/deployment/service/nhánh Git; chấm dựa trên **trạng thái thế giới sau cùng** (hoặc `stdout-inspected` cho bài quan sát log). |
| `troubleshoot` | `yaml` / `dockerfile` / `shell` | `cliSimEngine.ts` | Cung cấp cụm/pipeline đang hỏng (`Pending`, `ImagePullBackOff`, `CreateContainerConfigError`, `CrashLoopBackOff`, `OOMKilled`, `502 Endpoints <none>`, Race Condition...) kèm khung **Terminal Chẩn đoán** để chạy `kubectl describe` / `logs --previous`, sau đó chấm bản vá cấu hình và đối chiếu trạng thái cụm tự hồi phục (`reconcileK8sCluster`). |

---

## 4. Quy tắc An toàn Bí mật & Độ chính xác 2026

1. **Không bao giờ đưa khoá/token/webhook thật vào bài học hoặc file mẫu:**
   - Luôn dùng giá trị giữ chỗ an toàn như `${{ secrets.SLACK_WEBHOOK_URL }}`, `<REDACTED_TOKEN>`, `placeholder-change-me`, `https://example.invalid/webhook`, hoặc mã ví dụ chính thức của AWS `AKIAIOSFODNN7EXAMPLE`.
2. **Chuẩn công nghệ 2026:**
   - Docker Engine v27+, Docker Compose v2 (`docker compose`, file `compose.yaml` không khai báo `version:`).
   - Node.js 22 LTS (`node:22-alpine`, `npm ci`, `npm prune --omit=dev`).
   - Kubernetes ≥ 1.30 (`apps/v1`, `networking.k8s.io/v1`, `autoscaling/v2`, `batch/v1`, Pod Security Admission labels).
   - GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`, `upload-artifact@v4`, `$GITHUB_OUTPUT`).
   - Các cấu hình lịch sử (`docker-compose` v1, `extensions/v1beta1`, `PodSecurityPolicy`, `::set-output`, `only/except`) **chỉ được xuất hiện trong mục Đọc cấu hình thật với nhãn `kind: "outdated"`** để người học nhận diện khi bảo trì dự án cũ.

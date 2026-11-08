import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_FUNDAMENTAL_ZERO_TO_SETUP: FlashcardItem[] = [
  // ============================================================================
  // PHẦN A: TỪ CON SỐ 0 — CÀI ĐẶT PYTHON, UV, PYENV, .VENV & GIẢI PHẪU DỰ ÁN (fc-101 -> fc-130)
  // ============================================================================
  {
    id: 'fc-101',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Môi trường (.venv)',
    frontQuestion: 'Thư mục `.venv/` (Virtual Environment) trong dự án Python là gì và tại sao tuyệt đối không nên cài thư viện thẳng vào máy tính (Global)?',
    frontHint: 'So sánh với thư mục `node_modules/` của từng dự án Node.js.',
    backAnswer:
      '`.venv/` là thư mục **Môi trường ảo cô lập** nằm ngay trong dự án, chứa một bản liên kết trình thông dịch Python riêng (`.venv/bin/python`) và thư mục chứa các thư viện riêng của dự án đó (`.venv/lib/.../site-packages`). Nếu không có `.venv`, mọi gói cài đặt sẽ đổ chung vào một kho toàn máy (Global), khiến Dự án A cần `pydantic v1` và Dự án B cần `pydantic v2` ghi đè làm hỏng lẫn nhau.',
    backAnalogy:
      'Giống như mỗi công trình xây dựng có kho vật tư riêng (`.venv/`) tương tự `node_modules/` của từng dự án Node.js, thay vì đổ chung xi măng của 10 công trình vào một nhà kho duy nhất.',
    codeSnippet: `# Tạo môi trường ảo .venv ở gốc dự án:
# Cách 1 (uv):     uv venv  (hoặc tự động khi chạy uv add / uv sync)
# Cách 2 (Chuẩn):  python -m venv .venv`,
    relatedTermIds: ['concept-venv', 'tool-uv'],
  },
  {
    id: 'fc-102',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Môi trường (.venv)',
    frontQuestion: 'Tại sao trên macOS hoặc Linux Ubuntu mới, khi gõ `pip install requests` trực tiếp ở ngoài môi trường ảo lại bị báo lỗi đỏ `error: externally-managed-environment` (PEP 668)?',
    frontHint: 'Hệ điều hành tự bảo vệ bản Python hệ thống (`/usr/bin/python3`).',
    backAnswer:
      'Các hệ điều hành như macOS và Ubuntu/Debian dùng chính bản Python cài sẵn của hệ thống cho nhiều công cụ lõi của OS (như `apt`, trình quản lý gói). Chuẩn **PEP 668** khóa không cho bạn `pip install` bừa bãi vào Python hệ thống để tránh làm hỏng OS. Giải pháp chuẩn là luôn tạo môi trường ảo `.venv` cho dự án (hoặc dùng `uv add` / `uvx`).',
    backAnalogy:
      'Hệ điều hành khóa tủ điện tổng của tòa nhà không cho cư dân tự ý đấu nối dây trần; bạn chỉ được cắm thiết bị vào ổ điện riêng trong căn hộ của mình (`.venv`).',
    codeSnippet: `# ❌ SAI: Cài thẳng vào Python hệ thống (Sẽ bị chặn bởi PEP 668)
# pip install requests

# ✅ ĐÚNG: Dùng uv hoặc kích hoạt .venv của dự án
# uv add requests
# (Hoặc: python3 -m venv .venv && source .venv/bin/activate && pip install requests)`,
    relatedTermIds: ['concept-venv', 'tool-uv'],
  },
  {
    id: 'fc-103',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Môi trường (.venv)',
    frontQuestion: 'File `pyproject.toml` trong dự án Python là gì và nó đóng vai trò tương đương với những file nào bên Node.js / TypeScript?',
    frontHint: 'File trung tâm duy nhất định nghĩa tên dự án, phiên bản Python, thư viện và cấu hình công cụ.',
    backAnswer:
      '`pyproject.toml` (chuẩn PEP 621) là **Bản khai sinh & Cấu hình trung tâm** của mọi dự án Python hiện đại. Nó gộp chung vai trò của `package.json` (tên dự án, `requires-python`, `dependencies`, scripts) cộng với `.eslintrc` (`[tool.ruff]`), `tsconfig.json` (`[tool.pyright]`) và `vitest.config.ts` (`[tool.pytest.ini_options]`) vào một file duy nhất sạch sẽ.',
    backAnalogy:
      'Hồ sơ thiết kế tổng thể của dự án: nhìn vào `pyproject.toml` là biết ngay dự án tên gì, cần Python mấy chấm, dùng thư viện nào và cấu hình Linter/Test ra sao.',
    codeSnippet: `[project]
name = "payment-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["fastapi>=0.115.0", "pydantic>=2.9.0"]

[dependency-groups]
dev = ["pytest>=8.3.0", "ruff>=0.7.0"]`,
    relatedTermIds: ['tool-pyproject-toml', 'tool-uv', 'tool-ruff'],
  },
  {
    id: 'fc-104',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Môi trường (.venv)',
    frontQuestion: 'File `.python-version` nằm ở thư mục gốc dự án có tác dụng gì đối với `uv` và `pyenv`?',
    frontHint: 'Tương đương file `.nvmrc` hoặc `.node-version` trong Node.js.',
    backAnswer:
      'File `.python-version` chỉ chứa một dòng văn bản ghi phiên bản Python của dự án (ví dụ `3.12` hoặc `3.12.7`). Khi bạn `cd` vào thư mục dự án, cả **`uv`** lẫn **`pyenv`** đều tự động đọc file này để chọn đúng bản Python đó cho dự án mà không ảnh hưởng đến các dự án khác trên cùng máy tính.',
    backAnalogy:
      'Tấm biển gắn ngay cửa phòng thí nghiệm ghi rõ: "Phòng này vận hành ở nhiệt độ 3.12°C", hệ thống điều hòa (`uv`/`pyenv`) bước vào là tự chỉnh đúng thông số.',
    codeSnippet: `# Ghim phiên bản Python cho riêng dự án hiện tại (Tạo file .python-version):
# Với uv:     uv python pin 3.12
# Với pyenv:  pyenv local 3.12.7`,
    relatedTermIds: ['tool-uv', 'concept-venv'],
  },
  {
    id: 'fc-105',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án bằng uv',
    frontQuestion: 'Trình tự 3 bước cơ bản nhất để tạo dự án mới, thêm thư viện và chạy code bằng công cụ `uv` là gì?',
    frontHint: '`uv init` -> `uv add` -> `uv run`.',
    backAnswer:
      '1. **Khởi tạo dự án**: `uv init my-app && cd my-app` (tự tạo `pyproject.toml`, `.python-version`, `.gitignore`, `main.py`).\n2. **Thêm thư viện**: `uv add httpx` (tự tạo `.venv` nếu chưa có, cài `httpx` siêu tốc, ghi vào `pyproject.toml` và khóa `uv.lock`).\n3. **Chạy code**: `uv run python main.py` (tự chạy bằng Python trong `.venv` mà không cần gõ lệnh `activate` thủ công).',
    backAnalogy:
      'Tương đương hoàn toàn với `npm init -y` $\\rightarrow$ `npm install axios` $\\rightarrow$ `node index.js` bên Node.js, gọn gàng và tự động hóa 100%.',
    codeSnippet: `uv init my-app && cd my-app
uv add requests rich
uv run python main.py`,
    relatedTermIds: ['tool-uv', 'tool-pyproject-toml', 'concept-venv'],
  },
  {
    id: 'fc-106',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án bằng uv',
    frontQuestion: 'Làm thế nào để dùng `uv` cài đặt nhiều phiên bản Python (ví dụ `3.10`, `3.12`, `3.13`) và đặt bản mặc định cho toàn máy (Global) vs từng dự án (Per-project)?',
    frontHint: '`uv python install`, `uv python pin --global`, `uv python pin`.',
    backAnswer:
      '`uv` có khả năng tự tải bản Python chuẩn chỉ trong vài giây mà không cần cài Python từ trang chủ trước:\n- Tải nhiều bản: `uv python install 3.10 3.12 3.13`.\n- Đặt mặc định toàn máy (Global): `uv python install 3.12 --default` (hoặc `uv python pin --global 3.12`).\n- Đặt riêng cho dự án hiện tại (Per-project): đứng trong thư mục dự án gõ `uv python pin 3.10`.',
    backAnalogy:
      'Như việc `uv` kiêm luôn cả vai trò của `nvm` / `fnm` bên Node.js: vừa quản lý phiên bản ngôn ngữ, vừa quản lý thư viện.',
    codeSnippet: `uv python install 3.11 3.12
uv python list                  # Xem danh sách các bản Python trên máy
uv python pin 3.12              # Ghim Python 3.12 cho dự án hiện tại`,
    relatedTermIds: ['tool-uv'],
  },
  {
    id: 'fc-107',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án bằng uv',
    frontQuestion: 'Sự khác biệt giữa `uv add <gói>` và `uv add --dev <gói>` là gì?',
    frontHint: 'Thư viện chạy Production vs Công cụ phục vụ lúc viết code/kiểm thử.',
    backAnswer:
      '- **`uv add fastapi httpx`**: Thêm thư viện cốt lõi cần thiết để ứng dụng chạy trên Production vào mục `dependencies = [...]` trong `pyproject.toml`.\n- **`uv add --dev pytest ruff pyright`**: Thêm công cụ chỉ dùng lúc lập trình và kiểm thử vào nhóm `[dependency-groups] dev = [...]`. Khi lên server thật, chạy `uv sync --no-dev` sẽ bỏ qua các gói dev này để image Docker nhẹ và an toàn.',
    backAnalogy:
      'Giống hệt `npm install express` (`dependencies`) so với `npm install -D vitest eslint` (`devDependencies`).',
    codeSnippet: `uv add fastapi pydantic          # Gói chạy chính (Production)
uv add --dev pytest ruff         # Gói hỗ trợ phát triển (Dev/Test)
uv sync --frozen --no-dev        # Cài trên Server thật (bỏ qua gói Dev)`,
    relatedTermIds: ['tool-uv', 'tool-pyproject-toml'],
  },
  {
    id: 'fc-108',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án bằng uv',
    frontQuestion: 'Lệnh `uvx <tên_tool>` (tên viết tắt của `uv tool run`) dùng để làm gì và tương đương với lệnh nào bên Node.js?',
    frontHint: 'Chạy ngay một công cụ CLI trong môi trường tạm thời cô lập mà không làm bẩn dự án.',
    backAnswer:
      '`uvx` tải và thực thi ngay một công cụ dòng lệnh Python (như `ruff`, `httpie`, `black`, `cowsay`) trong một môi trường ảo tạm thời được cache thông minh, hoặc bạn có thể cài vĩnh viễn công cụ CLI toàn máy bằng `uv tool install ruff`. Nó tương đương chính xác với **`npx`** trong Node.js.',
    backAnalogy:
      'Thuê một chiếc máy khoan chuyên dụng về khoan đúng 1 lỗ trên tường (`uvx`) rồi trả lại ngay, không cần mua đứt chất chật kho dự án.',
    codeSnippet: `uvx ruff check .                 # Chạy ruff ngay lập tức như npx eslint .
uvx httpie https://httpbin.org/get
uv tool install ruff             # Cài CLI dùng toàn máy (Global CLI cô lập)`,
    relatedTermIds: ['tool-uv', 'tool-ruff'],
  },
  {
    id: 'fc-109',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án (pyenv / venv / pip / Poetry / Pipenv)',
    frontQuestion: 'Khi quản lý dự án KHÔNG dùng `uv` mà dùng bộ chuẩn truyền thống `pyenv` + `venv` + `pip`, quy trình chuẩn từ tạo môi trường đến cài thư viện gồm những lệnh nào?',
    frontHint: '`pyenv local` -> `python -m venv .venv` -> `source .venv/bin/activate` -> `pip install`.',
    backAnswer:
      '1. Chọn phiên bản Python cho dự án: `pyenv local 3.12.7`.\n2. Tạo thư mục môi trường ảo `.venv`: `python -m venv .venv`.\n3. **Kích hoạt (Activate)** môi trường ảo: `source .venv/bin/activate` (trên macOS/Linux) hoặc `.venv\\Scripts\\Activate.ps1` (trên Windows).\n4. Cài đặt thư viện: `pip install requests` và xuất file khóa `pip freeze > requirements.txt`.\n5. Chạy code: `python main.py` (khi xong gõ `deactivate` để thoát `.venv`).',
    backAnalogy:
      'Phương pháp truyền thống yêu cầu bạn tự mở khóa bước vào phòng làm việc (`source .venv/bin/activate`) trước khi sử dụng máy móc (`pip`, `python`).',
    codeSnippet: `pyenv local 3.12.7
python -m venv .venv
source .venv/bin/activate        # Bắt buộc kích hoạt trước khi dùng pip/python!
pip install -r requirements.txt
python main.py`,
    relatedTermIds: ['concept-venv'],
  },
  {
    id: 'fc-110',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án (pyenv / venv / pip / Poetry / Pipenv)',
    frontQuestion: 'Tại sao sau khi cài `pyenv` và chạy `pyenv global 3.12.7`, nhiều người gõ `python --version` vẫn ra bản Python cũ của hệ thống? Cách khắc phục là gì?',
    frontHint: 'Thiếu cấu hình Shims (`eval "$(pyenv init -)"`) trong `~/.zshrc` hoặc `~/.bashrc`.',
    backAnswer:
      '`pyenv` hoạt động bằng cơ chế **Shims** (đặt thư mục `~/.pyenv/shims` lên đầu biến môi trường `PATH` để đón lõng lệnh `python`). Nếu bạn chỉ cài `pyenv` mà quên thêm dòng khởi tạo `eval "$(pyenv init -)"` vào file cấu hình Shell (`~/.zshrc` trên macOS hoặc `~/.bashrc` trên Linux), Terminal sẽ gọi thẳng bản Python cũ của hệ thống.',
    backAnalogy:
      'Đã lắp tổng đài chuyển mạch tự động (`pyenv`) nhưng chưa cắm dây tổng đài vào đường dây chính của tòa nhà (`PATH` trong `.zshrc`).',
    codeSnippet: `# Thêm vào ~/.zshrc (macOS) hoặc ~/.bashrc (Linux) rồi chạy source ~/.zshrc:
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"`,
    relatedTermIds: ['concept-venv'],
  },
  {
    id: 'fc-111',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án (pyenv / venv / pip / Poetry / Pipenv)',
    frontQuestion: 'Bộ công cụ `pip-tools` (`pip-compile` & `pip-sync`) giải quyết điểm yếu nào của việc gõ `pip freeze > requirements.txt` thủ công?',
    frontHint: 'Tách bạch file khai báo gói gốc (`requirements.in`) và file khóa toàn bộ cây phụ thuộc (`requirements.txt`).',
    backAnswer:
      'Khi gõ `pip freeze > requirements.txt`, toàn bộ gói chính (như `fastapi`) và hàng chục gói phụ thuộc con (như `starlette`, `anyio`, `idna`) bị trộn lẫn không phân biệt được đâu là gói bạn chủ động cài, khiến việc nâng cấp hoặc gỡ bỏ cực kỳ khổ sở. Với **`pip-tools`**, bạn chỉ viết các gói chính vào **`requirements.in`**, sau đó chạy **`pip-compile`** để tự sinh ra `requirements.txt` có chú thích nguồn gốc rõ ràng, và dùng **`pip-sync`** để đồng bộ `.venv`.',
    backAnalogy:
      '`requirements.in` là danh sách 3 món ăn bạn đặt, còn `pip-compile` tự động tính toán và xuất ra bảng kê chi tiết 30 loại gia vị cần thiết (`requirements.txt`).',
    codeSnippet: `# 1. Chỉ ghi gói chính vào requirements.in:
# fastapi>=0.115.0
# 2. Biên dịch ra file khóa requirements.txt:
pip-compile requirements.in -o requirements.txt
# 3. Đồng bộ chính xác môi trường ảo theo requirements.txt:
pip-sync requirements.txt`,
    relatedTermIds: ['concept-venv'],
  },
  {
    id: 'fc-112',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Quản lý Dự án (pyenv / venv / pip / Poetry / Pipenv)',
    frontQuestion: 'Khi làm việc với dự án dùng `Poetry` hoặc `Pipenv`, các lệnh cơ bản để cài đặt môi trường, thêm gói và chạy code là gì?',
    frontHint: '`poetry install` / `poetry add` / `poetry run` vs `pipenv sync` / `pipenv install` / `pipenv run`.',
    backAnswer:
      '- **Với Poetry** (dùng `pyproject.toml` + `poetry.lock`):\n  • Cấu hình tạo `.venv` ngay trong dự án: `poetry config virtualenvs.in-project true`\n  • Cài môi trường từ lockfile: `poetry install`\n  • Thêm gói: `poetry add httpx` (dev: `poetry add --group dev pytest`)\n  • Chạy code: `poetry run python main.py`\n- **Với Pipenv** (dùng `Pipfile` + `Pipfile.lock`):\n  • Cài từ lockfile: `pipenv sync --dev` | Thêm gói: `pipenv install requests` | Chạy: `pipenv run python main.py`.',
    backAnalogy:
      'Nhìn vào file khóa ở gốc dự án để chọn đúng chìa khóa: thấy `uv.lock` dùng `uv`, thấy `poetry.lock` dùng `poetry`, thấy `Pipfile.lock` dùng `pipenv`, thấy `requirements.txt` dùng `pip`.',
    codeSnippet: `# Luôn bật cấu hình để Poetry tạo thư mục ./.venv ngay trong dự án:
poetry config virtualenvs.in-project true
poetry install
poetry run pytest`,
    relatedTermIds: ['tool-pyproject-toml', 'concept-venv'],
  },
  {
    id: 'fc-113',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Entrypoint',
    frontQuestion: 'Điểm khởi chạy (Entrypoint) của một dự án Python là gì? Khi nhận một dự án mới, làm sao biết phải chạy file nào và bằng lệnh gì?',
    frontHint: 'Kiểm tra `pyproject.toml` (`[project.scripts]`), `main.py` / `app.py` và khối `if __name__ == "__main__":`.',
    backAnswer:
      'Khác với Node.js có trường `"main"` hoặc `"scripts": {"start": "..."}` trong `package.json`, trong dự án Python bạn xác định điểm chạy qua 3 nơi:\n1. Mục **`[project.scripts]`** trong `pyproject.toml` (ví dụ `my-cli = "my_app.main:run"`).\n2. File **`main.py`**, **`app.py`**, **`cli.py`** hoặc **`__main__.py`** chứa khối `if __name__ == "__main__":`.\n3. Nếu là Web API (FastAPI): chạy qua ASGI server `uv run uvicorn my_app.main:app --reload`.',
    backAnalogy:
      'Giống như tìm nút "Power" khởi động cỗ máy: hoặc xem bảng điều khiển chính (`pyproject.toml`), hoặc tìm file có dán nhãn công tắc chính (`if __name__ == "__main__":`).',
    codeSnippet: `# 3 cách chạy phổ biến nhất trong thực tế:
uv run python main.py                      # 1. Dự án script đơn giản
uv run python -m my_app.main               # 2. Dự án cấu trúc chuẩn src/my_app/main.py
uv run uvicorn my_app.main:app --reload    # 3. Dự án Web API FastAPI`,
    relatedTermIds: ['concept-src-layout', 'tool-uv'],
  },
  {
    id: 'fc-114',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Entrypoint',
    frontQuestion: 'Tại sao khi dự án chia theo cấu trúc `src/my_app/main.py`, ta nên chạy bằng lệnh `python -m my_app.main` (sau khi cài Editable) thay vì `python src/my_app/main.py`?',
    frontHint: 'Tránh lỗi `ModuleNotFoundError: No module named my_app` do khác biệt trong `sys.path`.',
    backAnswer:
      'Khi bạn chạy trực tiếp `python src/my_app/main.py`, Python chỉ thêm thư mục `src/my_app/` vào đầu `sys.path`, nên câu lệnh `from my_app.utils import helper` bên trong sẽ báo lỗi **`ModuleNotFoundError: No module named "my_app"`**. Ngược lại, khi cài đặt dự án ở chế độ Editable (`uv sync` hoặc `pip install -e .`) và chạy qua cờ module **`python -m my_app.main`**, Python nhận diện đầy đủ gốc package `my_app` và mọi lệnh import đều hoạt động trơn tru.',
    backAnalogy:
      'Gọi `python -m my_app.main` là đi vào từ cổng chính của khu đô thị có bản đồ đầy đủ, còn `python src/my_app/main.py` là nhảy dù thẳng xuống một con hẻm cụt nên không nhìn thấy biển tên khu đô thị.',
    codeSnippet: `# Cài đặt package hiện tại ở chế độ Editable vào .venv:
# Với uv:   uv sync  (hoặc uv pip install -e .)
# Với pip:  pip install -e .
# Sau đó chạy bằng cờ -m (module):
uv run python -m my_app.main`,
    relatedTermIds: ['concept-src-layout', 'kw-import'],
  },
  {
    id: 'fc-115',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & Entrypoint',
    frontQuestion: 'Dòng lệnh `if __name__ == "__main__":` ở cuối file Python có ý nghĩa gì? Nếu bỏ nó đi thì chuyện gì xảy ra?',
    frontHint: 'Phân biệt giữa việc file được chạy trực tiếp bằng lệnh `python file.py` và việc file được nơi khác `import`.',
    backAnswer:
      'Mỗi file `.py` đều có biến đặc biệt `__name__`. Khi bạn **chạy trực tiếp** file đó (`python app.py`), Python gán `__name__ = "__main__"`. Nhưng khi file khác **`import app`** để tái sử dụng hàm, `__name__` sẽ mang tên module là `"app"`. Nhờ chốt chặn `if __name__ == "__main__":`, phần code chạy thử hoặc khởi động server bên dưới chỉ thực thi khi bạn chủ động chạy file đó, không bị vô tình kích hoạt khi file khác `import`!',
    backAnalogy:
      'Chốt an toàn giúp phân biệt giữa việc "Bấm nút nổ máy chạy xe ra đường" (`__main__`) và việc "Mở nắp capo lấy phụ tùng sang xe khác" (`import`).',
    codeSnippet: `def calculate_tax(amount: float) -> float:
    return amount * 0.1

# Chỉ chạy khi gọi trực tiếp: python tax.py
# KHÔNG tự chạy khi file khác gọi: from tax import calculate_tax
if __name__ == "__main__":
    print(calculate_tax(1000))`,
    relatedTermIds: ['dunder-name', 'kw-import'],
  },
  {
    id: 'fc-116',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giải phẫu Dự án & IDE',
    frontQuestion: 'Tại sao đã cài thư viện bằng `uv add` hoặc `pip install` và chạy trong Terminal ngon lành, nhưng trong VS Code / Cursor vẫn báo gạch chân vàng `Import "httpx" could not be resolved`?',
    frontHint: 'VS Code đang trỏ nhầm Python Interpreter ra ngoài hệ thống thay vì `.venv` của dự án.',
    backAnswer:
      'Trình kiểm tra kiểu của VS Code (Pylance / Pyright) cần biết chính xác môi trường `.venv` nào đang chứa thư viện của dự án. Nếu góc dưới bên phải VS Code đang trỏ vào Python mặc định của macOS/Windows (`/usr/bin/python3`), nó sẽ không tìm thấy thư viện vừa cài trong `.venv`. Bạn chỉ cần bấm `Cmd/Ctrl + Shift + P` $\\rightarrow$ **`Python: Select Interpreter`** $\\rightarrow$ chọn **`.venv/bin/python`** của dự án.',
    backAnalogy:
      'Bạn đã cất sách vào tủ sách phòng làm việc (`.venv`), nhưng trợ lý VS Code lại đang đứng tìm ở tủ sách phòng khách (`/usr/bin/python3`).',
    codeSnippet: `# Cách cấu hình cố định trong .vscode/settings.json của dự án:
{
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python"
}`,
    relatedTermIds: ['concept-venv', 'tool-pyright'],
  },

  // ============================================================================
  // PHẦN B: CÚ PHÁP CƠ BẢN, BIẾN, KIỂU DỮ LIỆU, CHUỖI & TOÁN TỬ (fc-117 -> fc-160)
  // ============================================================================
  {
    id: 'fc-117',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cú pháp Cốt lõi & Thụt lề',
    frontQuestion: 'Python phân tách các khối lệnh (Block của `if`, `for`, `def`, `class`) bằng cách nào thay vì dùng cặp ngoặc nhọn `{ ... }` như JS/TS/Java/C++?',
    frontHint: 'Thụt lề (Indentation) chuẩn 4 dấu cách (4 spaces) theo PEP 8.',
    backAnswer:
      'Trong Python, **Thụt lề (Indentation)** không chỉ để trang trí cho đẹp mà là **cú pháp bắt buộc** quyết định câu lệnh nào nằm trong khối nào. Chuẩn **PEP 8** quy định dùng đúng **4 dấu cách (4 spaces)** cho mỗi cấp thụt lề. Nếu thụt lề lệch hàng hoặc trộn lẫn ký tự `Tab` và `Space`, Python sẽ ném lỗi `IndentationError` hoặc `TabError` ngay khi biên dịch.',
    backAnalogy:
      'Thay vì xây tường rào `{}` bao quanh từng phòng, Python xếp các dòng lệnh thẳng hàng theo từng bậc thang để nhận diện cấp bậc.',
    codeSnippet: `def check_score(score: int) -> str:
    if score >= 50:
        return "Đạt"      # Thụt vào 8 spaces (nằm trong if)
    return "Chưa đạt"     # Thụt vào 4 spaces (nằm ngoài if, trong def)`,
    relatedTermIds: ['concept-pep8', 'kw-def', 'kw-if'],
  },
  {
    id: 'fc-118',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Biến & Mô hình Tham chiếu',
    frontQuestion: 'Trong Python, biến (Variable) thực chất là "cái hộp chứa giá trị" hay là "nhãn tên (Label) dán lên đối tượng trong bộ nhớ"? Hàm `id()` dùng để làm gì?',
    frontHint: 'Mọi thứ trong Python đều là Object; biến chỉ là thẻ tên trỏ tới địa chỉ bộ nhớ của Object đó.',
    backAnswer:
      'Trong C, biến là một ô nhớ cố định chứa giá trị. Ngược lại, trong Python **biến là một nhãn tên (Name / Reference)** gắn vào một đối tượng (`PyObject`) nằm trên vùng nhớ Heap. Khi gán `b = a`, Python **không sao chép dữ liệu** mà chỉ dán thêm nhãn `b` vào cùng đối tượng mà `a` đang trỏ tới. Hàm tích hợp **`id(x)`** trả về định danh duy nhất (địa chỉ bộ nhớ trong CPython) của đối tượng đó.',
    backAnalogy:
      'Hai tấm thẻ tên `a` và `b` cùng buộc dây vào một chiếc vali duy nhất trong kho hành lý; mở vali qua dây `a` hay dây `b` đều thấy cùng một đồ vật bên trong.',
    codeSnippet: `a = [1, 2, 3]
b = a               # b và a cùng trỏ tới đúng 1 list trong bộ nhớ!
print(id(a) == id(b), a is b)  # True True`,
    relatedTermIds: ['builtin-id', 'kw-is'],
  },
  {
    id: 'fc-119',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Toán tử & So sánh',
    frontQuestion: 'Phân biệt toán tử `==` (Equality) và toán tử `is` (Identity) trong Python. Khi nào bắt buộc dùng `is` và khi nào bắt buộc dùng `==`?',
    frontHint: 'So sánh giá trị bên trong (`__eq__`) vs So sánh địa chỉ bộ nhớ (`id(a) == id(b)`).',
    backAnswer:
      '- **`a == b`**: Kiểm tra **Giá trị (Value Equality)** xem nội dung bên trong hai đối tượng có bằng nhau không (bằng cách gọi phương thức `a.__eq__(b)`). Luôn dùng `==` khi so sánh số, chuỗi, list, dict.\n- **`a is b`**: Kiểm tra **Định danh bộ nhớ (Object Identity)** xem `a` và `b` có phải là **cùng một đối tượng duy nhất trong RAM** hay không (`id(a) == id(b)`). Quy tắc PEP 8: **Luôn dùng `is None` / `is not None`** để kiểm tra `None`.',
    backAnalogy:
      '`==` hỏi: "Hai tờ tiền này có cùng mệnh giá 500.000đ không?", còn `is` hỏi: "Hai biến này có đang cầm cùng một tờ tiền có đúng số seri đó không?".',
    codeSnippet: `x = [1, 2]
y = [1, 2]
print(x == y)       # True  (Cùng giá trị [1, 2])
print(x is y)       # False (Hai vùng nhớ list khác nhau)
print(x is not None) # True (Chuẩn PEP 8 khi kiểm tra None)`,
    relatedTermIds: ['kw-is', 'kw-none', 'dunder-eq'],
  },
  {
    id: 'fc-120',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Giá trị rỗng & None',
    frontQuestion: '`None` trong Python là gì, thuộc kiểu dữ liệu nào, và nó khác gì với `null` / `undefined` trong JavaScript?',
    frontHint: 'Đối tượng Singleton duy nhất đại diện cho sự vắng mặt của giá trị.',
    backAnswer:
      'Trong khi JavaScript tách thành `undefined` và `null`, Python chỉ có duy nhất một hằng số **`None`** (thuộc kiểu `NoneType`) để biểu thị "không có giá trị". Mọi hàm Python nếu không có lệnh `return` (hoặc chỉ viết `return` trống) đều tự động trả về `None`. Vì toàn bộ chương trình chỉ có đúng **1 thực thể `None` duy nhất (Singleton)** trong bộ nhớ, ta luôn kiểm tra bằng `if x is None:`.',
    backAnalogy:
      '`None` là con dấu "TRỐNG" duy nhất của cả tòa án; mọi hồ sơ chưa có kết quả đều dùng chung đúng con dấu này.',
    codeSnippet: `def log_msg(msg: str) -> None:
    print(msg)

result = log_msg("Hello")
print(result is None, type(result))  # True <class 'NoneType'>`,
    relatedTermIds: ['kw-none', 'kw-is'],
  },
  {
    id: 'fc-121',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cạm bẫy JS/TS sang Python',
    frontQuestion: 'Cạm bẫy cực lớn cho lập trình viên JS/TS: Những giá trị nào trong Python được coi là **Falsy** (sai khi đưa vào `if`), và khác biệt lớn nhất so với JavaScript là gì?',
    frontHint: 'Trong JS, mảng rỗng `[]` và object rỗng `{}` là Truthy, còn trong Python thì sao?',
    backAnswer:
      'Trong JavaScript, `Boolean([])` và `Boolean({})` đều là **`true`**! Ngược lại, trong Python, **mọi cấu trúc dữ liệu rỗng (`[]`, `{}`, `()`, `set()`, `""`, `range(0)`) đều là `False` (Falsy)**, cùng với `None`, `False`, và các số bằng không (`0`, `0.0`, `0j`, `Decimal(0)`). Vì vậy trong Python, để kiểm tra danh sách có phần tử hay không, ta viết trực tiếp `if items:` thay vì `if len(items) > 0:`.',
    backAnalogy:
      'Trong JS, "cái giỏ rỗng" vẫn được tính là "có cái giỏ" (`true`); còn trong Python, "giỏ không có hàng bên trong" được tính thẳng là `False`!',
    codeSnippet: `items: list[int] = []
if not items:
    print("Danh sách đang rỗng!")  # Chuẩn Pythonic (không cần len(items) == 0)`,
    relatedTermIds: ['type-bool', 'builtin-bool'],
  },
  {
    id: 'fc-122',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Toán tử & Logic',
    frontQuestion: 'Toán tử logic `and` và `or` trong Python thực sự trả về giá trị gì? (Có phải lúc nào cũng trả về `True` / `False` không?)',
    frontHint: 'Cơ chế đánh giá ngắn mạch (Short-circuit evaluation) trả về chính toán hạng quyết định kết quả.',
    backAnswer:
      'Giống với `&&` và `||` trong JS, toán tử `and` và `or` trong Python **không ép kiểu kết quả thành `bool`** mà trả về **chính giá trị của toán hạng** quyết định biểu thức:\n- **`A or B`**: Nếu `A` là Truthy thì trả về `A` ngay lập tức; nếu `A` là Falsy thì trả về `B` (thường dùng để đặt giá trị mặc định: `name = user_input or "Khách"`).\n- **`A and B`**: Nếu `A` là Falsy thì trả về `A` ngay; nếu `A` là Truthy thì trả về `B`.',
    backAnalogy:
      '`or` giống như tìm người trực thay: nếu người thứ nhất có mặt (Truthy) thì chọn luôn người đó; nếu vắng mặt (Falsy) thì cử người thứ hai.',
    codeSnippet: `raw_name = ""
display_name = raw_name or "Ẩn danh"
print(display_name)  # "Ẩn danh"`,
    relatedTermIds: ['kw-and', 'kw-or', 'kw-not'],
  },
  {
    id: 'fc-123',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Kiểu Số & Toán học',
    frontQuestion: 'Sự khác nhau giữa 3 toán tử chia trong Python: `/` (True Division), `//` (Floor Division) và `%` (Modulo), cùng hàm tích hợp `divmod(a, b)` là gì?',
    frontHint: 'Chú ý kết quả của `/` luôn là `float`, và cách `//` làm tròn xuống với số âm.',
    backAnswer:
      '- **`a / b`**: Phép chia thực, **luôn trả về `float`** (kể cả chia hết như `4 / 2` vẫn ra `2.0`).\n- **`a // b`**: Chia lấy phần nguyên làm tròn xuống cận dưới ($\\lfloor a/b \\rfloor$). Lưu ý với số âm: `-7 // 2` ra `-4` (vì làm tròn xuống `-3.5` thành `-4`).\n- **`a % b`**: Chia lấy phần dư.\n- **`divmod(a, b)`**: Trả về cùng lúc tuple `(thương_nguyên, số_dư)` chỉ trong 1 phép tính CPU (rất tiện để đổi giây sang phút:giây).',
    backAnalogy:
      '`divmod(135, 60)` trả lời ngay trong 1 nhịp: "135 giây gồm **2 phút** nguyên và dư **15 giây**".',
    codeSnippet: `print(10 / 2)           # 5.0 (luôn là float)
print(10 // 3, 10 % 3)  # 3 1
minutes, seconds = divmod(135, 60)
print(f"{minutes}m {seconds}s")  # 2m 15s`,
    relatedTermIds: ['builtin-divmod', 'type-int', 'type-float'],
  },
  {
    id: 'fc-124',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Kiểu Số & Toán học',
    frontQuestion: 'Tại sao trong Python phép tính `10 ** 100` (10 mũ 100) vẫn tính chính xác từng chữ số mà không bao giờ bị tràn số (`Integer Overflow`) như C/Java hay mất độ chính xác như `Number` trong JS?',
    frontHint: 'Kiểu `int` của Python có độ chính xác tùy ý (Arbitrary-precision integer) tự mở rộng theo RAM.',
    backAnswer:
      'Trong JavaScript, số nguyên chỉ chính xác tới $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`), còn trong C/Java `int64` bị tràn ở $9 \\times 10^{18}$. Trong Python 3, kiểu **`int` có độ lớn không giới hạn (Arbitrary-Precision / BigInt tích hợp sẵn)**: CPython tự động cấp phát mảng các chữ số ở tầng C dài thêm bao nhiêu tùy ý miễn là máy còn RAM! Bạn cũng có thể viết dấu gạch dưới `1_000_000` để dễ đọc.',
    backAnalogy:
      'Số `int` của Python giống như đoàn tàu hỏa tự động nối thêm toa mới mỗi khi số chữ số tăng lên, không bao giờ bị tràn khỏi toa.',
    codeSnippet: `budget = 15_000_000_000_000  # Viết dấu '_' phân tách hàng nghìn cực dễ đọc
huge = 2 ** 256
print(len(str(huge)))        # 78 chữ số chính xác tuyệt đối`,
    relatedTermIds: ['type-int'],
  },
  {
    id: 'fc-125',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Kiểu Số & Tài chính',
    frontQuestion: 'Tại sao `0.1 + 0.2 == 0.3` lại trả về `False` (`0.30000000000000004`) và hai cách xử lý chuẩn trong Python (cho Tài chính vs Khoa học) là gì?',
    frontHint: '`decimal.Decimal("0.1")` cho tiền tệ và `math.isclose()` cho tính toán kỹ thuật.',
    backAnswer:
      'Số thực `float` lưu dưới dạng nhị phân IEEE 754 (cơ số 2), không thể biểu diễn chính xác tuyệt đối các phân số thập phân như $1/10$ hay $2/10$. Cách xử lý chuẩn:\n1. **Cho Tiền tệ / Tài chính / Hóa đơn**: Bắt buộc dùng **`Decimal`** từ thư viện chuẩn `decimal` và **truyền chuỗi vào** (`Decimal("0.1") + Decimal("0.2") == Decimal("0.3")`).\n2. **Cho Khoa học / Vật lý**: Dùng **`math.isclose(0.1 + 0.2, 0.3)`**.',
    backAnalogy:
      'Hệ nhị phân viết $1/10$ bị lẻ vô hạn giống như hệ thập phân viết $1/3 = 0.33333...$; muốn tính tiền chính xác đến từng xu phải dùng sổ kế toán hệ thập phân (`Decimal`).',
    codeSnippet: `from decimal import Decimal
import math

print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True
print(math.isclose(0.1 + 0.2, 0.3))                       # True`,
    relatedTermIds: ['type-float', 'stdlib-decimal', 'stdlib-math'],
  },
  {
    id: 'fc-126',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Định dạng',
    frontQuestion: 'Các cú pháp tiện lợi nhất của **f-string** (Formatted String Literals) trong Python 3.8–3.12+ là gì (`f"{x=}"`, định dạng tiền tệ `,`, làm tròn `.2f`)?',
    frontHint: 'In nhanh cả tên biến lẫn giá trị để debug và định dạng số ngay sau dấu `:`.',
    backAnswer:
      'f-string (`f"..."`) không chỉ chèn biến cực nhanh mà còn hỗ trợ mini-language định dạng mạnh mẽ:\n- **`f"{user_id=}"`**: Tự in ra cả tên biến lẫn giá trị (`user_id=42`) — cực kỳ lợi hại khi debug nhanh!\n- **`f"{price:,.0f}"`**: Ngăn cách hàng nghìn bằng dấu phẩy (`15,000,000`).\n- **`f"{ratio:.2%}"`**: Đổi sang phần trăm lấy 2 số lẻ (`85.40%`).\n- Từ **Python 3.12+**, bạn có thể dùng lại dấu nháy kép `"` ngay bên trong biểu thức `{...}` của f-string.',
    backAnalogy:
      'Khuôn in thông minh vừa tự điền dữ liệu, vừa tự căn lề, đóng dấu phẩy tiền tệ và in nhãn debug chỉ trong một dòng.',
    codeSnippet: `user = "An"
revenue = 12500000.5
print(f"{user=} | Doanh thu: {revenue:,.2f} VNĐ")
# Kết quả: user='An' | Doanh thu: 12,500,000.50 VNĐ`,
    relatedTermIds: ['type-str'],
  },
  {
    id: 'fc-127',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Cắt lát (Slicing)',
    frontQuestion: 'Cú pháp cắt lát `seq[start:stop:step]` hoạt động như thế nào? Làm sao để lấy phần tử cuối cùng, lấy 3 phần tử cuối, hoặc đảo ngược một chuỗi/list?',
    frontHint: 'Chỉ số âm đếm từ cuối về đầu (`-1` là phần tử cuối); `stop` không bao gồm trong kết quả.',
    backAnswer:
      'Trong `seq[start:stop:step]`, khoảng lấy là nửa mở **`[start, stop)`** (bao gồm `start`, dừng **trước** `stop`):\n- **`seq[-1]`**: Phần tử cuối cùng.\n- **`seq[-3:]`**: 3 phần tử cuối cùng.\n- **`seq[:-1]`**: Tất cả trừ phần tử cuối cùng.\n- **`seq[::2]`**: Lấy cách quãng các phần tử ở vị trí chẵn (`0, 2, 4...`).\n- **`seq[::-1]`**: Tạo bản sao đảo ngược toàn bộ chuỗi hoặc list.',
    backAnalogy:
      'Thước cắt bánh mì có vạch đánh số từ đầu ổ bánh (`0, 1, 2...`) và cả từ đuôi ổ bánh đếm ngược lại (`-1, -2, -3...`).',
    codeSnippet: `code = "PYTHON-2026"
print(code[:6])     # "PYTHON"
print(code[-4:])    # "2026"
print(code[::-1])   # "6202-NOHTYP"`,
    relatedTermIds: ['type-str', 'type-list'],
  },
  {
    id: 'fc-128',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Hiệu năng',
    frontQuestion: 'Tại sao chuỗi (`str`) trong Python là **Immutable** (Bất biến) và tại sao nối chuỗi bằng `s += piece` trong vòng lặp lớn lại chậm hơn dùng `"".join(pieces)`?',
    frontHint: 'Mỗi lần cộng chuỗi phải cấp phát một vùng nhớ mới; `.join()` tính tổng độ dài và cấp phát đúng 1 lần ($O(N)$).',
    backAnswer:
      'Chuỗi `str` trong Python là **bất biến (Immutable)** — bạn không thể sửa `s[0] = "A"`. Khi nối nhiều mảnh chuỗi trong vòng lặp, cách chuẩn Pythonic và nhanh nhất là gom các mảnh vào một list hoặc generator rồi gọi **`"".join(pieces)`** (hoặc `"\\n".join(lines)`). Phương thức `.join()` tính trước tổng kích thước bộ nhớ cần thiết và chỉ cấp phát RAM **đúng 1 lần duy nhất ($O(N)$)**.',
    backAnalogy:
      'Thay vì mỗi lần thêm 1 viên gạch lại phải đập bức tường cũ xây lại bức tường mới dài hơn, `.join()` xếp sẵn toàn bộ gạch lên bàn rồi đổ khuôn một lần.',
    codeSnippet: `words = ["Python", "is", "fast", "and", "clean"]
sentence = " ".join(words)
print(sentence)  # "Python is fast and clean"`,
    relatedTermIds: ['type-str'],
  },
  {
    id: 'fc-129',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Xử lý Văn bản',
    frontQuestion: 'Trong Python 3.9+, tại sao nên dùng `.removeprefix()` và `.removesuffix()` thay vì dùng `.lstrip()` / `.rstrip()` để cắt tiền tố hoặc đuôi file?',
    frontHint: 'Cạm bẫy kinh điển: `.lstrip("pre_")` xóa TẬP HỢP các ký tự lẻ chứ không phải xóa cụm từ `"pre_"`!',
    backAnswer:
      'Nhiều người lầm tưởng `filename.rstrip(".py")` sẽ xóa đuôi `".py"`. Thực tế, `.strip(chars)` coi tham số là **tập hợp các ký tự rời rạc** `{".", "p", "y"}` và xóa sạch mọi chữ `p` hoặc `y` ở cuối (nên `"happy.py".rstrip(".py")` bị cắt cụt thành `"ha"`!). Để cắt chính xác một tiền tố hoặc hậu tố nguyên cụm, luôn dùng **`.removeprefix("...")`** và **`.removesuffix("...")`**.',
    backAnalogy:
      '`.rstrip(".py")` là máy cắt cỏ phạt sạch bất kỳ cây nào tên `.`, `p`, hoặc `y` ở rìa; còn `.removesuffix(".py")` là chiếc kéo chỉ cắt đúng nhãn đuôi `".py"`.',
    codeSnippet: `filename = "happy.py"
print(filename.rstrip(".py"))        # "ha"  <-- BUG NGHIÊM TRỌNG!
print(filename.removesuffix(".py"))  # "happy" <-- ĐÚNG CHUẨN!`,
    relatedTermIds: ['type-str'],
  },
  {
    id: 'fc-130',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Toán tử & Biểu thức',
    frontQuestion: 'Tính năng **Chained Comparisons** (So sánh chuỗi mắt xích, ví dụ `18 <= age < 65`) trong Python hoạt động như thế nào?',
    frontHint: 'Python cho phép viết liền như toán học mà chỉ tính biểu thức ở giữa đúng 1 lần.',
    backAnswer:
      'Trong JS/C/Java, bạn phải viết `age >= 18 && age < 65` (nếu viết `18 <= age < 65` trong JS sẽ chạy sai vì `18 <= age` biến thành `true/false` rồi đem so với `65`!). Trong Python, bạn viết tự nhiên như toán học **`18 <= age < 65`** (hoặc `a == b == c`). Python tự động dịch thành `(18 <= age) and (age < 65)` nhưng **chỉ đánh giá biểu thức ở giữa đúng 1 lần duy nhất**.',
    backAnalogy:
      'Đo chiều cao nằm giữa vạch 18 và vạch 65 chỉ trong một cái nhìn, không cần đo hai lần riêng biệt.',
    codeSnippet: `score = 85
if 80 <= score <= 100:
    print("Hạng Giỏi / Xuất sắc")`,
    relatedTermIds: ['kw-and'],
  },
  {
    id: 'fc-131',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Toán tử Hiện đại (Python 3.8+)',
    frontQuestion: 'Toán tử Hải mã **Walrus Operator (`:=`)** dùng để làm gì và khi nào nó giúp code gọn hơn rõ rệt?',
    frontHint: 'Vừa gán giá trị vào biến, vừa trả về chính giá trị đó ngay bên trong biểu thức `if`, `while` hoặc List Comprehension.',
    backAnswer:
      'Trong Python, dấu `=` là câu lệnh gán (Statement) nên không thể viết bên trong điều kiện `if (m = pattern.search(text)):`. Toán tử **`=`** (Assignment Expression — PEP 572) cho phép **vừa gán biến vừa kiểm tra điều kiện trong cùng 1 bước**, cực kỳ hữu ích khi đọc file theo từng khối (`while chunk := f.read(8192):`), kiểm tra Regex, hoặc tránh gọi một hàm tốn kém 2 lần trong Comprehension.',
    backAnalogy:
      'Vừa bắt con cá bỏ vào giỏ (`chunk := ...`) vừa kiểm tra ngay xem con cá có đủ lớn không trong cùng một động tác tay.',
    codeSnippet: `data = ["  hello  ", "   ", "  world "]
# Chỉ gọi s.strip() đúng 1 lần cho mỗi phần tử:
cleaned = [stripped for s in data if (stripped := s.strip())]
print(cleaned)  # ['hello', 'world']`,
    relatedTermIds: ['kw-if', 'kw-while'],
  },
  {
    id: 'fc-132',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Điều khiển Luồng (Python 3.10+)',
    frontQuestion: 'Cấu trúc **`match ... case`** (Structural Pattern Matching) trong Python 3.10+ mạnh hơn `switch ... case` truyền thống của JS/C ở điểm nào?',
    frontHint: 'Không chỉ so sánh giá trị đơn lẻ mà còn bóc tách cấu trúc (Unpacking) tuple, list, dict, object kèm điều kiện `if` (Guard)!',
    backAnswer:
      '`match ... case` của Python không phải là `switch/case` đơn thuần mà là **Structural Pattern Matching**:\n1. Bóc tách hình dáng và trích xuất biến trực tiếp từ `dict`, `list`, `tuple` hoặc `dataclass`/`class`.\n2. Hỗ trợ toán tử OR (`case 401 | 403:`), bắt phần còn lại (`*rest`), điều kiện phụ (`case [x, y] if x == y:`), và wildcard mặc định (`case _:`).\n3. Không bị "rơi xuyên qua" (no fall-through) nên **không cần viết `break`** ở cuối mỗi `case`.',
    backAnalogy:
      'Máy phân loại bưu kiện bằng tia X: không chỉ đọc nhãn bên ngoài mà còn soi cấu trúc bên trong hộp để bóc tách đúng món hàng.',
    codeSnippet: `def handle_event(event: dict) -> str:
    match event:
        case {"type": "payment", "amount": amt} if amt > 0:
            return f"Thanh toán hợp lệ: {amt}"
        case {"type": "login" | "signup", "user": username}:
            return f"Xác thực người dùng: {username}"
        case _:
            return "Sự kiện không xác định"`,
    relatedTermIds: ['kw-match', 'kw-case'],
  },
  {
    id: 'fc-133',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Vòng lặp & Điều khiển Luồng',
    frontQuestion: 'Khối `else` đi kèm sau vòng lặp `for ... else` (hoặc `while ... else`) trong Python sẽ chạy khi nào?',
    frontHint: 'Hãy hiểu chữ `else` ở đây là **`no break`** (Chạy khi vòng lặp kết thúc tự nhiên mà KHÔNG gặp lệnh `break`).',
    backAnswer:
      'Đây là cú pháp đặc trưng rất hay gây hiểu nhầm cho người mới: khối `else:` gắn với vòng lặp `for`/`while` **chỉ chạy khi vòng lặp duyệt hết tất cả phần tử một cách tự nhiên mà KHÔNG bị ngắt giữa chừng bởi lệnh `break`**. Nó giúp bạn tìm kiếm một phần tử trong danh sách mà không cần tạo biến cờ `found = False` bên ngoài.',
    backAnalogy:
      'Đi lục tìm chìa khóa trong 5 ngăn kéo (`for`): nếu tìm thấy thì dừng ngay (`break`); nếu lục hết cả 5 ngăn mà **không thấy** (`else` = no break) thì gọi thợ khóa.',
    codeSnippet: `numbers = [2, 4, 6, 8]
for n in numbers:
    if n % 2 == 1:
        print("Tìm thấy số lẻ:", n)
        break
else:
    # Chỉ chạy vì vòng for bên trên KHÔNG gặp lệnh break nào!
    print("Toàn bộ danh sách đều là số chẵn!")`,
    relatedTermIds: ['kw-for', 'kw-else', 'kw-break'],
  },
  {
    id: 'fc-134',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Vòng lặp & Hàm Tích hợp',
    frontQuestion: 'Tại sao trong Python ta hầu như không bao giờ viết `for i in range(len(items)):` mà luôn dùng `for idx, item in enumerate(items, start=1):`?',
    frontHint: 'Trực tiếp lấy cả chỉ số (index) lẫn giá trị (value) sạch sẽ, hỗ trợ đặt số bắt đầu `start=1`.',
    backAnswer:
      'Viết `for i in range(len(items)): item = items[i]` vừa dài dòng vừa dễ nhầm chỉ số và không hoạt động được với các Iterator/Generator không có `len()`. Hàm tích hợp **`enumerate(iterable, start=0)`** trả về từng cặp `(index, item)` lười biếng (lazy), cho phép bóc tách trực tiếp trên dòng `for` và đặt `start=1` khi cần đánh số thứ tự hiển thị cho người dùng.',
    backAnalogy:
      'Máy phát số thứ tự tự động gắn kèm thẻ số vào từng khách hàng khi bước qua cửa.',
    codeSnippet: `tasks = ["Cài uv", "Tạo .venv", "Chạy code"]
for step, title in enumerate(tasks, start=1):
    print(f"Bước {step}: {title}")`,
    relatedTermIds: ['builtin-enumerate', 'kw-for'],
  },
  {
    id: 'fc-135',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Vòng lặp & Hàm Tích hợp',
    frontQuestion: 'Hàm `zip(list_a, list_b, strict=True)` dùng để làm gì và tại sao cờ `strict=True` (Python 3.10+) lại quan trọng trong thực tế?',
    frontHint: 'Ghép song song nhiều danh sách; `strict=True` ngăn chặn việc âm thầm cắt bỏ dữ liệu khi 2 danh sách lệch độ dài!',
    backAnswer:
      '`zip()` ghép các phần tử ở vị trí tương ứng của nhiều danh sách thành từng bộ tuple `(a_i, b_i)`. **Cạm bẫy mặc định**: nếu `list_a` có 5 phần tử mà `list_b` chỉ có 4 phần tử, `zip()` mặc định sẽ dừng ở phần tử thứ 4 và **âm thầm vứt bỏ phần tử thứ 5**! Bật **`strict=True`** buộc Python ném lỗi `ValueError` ngay nếu hai danh sách không bằng nhau, bảo vệ toàn vẹn dữ liệu.',
    backAnalogy:
      'Kéo khóa áo khoác hai bên (`zip`): bật `strict=True` giúp phát hiện ngay nếu một bên khóa bị thiếu mắt răng thay vì kéo lệch.',
    codeSnippet: `users = ["An", "Bình"]
scores = [95, 88]
for user, score in zip(users, scores, strict=True):
    print(f"{user}: {score} điểm")

# Mẹo tạo nhanh dict từ 2 list khóa và giá trị:
score_map = dict(zip(users, scores, strict=True))`,
    relatedTermIds: ['builtin-zip', 'type-dict'],
  },
  {
    id: 'fc-136',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Vòng lặp & Bộ nhớ',
    frontQuestion: 'Đối tượng `range(1_000_000_000)` trong Python 3 tốn bao nhiêu bộ nhớ RAM? Nó có tạo sẵn mảng 1 tỷ số trong bộ nhớ không?',
    frontHint: 'Lazy Sequence Object chỉ lưu đúng 3 con số `start`, `stop`, `step` (~48 bytes)!',
    backAnswer:
      'Trong Python 3, `range()` **không tạo ra một `list` chứa 1 tỷ số trong RAM**. Nó trả về một đối tượng dãy số thông minh (`range` object) chỉ lưu đúng **3 số nguyên `start`, `stop`, `step`** (chỉ tốn vỏn vẹn **48 bytes RAM** dù là `range(10)` hay `range(10**18)`!). Nó tính toán từng số khi vòng lặp yêu cầu và thậm chí kiểm tra `999_999_999 in range(1_000_000_000)` trong thời gian hằng số **$O(1)$** bằng phép toán số học.',
    backAnalogy:
      'Thay vì in sẵn 1 tỷ tờ vé số chất đầy kho, `range()` chỉ cầm công thức "Bắt đầu từ 0, bước nhảy 1, dừng ở 1 tỷ" để bấm số khi cần.',
    codeSnippet: `import sys
r = range(0, 1_000_000_000, 2)
print(sys.getsizeof(r))          # Chỉ 48 bytes!
print(500_000_000 in r)          # True (Tính toán tức thì O(1))`,
    relatedTermIds: ['builtin-range'],
  },
  {
    id: 'fc-137',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hàm Tích hợp (Built-ins)',
    frontQuestion: 'Cặp hàm tích hợp `any(iterable)` và `all(iterable)` hoạt động như thế nào và tại sao chúng nhanh hơn viết vòng lặp kiểm tra thủ công?',
    frontHint: 'Kết hợp với Generator Expression và tự động dừng sớm (Short-circuit) ngay khi biết chắc kết quả!',
    backAnswer:
      '- **`any(iterable)`**: Trả về `True` ngay khi gặp **ít nhất 1 phần tử Truthy** (dừng luôn không duyệt tiếp phần còn lại). Nếu rỗng trả về `False`.\n- **`all(iterable)`**: Trả về `True` nếu **tất cả phần tử đều Truthy** (dừng ngay lập tức nếu gặp 1 phần tử Falsy). **Lưu ý bẫy**: `all([])` trên danh sách rỗng trả về **`True`** (Vacuous truth)!',
    backAnalogy:
      '`any()` là chuông báo cháy: chỉ cần 1 đầu báo có khói là hú còi ngay; `all()` là kiểm tra điểm danh trước khi máy bay cất cánh: chỉ cần thiếu 1 hành khách là dừng lại ngay.',
    codeSnippet: `passwords = ["123456", "admin", "Sup3rS3cret!"]
has_strong_pw = any(len(p) >= 10 for p in passwords)
all_non_empty = all(len(p) > 0 for p in passwords)
print(has_strong_pw, all_non_empty)  # True True`,
    relatedTermIds: ['builtin-any', 'builtin-all'],
  },
  {
    id: 'fc-138',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cú pháp & Giữ chỗ',
    frontQuestion: 'Từ khóa `pass` và ký hiệu `...` (Ellipsis) trong Python dùng để làm gì?',
    frontHint: 'Lệnh rỗng giữ chỗ hợp lệ cho các khối code chưa viết xong hoặc khai báo giao diện `Protocol` / `@abstractmethod`.',
    backAnswer:
      'Vì Python bắt buộc sau dấu `:` của `def`, `class`, `if`, `except` phải có ít nhất 1 dòng lệnh thụt lề, bạn không thể để trống như `{}` trong JS. Bạn dùng:\n- **`pass`**: Câu lệnh "không làm gì cả" (No-op) để giữ cho cú pháp hợp lệ.\n- **`...` (Đối tượng `Ellipsis`)**: Rất phổ biến trong Python hiện đại để giữ chỗ cho các hàm chưa cài đặt, các phương thức trong `typing.Protocol`, `@overload`, hoặc cắt mảng đa chiều trong NumPy (`arr[..., 0]`).',
    backAnalogy:
      'Tấm biển "Đang thi công" đặt vào khung cửa để tòa nhà vẫn nghiệm thu kết cấu bình thường trước khi lắp nội thất.',
    codeSnippet: `class PaymentGateway:
    def charge(self, amount: int) -> bool:
        ...  # Giữ chỗ hợp lệ tương đương 'pass'`,
    relatedTermIds: ['kw-pass'],
  },
  {
    id: 'fc-139',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Nhập / Xuất Cơ bản',
    frontQuestion: 'Các tham số `sep`, `end`, `file`, `flush` của hàm `print()` trong Python có tác dụng gì?',
    frontHint: 'Mặc định `sep=" "` (nối các đối số bằng dấu cách) và `end="\\n"` (tự xuống dòng ở cuối).',
    backAnswer:
      'Hàm `print(*objects, sep=" ", end="\\n", file=sys.stdout, flush=False)` cho phép tùy biến linh hoạt:\n- **`sep`**: Ký tự ngăn cách giữa các đối số truyền vào (ví dụ `print("2026", "11", "08", sep="-")` in ra `2026-11-08`).\n- **`end`**: Ký tự kết thúc dòng (đặt `end=""` hoặc `end="\\r"` để in trên cùng 1 dòng làm thanh tiến trình).\n- **`flush=True`**: Ép đẩy dữ liệu ra màn hình/log Docker ngay lập tức không giữ trong bộ đệm.',
    backAnalogy:
      '`sep` là keo dán giữa các từ trong câu, còn `end` là dấu chấm xuống dòng ở cuối câu.',
    codeSnippet: `print("2026", "11", "08", sep="-")          # 2026-11-08
print("Đang xử lý...", end=" ", flush=True)
print("Hoàn tất!")                          # Đang xử lý... Hoàn tất!`,
    relatedTermIds: ['builtin-print'],
  },
  {
    id: 'fc-140',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Bytes',
    frontQuestion: 'Sự khác biệt cốt lõi giữa kiểu `str` (`"Xin chào"`) và kiểu `bytes` (`b"hello"`) trong Python 3 là gì? Khi nào dùng `.encode()` và `.decode()`?',
    frontHint: 'Văn bản ký tự Unicode cho con người đọc (`str`) vs Mảng byte thô 0–255 để truyền qua mạng/lưu đĩa (`bytes`).',
    backAnswer:
      '- **`str`**: Chuỗi các **ký tự Unicode** (văn bản con người đọc).\n- **`bytes`**: Dãy các **số nguyên từ 0 đến 255** đại diện cho dữ liệu nhị phân thô trên ổ cứng hoặc truyền qua mạng socket/HTTP.\n- Chuyển từ chữ sang byte để gửi/lưu: **`text.encode("utf-8")`** (`str` $\\rightarrow$ `bytes`).\n- Chuyển từ byte nhận được sang chữ: **`raw_bytes.decode("utf-8")`** (`bytes` $\\rightarrow$ `str`).',
    backAnalogy:
      '`str` là bức thư viết bằng tiếng Việt, `.encode("utf-8")` đóng gói bức thư thành tín hiệu điện báo (`bytes`) để truyền qua cáp quang, và `.decode("utf-8")` dịch tín hiệu điện báo ngược lại thành bức thư.',
    codeSnippet: `msg: str = "Xin chào 🐍"
raw: bytes = msg.encode("utf-8")
print(type(raw), len(raw))       # <class 'bytes'> 15
restored: str = raw.decode("utf-8")
print(restored == msg)           # True`,
    relatedTermIds: ['type-str', 'type-bytes'],
  },
  {
    id: 'fc-141',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi (Strings) & Raw String',
    frontQuestion: 'Chuỗi thô **Raw String (`r"..."`)** khác gì chuỗi thường và tại sao luôn dùng `r"..."` khi viết Biểu thức chính quy (Regex) hoặc đường dẫn Windows?',
    frontHint: 'Vô hiệu hóa việc xử lý ký tự thoát `\\n`, `\\t`, `\\d` của dấu gạch chéo ngược `\\`.',
    backAnswer:
      'Trong chuỗi thường, dấu `\\` được hiểu là ký tự thoát (Escape character, như `\\n` là xuống dòng, `\\t` là tab). Đặt chữ **`r`** ở đầu (**`r"\\d+\\s+\\w+"`**) báo cho Python giữ nguyên mọi dấu `\\` đúng theo nghĩa đen mà không biến đổi chúng. Nhờ vậy khi viết biểu thức chính quy (`re`) bạn chỉ cần viết `r"\\d+"` thay vì phải gõ kép `\\\\d+`.',
    backAnalogy:
      'Chế độ "Chụp ảnh nguyên trạng" (`r"..."`): thấy ký tự `\\` nào là in đúng ký tự đó, không tự ý dịch `\\n` thành phím Enter.',
    codeSnippet: `import re
text = "Mã đơn: ORD-2026, Giá: 500"
numbers = re.findall(r"\\d+", text)
print(numbers)  # ['2026', '500']`,
    relatedTermIds: ['type-str', 'stdlib-re'],
  },
  {
    id: 'fc-142',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Bóc tách Dữ liệu (Unpacking)',
    frontQuestion: 'Cú pháp **Extended Iterable Unpacking** (`first, *middle, last = items`) và hoán đổi 2 biến `a, b = b, a` trong Python hoạt động như thế nào?',
    frontHint: 'Dấu `*` gom toàn bộ phần tử dư vào một `list`; phép gán đa biến đánh giá toàn bộ vế phải thành tuple trước.',
    backAnswer:
      '1. **Hoán đổi không cần biến tạm**: Khi viết `a, b = b, a`, Python đóng gói vế phải thành tuple `(b, a)` trên Stack rồi giải nén gán lại cho `a` và `b` chỉ bằng lệnh Bytecode `SWAP`.\n2. **Bóc tách có dấu `*` (Starred expression)**: Cho phép lấy phần tử đầu, phần tử cuối và gom toàn bộ phần còn lại (dù có 0 hay 100 phần tử) vào một `list`. Dùng biến `_` hoặc `*_` cho những giá trị bạn muốn bỏ qua.',
    backAnalogy:
      'Chọn người đứng đầu hàng (`first`), người khóa đuôi (`last`), và gom tất cả những người đứng giữa vào một nhóm (`*middle`).',
    codeSnippet: `scores = [98, 85, 82, 79, 60]
top1, *others, lowest = scores
print(top1, others, lowest)  # 98 [85, 82, 79] 60`,
    relatedTermIds: ['type-tuple', 'type-list'],
  },
  {
    id: 'fc-143',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Biến & Quy ước Đặt tên (PEP 8)',
    frontQuestion: 'Trong Python, các quy ước đặt tên chuẩn PEP 8 (`snake_case`, `PascalCase`, `UPPER_SNAKE_CASE`, `_internal`, `__private`, `_`) có ý nghĩa gì?',
    frontHint: 'Khác với JS/TS dùng `camelCase`, Python dùng `snake_case` cho hàm/biến!',
    backAnswer:
      '- **`snake_case`** (`user_profile`, `calculate_total`): Dùng cho tên **biến, hàm, phương thức và tên file module** (`.py`).\n- **`PascalCase`** (`PaymentService`, `HttpClient`): Dùng cho tên **Class, Exception và Type Alias**.\n- **`UPPER_SNAKE_CASE`** (`MAX_RETRY_COUNT`): Dùng cho **Hằng số (Constants)**.\n- **`_single_leading_underscore`**: Quy ước "Nội bộ / Protected" (báo đồng nghiệp không nên truy cập từ ngoài).\n- **`__double_leading`**: Kích hoạt **Name Mangling** (`_ClassName__attr`).\n- **`_`** (một dấu gạch dưới): Biến tạm bỏ qua không dùng tới.',
    backAnalogy:
      'Đồng phục quy chuẩn của cộng đồng Python: nhìn vào kiểu viết hoa/thường là biết ngay đó là Class, Hàm hay Hằng số.',
    codeSnippet: `MAX_RETRIES = 3                 # Hằng số (UPPER_SNAKE_CASE)

class OrderProcessor:           # Class (PascalCase)
    def process_order(self):    # Hàm / Method (snake_case)
        for _ in range(MAX_RETRIES):  # '_' cho biến lặp không dùng tới
            pass`,
    relatedTermIds: ['concept-pep8'],
  },
  {
    id: 'fc-144',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Sao chép Dữ liệu (Copy)',
    frontQuestion: 'Phân biệt **Gán tham chiếu (`b = a`)**, **Sao chép nông (`Shallow Copy` — `a.copy()` / `a[:]`)** và **Sao chép sâu (`Deep Copy` — `copy.deepcopy(a)`)**?',
    frontHint: 'Chuyện gì xảy ra khi bên trong `list` ngoài cùng lại chứa các `list` hoặc `dict` con lồng bên trong?',
    backAnswer:
      '- **`b = a`**: Không tạo vùng nhớ mới; sửa `b` là sửa `a`.\n- **Shallow Copy (`b = a.copy()` hoặc `a[:]`)**: Tạo một vỏ `list` mới ở tầng 1, nhưng các phần tử con bên trong vẫn **dùng chung tham chiếu** với `a`. Nếu phần tử con là một `list` lồng bên trong (`a[0].append(99)`), cả `a` và `b` đều bị thay đổi!\n- **Deep Copy (`copy.deepcopy(a)`)**: Đệ quy sao chép mới hoàn toàn mọi tầng từ ngoài vào trong, tách biệt 100%.',
    backAnalogy:
      'Shallow Copy là photo tờ danh bạ mới nhưng vẫn gọi chung vào cùng một số nhà; Deep Copy là xây hẳn một khu nhà mới giống hệt từ phòng khách đến phòng ngủ.',
    codeSnippet: `import copy
matrix = [[1, 2], [3, 4]]
shallow = matrix.copy()
deep = copy.deepcopy(matrix)

matrix[0].append(99)
print(shallow[0])  # [1, 2, 99] <-- Bị ảnh hưởng vì chung list con!
print(deep[0])     # [1, 2]     <-- An toàn tuyệt đối!`,
    relatedTermIds: ['type-list'],
  },
  {
    id: 'fc-145',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Sắp xếp Dữ liệu (Sorting)',
    frontQuestion: 'Sự khác biệt quan trọng giữa phương thức `items.sort()` và hàm tích hợp `sorted(items)` là gì?',
    frontHint: 'Sửa trực tiếp tại chỗ trả về `None` (In-place) vs Tạo danh sách mới giữ nguyên bản gốc.',
    backAnswer:
      '- **`items.sort()`**: Chỉ có trên kiểu `list`, sắp xếp **trực tiếp tại chỗ (in-place)** làm thay đổi `items` gốc và **trả về `None`** (cạm bẫy kinh điển: viết `x = items.sort()` sẽ khiến `x` bằng `None`!).\n- **`sorted(iterable, key=..., reverse=False)`**: Nhận bất kỳ Iterable nào (`list`, `tuple`, `dict`, `set`, generator) và **trả về một `list` mới đã sắp xếp**, giữ nguyên dữ liệu gốc. Cả hai đều dùng thuật toán **Timsort** ổn định (Stable sort, $O(N \\log N)$).',
    backAnalogy:
      '`items.sort()` là sắp xếp lại sách ngay trên kệ hiện tại; còn `sorted(items)` là chụp danh sách sách rồi in ra một bảng xếp hạng mới.',
    codeSnippet: `users = [{"name": "Bình", "age": 30}, {"name": "An", "age": 22}]
# Tạo list mới sắp xếp theo tuổi tăng dần, giữ nguyên list users gốc:
by_age = sorted(users, key=lambda u: u["age"])
print(by_age[0]["name"])  # "An"`,
    relatedTermIds: ['builtin-sorted', 'type-list'],
  },
  {
    id: 'fc-146',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Kiểm thử & Gỡ lỗi Cơ bản',
    frontQuestion: 'Câu lệnh `assert condition, "Thông báo lỗi"` dùng để làm gì và tại sao **tuyệt đối không dùng `assert`** để kiểm tra quyền hạn bảo mật hoặc dữ liệu người dùng nhập vào trên Production?',
    frontHint: 'Chuyện gì xảy ra với mọi câu lệnh `assert` khi chạy Python kèm cờ tối ưu hóa `python -O`?',
    backAnswer:
      '`assert` dùng để kiểm tra các giả định nội bộ lúc phát triển (Sanity check) và trong bộ kiểm thử **`pytest`**. Tuy nhiên, khi chạy Python với cờ tối ưu hóa **`python -O`** (hoặc biến môi trường `PYTHONOPTIMIZE=1`), trình biên dịch CPython sẽ **xóa bỏ hoàn toàn mọi câu lệnh `assert` khỏi Bytecode**! Do đó, kiểm tra đầu vào của user hoặc phân quyền bảo mật bắt buộc phải dùng `if ...: raise ValueError(...)` / `PermissionError(...)`.',
    backAnalogy:
      '`assert` là giàn giáo kiểm tra lúc xây nhà (sẽ tháo ra khi bật chế độ `-O`), còn `if / raise` là tường bê tông chịu lực vĩnh viễn.',
    codeSnippet: `# ❌ NGUY HIỂM: Bị xóa sạch nếu chạy 'python -O app.py'!
# assert user.is_admin, "Không có quyền!"

# ✅ CHUẨN PRODUCTION: Luôn chạy trong mọi chế độ
if not user.is_admin:
    raise PermissionError("Không có quyền truy cập!")`,
    relatedTermIds: ['kw-assert', 'kw-raise'],
  },
  {
    id: 'fc-147',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Ngoại lệ & Xử lý Lỗi Cơ bản',
    frontQuestion: 'Trong cấu trúc đầy đủ `try ... except ... else ... finally`, khối `else:` và khối `finally:` lần lượt chạy khi nào?',
    frontHint: 'Tại sao nên đặt các dòng code tiếp theo vào `else:` thay vì nhét tất cả vào trong khối `try:`?',
    backAnswer:
      '- **`try:`**: Chỉ nên chứa đúng dòng lệnh có nguy cơ ném ngoại lệ.\n- **`except SomeError as e:`**: Chạy khi `try` xảy ra lỗi khớp kiểu.\n- **`else:`**: Chỉ chạy khi khối `try` **thành công mỹ mãn không có lỗi nào** (giúp tránh việc `except` vô tình bắt nhầm lỗi của các dòng code xử lý phía sau!).\n- **`finally:`**: **Luôn luôn chạy** dù có lỗi, không lỗi hay có lệnh `return` bên trong (dùng để giải phóng tài nguyên).',
    backAnalogy:
      '`try` là lúc mở két sắt, `except` là còi báo động khi sai mã, `else` là lấy tài liệu khi mở két thành công, và `finally` là đóng cửa phòng kho trước khi ra về.',
    codeSnippet: `try:
    value = int("42")
except ValueError:
    print("Không phải số hợp lệ!")
else:
    print("Chuyển đổi thành công:", value * 2)
finally:
    print("Hoàn tất bước kiểm tra.")`,
    relatedTermIds: ['kw-try', 'kw-except', 'kw-finally'],
  },
  {
    id: 'fc-148',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Làm việc với File & Encoding',
    frontQuestion: 'Tại sao khi mở file văn bản bằng `open("data.txt", "r", encoding="utf-8")` hoặc `Path("data.txt").read_text(encoding="utf-8")`, ta **luôn phải truyền rõ `encoding="utf-8"`**?',
    frontHint: 'Sự khác biệt bảng mã mặc định giữa Windows (`cp1252` / `cp1258`) và macOS/Linux (`utf-8`).',
    backAnswer:
      'Nếu không chỉ định `encoding="utf-8"`, Python (trước 3.15) sẽ lấy bảng mã mặc định của hệ điều hành đang chạy. Trên macOS/Linux mặc định là `utf-8`, nhưng trên **Windows** mặc định lại là `cp1252` hoặc `cp1258`, khiến code đọc file tiếng Việt hoặc emoji chạy tốt trên máy Mac nhưng nổ lỗi **`UnicodeDecodeError`** ngay khi đồng nghiệp chạy trên Windows!',
    backAnalogy:
      'Ghi rõ nhãn "Đọc bằng bảng mã UTF-8" trên bìa hồ sơ để dù gửi sang chi nhánh Windows hay macOS đều đọc chuẩn 100% tiếng Việt.',
    codeSnippet: `from pathlib import Path

# Luôn truyền rõ encoding="utf-8" để chạy đúng trên mọi Hệ điều hành:
content = Path("notes.txt").read_text(encoding="utf-8")`,
    relatedTermIds: ['builtin-open', 'stdlib-pathlib'],
  },
  {
    id: 'fc-149',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Từ điển (Dict) Cơ bản',
    frontQuestion: 'Sự khác biệt khi truy cập phần tử trong `dict` bằng `d["key"]` so với `d.get("key", default)` và `d.setdefault("key", default)` là gì?',
    frontHint: 'Tránh lỗi `KeyError` khi khóa không tồn tại trong từ điển.',
    backAnswer:
      '- **`d["key"]`**: Trả về giá trị nếu có, nhưng sẽ **ném lỗi `KeyError` làm dừng chương trình** nếu `"key"` không tồn tại.\n- **`d.get("key", default=None)`**: An toàn tuyệt đối — nếu không thấy `"key"` thì trả về `default` mà **không sửa đổi `d`**.\n- **`d.setdefault("key", [])`**: Nếu chưa có `"key"`, nó sẽ **gán luôn `d["key"] = []`** vào từ điển rồi trả về danh sách đó.',
    backAnalogy:
      '`d["key"]` là đòi lấy đúng món hàng (không có là báo động); `d.get()` là hỏi nhẹ nhàng "Có thì đưa, không có thì lấy món thay thế"; `d.setdefault()` là "Chưa có ngăn này thì đóng luôn ngăn mới vào tủ".',
    codeSnippet: `config = {"host": "localhost"}
port = config.get("port", 8000)      # 8000 (không ném KeyError!)
tags = config.setdefault("tags", [])
tags.append("production")
print(config)  # {'host': 'localhost', 'tags': ['production']}`,
    relatedTermIds: ['type-dict'],
  },
  {
    id: 'fc-150',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Từ điển (Dict) & Gộp dữ liệu',
    frontQuestion: 'Trong Python 3.9+, toán tử `|` và `|=` trên `dict` (`merged = defaults | custom_config`) hoạt động như thế nào khi có các key trùng nhau?',
    frontHint: 'Tương đương với Object Spread `{ ...defaults, ...customConfig }` trong JavaScript.',
    backAnswer:
      'Toán tử hợp **`d1 | d2`** (PEP 584) tạo ra một `dict` mới chứa toàn bộ các cặp `key: value` từ cả hai từ điển. Nếu một `key` xuất hiện ở cả `d1` và `d2`, **giá trị của từ điển bên phải (`d2`) sẽ ghi đè lên bên trái (`d1`)**. Toán tử **`d1 |= d2`** cập nhật trực tiếp tại chỗ vào `d1` (tương đương `d1.update(d2)`).',
    backAnalogy:
      'Đặt tờ giấy kính cấu hình mới (`custom_config`) đè lên bản cấu hình mặc định (`defaults`): chỗ nào có viết mới thì che chữ cũ, chỗ nào để trống thì vẫn nhìn thấy cấu hình mặc định.',
    codeSnippet: `defaults = {"timeout": 30, "retries": 3, "debug": False}
overrides = {"debug": True, "timeout": 10}
final_cfg = defaults | overrides
print(final_cfg)  # {'timeout': 10, 'retries': 3, 'debug': True}`,
    relatedTermIds: ['type-dict'],
  },
  {
    id: 'fc-151',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hàm Tích hợp & Khám phá Code',
    frontQuestion: 'Khi đang học hoặc làm việc với một đối tượng lạ trong Python, bộ 3 hàm tích hợp `type(obj)`, `dir(obj)` và `help(obj)` giúp bạn tra cứu những gì ngay lập tức?',
    frontHint: 'Bộ công cụ "Tự soi" (Introspection) tích hợp sẵn trong mọi phiên bản Python.',
    backAnswer:
      '- **`type(obj)`**: Cho biết đối tượng thuộc Class/Kiểu dữ liệu nào.\n- **`dir(obj)`**: Liệt kê toàn bộ danh sách các thuộc tính (attributes) và phương thức (methods) mà đối tượng đó hỗ trợ.\n- **`help(obj)`**: Hiển thị tài liệu hướng dẫn chi tiết (Docstring, chữ ký hàm, tham số) ngay trong Terminal mà không cần tra Google!',
    backAnalogy:
      'Máy quét đa năng cầm tay: `type()` đọc nhãn chủng loại, `dir()` liệt kê các nút bấm trên thiết bị, còn `help()` mở cuốn sổ hướng dẫn sử dụng đi kèm.',
    codeSnippet: ` sample = "hello"
print(type(sample))  # <class 'str'>
# Lọc nhanh các phương thức public của str:
methods = [m for m in dir(sample) if not m.startswith("_")]
print(methods[:5])   # ['capitalize', 'casefold', 'center', 'count', 'encode']`,
    relatedTermIds: ['builtin-type', 'builtin-dir', 'builtin-help'],
  },
  {
    id: 'fc-152',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cạm bẫy Tuple Một Phần tử',
    frontQuestion: 'Cạm bẫy cú pháp: Tại sao `t = (42)` lại tạo ra một số nguyên `int` chứ không phải `tuple`? Làm thế nào để khai báo `tuple` chỉ có 1 phần tử?',
    frontHint: 'Dấu phẩy `,` mới là thứ tạo nên `tuple` (`(42,)`), không phải cặp ngoặc tròn!',
    backAnswer:
      'Trong Python, cặp ngoặc tròn trong `(42)` được hiểu là ngoặc nhóm biểu thức toán học giống như `(2 + 3) * 4`, nên `type((42))` là `int`! Chính **dấu phẩy `,`** mới là toán tử tạo nên `tuple`. Do đó, một tuple có 1 phần tử bắt buộc phải có dấu phẩy ở cuối: **`t = (42,)`** (hoặc `t = 42,`).',
    backAnalogy:
      'Chiếc hộp đơn nếu không dán tem niêm phong dấu phẩy `,` ở đuôi thì Python chỉ coi là giấy gói tạm thời rồi bóc bỏ luôn.',
    codeSnippet: `not_a_tuple = (42)
single_tuple = (42,)
print(type(not_a_tuple))   # <class 'int'>
print(type(single_tuple))  # <class 'tuple'>`,
    relatedTermIds: ['type-tuple'],
  },
  {
    id: 'fc-153',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cạm bẫy Nhân bản List 2 Chiều',
    frontQuestion: 'Tại sao khởi tạo bảng 2 chiều bằng `board = [[0] * 3] * 3` lại gây lỗi nghiêm trọng khi gán `board[0][0] = 1` (cả 3 hàng đều bị đổi thành `[1, 0, 0]`)?',
    frontHint: 'Toán tử `* 3` trên list ngoài chỉ nhân bản 3 tham chiếu trỏ tới CÙNG MỘT list con duy nhất!',
    backAnswer:
      'Khi viết `[[0] * 3] * 3`, Python tạo một list con `[0, 0, 0]` duy nhất trong RAM rồi sao chép **3 nhãn tham chiếu cùng trỏ vào đúng list con đó**. Vì vậy sửa hàng 0 thực chất là sửa luôn cả hàng 1 và hàng 2! Cách chuẩn là dùng List Comprehension **`[[0] * 3 for _ in range(3)]`** để mỗi vòng lặp tạo mới một list con độc lập.',
    backAnalogy:
      '`[[0]*3]*3` là treo 3 tấm gương cùng chiếu vào 1 căn phòng duy nhất; còn `[[0]*3 for _ in range(3)]` là xây 3 căn phòng riêng biệt.',
    codeSnippet: `# ❌ SAI: Cả 3 hàng cùng trỏ vào 1 list duy nhất!
bad_grid = [[0] * 3] * 3
bad_grid[0][0] = 9
print(bad_grid)   # [[9, 0, 0], [9, 0, 0], [9, 0, 0]]

# ✅ ĐÚNG: Mỗi hàng là một list độc lập
good_grid = [[0] * 3 for _ in range(3)]
good_grid[0][0] = 9
print(good_grid)  # [[9, 0, 0], [0, 0, 0], [0, 0, 0]]`,
    relatedTermIds: ['type-list'],
  },
  {
    id: 'fc-154',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cạm bẫy Vòng lặp & Xóa phần tử',
    frontQuestion: 'Tại sao tuyệt đối không được xóa phần tử trực tiếp khỏi `list` khi đang duyệt chính `list` đó (`for x in items: items.remove(x)`)?',
    frontHint: 'Khi xóa phần tử ở vị trí `i`, toàn bộ phần tử phía sau bị dồn lên vị trí `i`, khiến bộ đếm vòng lặp nhảy cóc bỏ sót phần tử kế tiếp!',
    backAnswer:
      'Bộ lặp (Iterator) của `list` duyệt theo chỉ số `0, 1, 2...`. Khi bạn xóa phần tử tại chỉ số `0`, phần tử thứ `1` lập tức trượt lùi về chỉ số `0`, nhưng bước lặp tiếp theo lại tiến sang chỉ số `1` — dẫn đến **phần tử vừa trượt về bị bỏ qua hoàn toàn**! Giải pháp chuẩn: tạo danh sách mới bằng **List Comprehension** (`items = [x for x in items if keep(x)]`) hoặc duyệt trên bản sao `for x in items[:]:`.',
    backAnalogy:
      'Đang điểm danh từng ghế số 1, 2, 3 mà bảo người ghế 1 đứng dậy rồi cả hàng dồn lên 1 ghế thì người ngồi ghế 2 (nay dồn về ghế 1) sẽ bị bỏ sót khi đọc tiếp ghế số 2!',
    codeSnippet: `nums = [1, 2, 2, 3]
# ✅ CHUẨN PYTHONIC: Lọc bằng List Comprehension (An toàn & Nhanh O(N))
nums = [n for n in nums if n != 2]
print(nums)  # [1, 3]`,
    relatedTermIds: ['type-list', 'kw-for'],
  },
  {
    id: 'fc-155',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Tập hợp (Set) Cơ bản',
    frontQuestion: 'Cạm bẫy cú pháp: Tại sao viết `s = {}` lại tạo ra một `dict` rỗng chứ không phải `set` rỗng? Và tại sao tìm kiếm `x in my_set` lại nhanh gấp hàng nghìn lần `x in my_list`?',
    frontHint: 'Dùng `set()` cho tập hợp rỗng; `set` dùng Bảng băm (Hash Table) nên tra cứu tốn $O(1)$ thay vì quét tuần tự $O(N)$.',
    backAnswer:
      '1. Vì `dict` có mặt trong Python trước `set`, ký hiệu `{}` được dành riêng cho **từ điển rỗng (`dict`)**. Muốn tạo tập hợp rỗng, bạn **bắt buộc phải viết `s = set()`** (còn tập hợp có phần tử thì viết `{1, 2, 3}`).\n2. `list` phải kiểm tra từng phần tử từ đầu đến cuối ($O(N)$), trong khi `set` băm giá trị `hash(x)` để nhảy thẳng đến ô nhớ chỉ trong **1 bước $O(1)$**!',
    backAnalogy:
      '`x in my_list` là đi hỏi từng phòng từ tầng 1 lên tầng 100; `x in my_set` là tra bảng số phòng ở quầy lễ tân rồi bấm thang máy lên thẳng phòng đó.',
    codeSnippet: `empty_dict = {}
empty_set = set()
allowed_roles = {"admin", "editor", "viewer"}  # Tra cứu O(1) cực nhanh
print("admin" in allowed_roles)                 # True`,
    relatedTermIds: ['type-set', 'type-dict'],
  },
  {
    id: 'fc-156',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Toán tử Ba ngôi (Conditional Expression)',
    frontQuestion: 'Trong Python không có toán tử `condition ? a : b` như JS/TS. Cú pháp biểu thức điều kiện 1 dòng tương đương trong Python được viết như thế nào?',
    frontHint: '`value_if_true if condition else value_if_false`.',
    backAnswer:
      'Python thiết kế biểu thức điều kiện theo thứ tự đọc tự nhiên như tiếng Anh: **` kết_quả_đúng if điều_kiện else kết_quả_sai `**. Nó ưu tiên đặt giá trị trả về thông thường lên đầu câu, sau đó mới nêu điều kiện và trường hợp ngoại lệ.',
    backAnalogy:
      'Đọc xuôi tự nhiên: "Mặc áo phông (`value_if_true`) nếu trời nắng (`if sunny`), ngược lại mặc áo mưa (`else value_if_false`)".',
    codeSnippet: `age = 20
status = "Người lớn" if age >= 18 else "Vị thành niên"
print(status)  # "Người lớn"`,
    relatedTermIds: ['kw-if', 'kw-else'],
  },
  {
    id: 'fc-157',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hệ thống Module & Import',
    frontQuestion: 'Sự khác nhau giữa 3 cách import: `import math`, `from math import sqrt`, và tại sao `from module import *` lại bị cấm trong chuẩn PEP 8?',
    frontHint: 'Ô nhiễm không gian tên (Namespace pollution) và làm mất khả năng truy vết hàm đến từ đâu.',
    backAnswer:
      '- **`import math`**: Giữ nguyên không gian tên rõ ràng (`math.sqrt(16)`).\n- **`from math import sqrt`**: Đưa trực tiếp tên `sqrt` vào module hiện tại.\n- **`from module import *` (Wildcard import)**: Đổ toàn bộ hàng chục tên biến/hàm của module khác vào file hiện tại, dễ **ghi đè âm thầm (Shadowing)** các hàm trùng tên và khiến cả người đọc lẫn công cụ Linter không biết hàm đó sinh ra từ đâu.',
    backAnalogy:
      '`import math` là để nguyên hộp dụng cụ có dán nhãn `math`; còn `from module import *` là đổ tung mọi ốc vít của 5 hộp khác nhau ra sàn nhà.',
    codeSnippet: `from math import sqrt, pi
print(round(sqrt(16) * pi, 2))  # 12.57`,
    relatedTermIds: ['kw-import', 'kw-from', 'concept-pep8'],
  },
  {
    id: 'fc-158',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hàm Tích hợp & Lập trình Hàm',
    frontQuestion: 'Tại sao trong Python hiện đại, cộng đồng lại ưu tiên dùng **List Comprehension / Generator Expression** thay cho cặp hàm `map()` và `filter()` kết hợp `lambda`?',
    frontHint: 'So sánh độ dễ đọc giữa `[x * 2 for x in nums if x > 0]` và `list(map(lambda x: x * 2, filter(lambda x: x > 0, nums)))`.',
    backAnswer:
      'Trong JS, `.filter().map()` nối chuỗi rất đẹp vì là phương thức trên Array. Nhưng trong Python, `map()` và `filter()` là các hàm bọc bên ngoài, khi kết hợp với `lambda` sẽ tạo ra nhiều tầng ngoặc lồng nhau rất khó đọc. **List Comprehension** (`[x * 2 for x in nums if x > 0]`) vừa gộp cả `map` và `filter` trong 1 biểu thức cực kỳ rõ ràng, vừa chạy nhanh hơn do không tốn chi phí gọi hàm `lambda` ở mỗi phần tử.',
    backAnalogy:
      'List Comprehension giống như một dây chuyền sản xuất thẳng tắp: "Lấy `x` từ `nums`, lọc `x > 0`, rồi nhân đôi `x * 2`" thay vì bọc nhiều lớp hộp lồng nhau.',
    codeSnippet: `nums = [-2, 0, 3, 5]
# Gọn, rõ ràng và nhanh hơn map() + filter() + lambda:
doubled_positives = [x * 2 for x in nums if x > 0]
print(doubled_positives)  # [6, 10]`,
    relatedTermIds: ['type-list', 'kw-lambda'],
  },
  {
    id: 'fc-159',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuyển đổi Kiểu (Type Conversion)',
    frontQuestion: 'Cạm bẫy ép kiểu: Tại sao `bool("False")` và `bool("0")` trong Python đều trả về **`True`**? Làm thế nào để chuyển chuỗi `"true"` / `"false"` từ biến môi trường sang `bool` đúng cách?',
    frontHint: 'Mọi chuỗi `str` khác rỗng (`len > 0`) đều là Truthy!',
    backAnswer:
      'Hàm `bool(s)` trên chuỗi chỉ kiểm tra xem **chuỗi đó có rỗng (`""`) hay không**, chứ hoàn toàn không đọc nội dung chữ bên trong! Vì `"False"` có 5 ký tự (khác rỗng) nên `bool("False")` là **`True`** (rất nhiều bug Production đọc biến môi trường `DEBUG="False"` bị bật Debug vì lỗi này!). Cách chuẩn là so sánh `val.strip().lower() in {"true", "1", "yes"}` hoặc dùng `pydantic-settings`.',
    backAnalogy:
      '`bool()` chỉ nhìn xem phong bì có tờ giấy bên trong không, dù trên giấy viết chữ "KHÔNG" thì phong bì vẫn được tính là "Có thư" (`True`)!',
    codeSnippet: `raw_env = "False"
print(bool(raw_env))  # True <-- BẪY KINH ĐIỂN!

# ✅ Cách parse chuẩn:
is_enabled = raw_env.strip().lower() in {"true", "1", "yes", "on"}
print(is_enabled)     # False`,
    relatedTermIds: ['type-bool', 'builtin-bool'],
  },
  {
    id: 'fc-160',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cạm bẫy Biến Toàn cục & Shadowing',
    frontQuestion: 'Tại sao tuyệt đối không nên đặt tên biến là `list`, `dict`, `str`, `id`, `type`, `sum`, `max`, `min` (ví dụ `list = [1, 2, 3]`)?',
    frontHint: 'Hiện tượng che khuất tên tích hợp (Built-in Shadowing) trong quy tắc LEGB.',
    backAnswer:
      'Trong Python, các hàm và kiểu tích hợp như `list`, `dict`, `str`, `sum`, `id` nằm ở tầng ngoài cùng (**Built-in scope** trong quy tắc LEGB). Nếu bạn gán `list = [1, 2, 3]`, tên biến cục bộ `list` sẽ **đè lên (Shadow)** kiểu `list` gốc. Ngay dòng sau đó nếu bạn gọi `list("abc")`, Python sẽ nổ lỗi **`TypeError: "list" object is not callable`**! Nếu cần tên tương tự, hãy dùng `items`, `records`, hoặc thêm gạch dưới `list_` theo chuẩn PEP 8.',
    backAnalogy:
      'Đặt tên con chó trong nhà trùng tên với số điện thoại cấp cứu 115: đến lúc gọi 115 thì chỉ có con chó chạy ra chứ không gọi được xe cấp cứu nữa.',
    codeSnippet: `# ❌ SAI: Ghi đè hàm sum() và kiểu list() tích hợp của Python
# sum = 100
# list = [1, 2]

# ✅ ĐÚNG: Dùng tên mô tả rõ nghĩa
total_amount = 100
user_ids = [1, 2]`,
    relatedTermIds: ['concept-pep8', 'builtin-sum', 'type-list'],
  },
];

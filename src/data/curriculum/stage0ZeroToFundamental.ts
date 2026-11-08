import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_0_ZERO_FUNDAMENTAL_LESSONS: LessonTopic[] = [
  {
    id: 's0-install-setup-uv-pyenv-ide',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 0,
    title: '1.0A. Phương pháp 1 — Quản lý Dự án Toàn diện bằng uv: Version, Source Code, Dependency, Lockfile & Chạy Dự án',
    shortDescription:
      'Làm chủ trọn vẹn vòng đời dự án Python hiện đại bằng công cụ uv: Cài đặt Python, tổ chức cấu trúc source code (--app / --package / workspace), quản lý .venv, dependency groups, uv.lock, inline script và cấu hình VS Code / Cursor.',
    estimatedMinutes: 45,
    theoryParagraphs: [
      '**Giải nghĩa từ gốc cho người mới đi từ Zero (Chuyển từ JS/TS/Node.js sang Python)**: Khi mở một dự án Python chuẩn hiện đại, bạn sẽ gặp 5 thành phần cốt lõi sau đây: (1) **`pyproject.toml`**: Chính là file **`package.json`** của Python! File này khai báo tên dự án, phiên bản Python yêu cầu (`requires-python = ">=3.12"`), danh sách thư viện chính (`dependencies`) và thư viện dev (`[dependency-groups]`). (2) **Thư mục `.venv/` (Virtual Environment)**: Chính là thư mục **`node_modules/`** cộng thêm bản sao con trỏ tới trình thông dịch Python của riêng dự án đó. Vì lệnh `pip` cổ điển của Python mặc định cài thư viện vào ổ cứng chung của hệ điều hành gây xung đột giữa các dự án, Python bắt buộc mỗi dự án phải tạo một thư mục `.venv/` riêng để cô lập thư viện (và luôn đưa `.venv/` vào `.gitignore`). (3) **File khóa `uv.lock` (hoặc `poetry.lock` / `requirements.txt`)**: Chính là **`package-lock.json` / `pnpm-lock.yaml`**, giúp khóa cứng phiên bản của mọi thư viện con. (4) **File `.python-version`**: Chính là file **`.nvmrc`**, chỉ ghi số phiên bản (ví dụ `3.12`) để công cụ tự động chọn đúng bản Python khi bạn `cd` vào dự án. (5) **File `__init__.py`**: Đặt bên trong các thư mục code để báo cho Python biết thư mục đó là một **Package** có thể `import` được (tương tự `index.ts` đại diện cho thư mục).',
      '**Đầu vào (Entrypoint) của 1 dự án Python là cái gì? Để chạy được thì cần những gì và chạy file nào?** Khác với Node.js xem mục `"scripts": { "start": "node index.js" }` trong `package.json`, trong Python để biết chạy file nào bạn nhìn vào cấu trúc dự án theo **3 kiểu Entrypoint chuẩn**: **(Kiểu 1 — Dự án nhỏ / Script đơn)**: Điểm bắt đầu nằm ở file **`main.py`** (hoặc `app.py`, `hello.py`) ngay thư mục gốc, bên dưới cùng của file luôn có dòng `if __name__ == "__main__": main()` (dòng này kiểm tra: *"Nếu người dùng bấm chạy trực tiếp file này thì hãy gọi hàm `main()`"*); bạn chạy bằng lệnh `uv run main.py`. **(Kiểu 2 — Dự án nhiều file chuẩn `src/` layout)**: Code nằm trong `src/<tên_package>/main.py`; bạn đứng ở thư mục gốc và chạy bằng **cờ `-m` (Module mode)**: `uv run python -m <tên_package>.main` để Python nạp đúng toàn bộ đường dẫn `import`. **(Kiểu 3 — Dự án Web API FastAPI / Django hoặc CLI Script)**: Chạy qua ASGI server `uv run uvicorn app.main:app --reload`, hoặc chạy tên lệnh khai báo trong mục `[project.scripts]` của `pyproject.toml`!',
      '**Tại sao nên dùng `uv` cho Phương pháp 1 (Và khi nào dùng Phương pháp 2 ở Bài 1.0B)?**: Thay vì phải cài rời rạc 4–5 công cụ (`pyenv` để cài Python + `venv` để tạo `.venv` + `pip` để cài gói + `poetry` để khóa file lock), công cụ **`uv`** (viết bằng Rust) gộp tất cả vào 1 lệnh duy nhất: tự tải Python, tự tạo `.venv/`, tự ghi `pyproject.toml` + `uv.lock`, và tự chạy code qua `uv run` mà không cần nhớ lệnh `activate` thủ công. Nếu bạn làm việc ở công ty dùng bộ công cụ truyền thống (`pyenv` + `venv` + `pip` / `Poetry` / `Pipenv`), hãy xem tiếp **Bài 1.0B** ngay kế tiếp!',
      '**Cấu hình IDE (VS Code / Cursor / PyCharm) trong 3 phút**: Sau khi có thư mục `.venv/`, bước quan trọng nhất là **trỏ IDE vào đúng file Python bên trong `.venv`** (`Cmd/Ctrl + Shift + P` → `Python: Select Interpreter` → chọn `./.venv/bin/python` trên macOS/Linux hoặc `.venv\\Scripts\\python.exe` trên Windows). Kết hợp với bộ 4 Extension: **`Python` + `Pylance` (Microsoft)** để gợi ý code/kiểm tra kiểu, **`Ruff` (Astral)** để tự động format code chuẩn PEP 8 khi bấm `Cmd+S / Ctrl+S`, và **`Even Better TOML`** để đọc `pyproject.toml`!',
    ],
    analogy: {
      title: 'Bản đồ Đối chiếu Công cụ Python cho Lập trình viên Mới (Từ máy trắng tinh đến khi chạy dự án)',
      realWorldScenario:
        'Nếu bạn đã từng dùng Node.js (JS/TS), Java hoặc Go, hãy đối chiếu 1-1 bảng công cụ dưới đây để hiểu ngay vai trò của từng công cụ trong hệ sinh thái Python chỉ sau 30 giây:',
      mappingPoints: [
        {
          realWorld: 'nvm / fnm (Cài & chuyển đổi Node 18, 20, 22 theo file .nvmrc)',
          pythonEquivalent: '`uv python` hoặc `pyenv` (Theo file `.python-version`)',
          explanation: 'Giúp máy tính của bạn cài song song Python 3.10, 3.11, 3.12, 3.13 và tự động đổi phiên bản khi chuyển thư mục dự án.',
        },
        {
          realWorld: 'Thư mục `node_modules/` nằm riêng trong từng dự án',
          pythonEquivalent: 'Thư mục môi trường ảo `.venv/` nằm riêng trong từng dự án',
          explanation: 'Cô lập hoàn toàn các thư viện cài thêm (`fastapi`, `pydantic`, `pandas`) của dự án A khỏi dự án B. Luôn đưa `.venv/` vào `.gitignore`!',
        },
        {
          realWorld: 'pnpm / npm / yarn + `package.json` + `pnpm-lock.yaml`',
          pythonEquivalent: '`uv` + `pyproject.toml` + `uv.lock` (Hoặc truyền thống: `pip` + `requirements.txt`)',
          explanation: '`uv add fastapi` tự động tạo `.venv`, tải thư viện và ghi vào `pyproject.toml` + khóa phiên bản trong `uv.lock`.',
        },
        {
          realWorld: 'ESLint + Prettier (Kiểm tra lỗi & Format code khi bấm Save)',
          pythonEquivalent: '`Ruff` (`ruff check` & `ruff format`) + `Pyright / Pylance`',
          explanation: 'Ruff viết bằng Rust nhanh gấp 100 lần công cụ cũ (Black/Flake8/isort), format toàn bộ dự án chỉ trong vài mili-giây.',
        },
      ],
      mentalModelTip:
        'Quy tắc nhớ nhanh: Trên máy mới tinh, chỉ cần cài đúng 1 công cụ là **`uv`** (`brew install uv` hoặc `curl`/`irm`), sau đó gõ `uv init my-app && cd my-app && uv run main.py` — `uv` sẽ tự tải Python 3.12, tự tạo `.venv` và chạy code cho bạn!',
    },
    diagrams: [
      {
        id: 'diag-s0-setup-roadmap',
        title: 'Quy trình 4 Bước Chuẩn bị Máy tính & Chạy Dự án Python Đầu tiên',
        subtitle: 'Làm đúng theo 4 bước tuần tự này trên macOS, Windows hoặc Linux để có môi trường chuẩn Production',
        type: 'pipeline',
        nodes: [
          {
            id: 'setup-step-1',
            badge: 'Bước 1 • Trình Quản lý',
            title: 'Cài đặt uv (hoặc pyenv)',
            subtitle: 'macOS (Homebrew/curl) • Windows (PowerShell) • Linux',
            detail:
              'Cài đặt `uv` (khuyên dùng số 1 vì tích hợp tất cả) hoặc `pyenv` vào máy. Mở lại Terminal và kiểm tra bằng lệnh `uv --version` hoặc `pyenv --version`.',
            highlightColor: 'emerald',
          },
          {
            id: 'setup-step-2',
            badge: 'Bước 2 • Cài Python 3.12+',
            title: 'Tải & Ghim Phiên bản Python',
            subtitle: '$ uv python install 3.12 && uv python pin 3.12',
            detail:
              'Tải bản Python 3.12 chuẩn về máy (hoặc dùng `pyenv install 3.12.7 && pyenv global 3.12.7`). Không bao giờ dùng hay sửa đổi System Python của hệ điều hành.',
            highlightColor: 'sky',
          },
          {
            id: 'setup-step-3',
            badge: 'Bước 3 • Tạo Dự án & .venv',
            title: 'Khởi tạo Project & Môi trường Ảo',
            subtitle: '$ uv init my_app && uv venv (hoặc python -m venv .venv)',
            detail:
              'Tạo thư mục dự án có cấu trúc chuẩn (`pyproject.toml`, `.python-version`, `.venv/`). Cài thư viện bằng `uv add <tên_gói>` hoặc kích hoạt `.venv` rồi `pip install`.',
            highlightColor: 'amber',
          },
          {
            id: 'setup-step-4',
            badge: 'Bước 4 • Cấu hình VS Code / Cursor',
            title: 'Cài Extension & Chọn Interpreter',
            subtitle: 'Python + Pylance + Ruff → Select Interpreter (.venv)',
            detail:
              'Cài 3 extension `Python`, `Pylance`, `Ruff`. Bấm `Cmd/Ctrl + Shift + P` -> `Python: Select Interpreter` -> Chọn `./.venv/bin/python` để IDE nhận diện toàn bộ thư viện!',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Nếu VS Code / Cursor báo gạch chân vàng ở dòng `import fastapi`, 99% là do bạn chưa chọn Interpreter trỏ vào `.venv` ở Bước 4!',
      },
      {
        id: 'diag-s0-uv-vs-pyenv-venv',
        title: 'So sánh Trực tiếp 2 Cách Quản lý Môi trường: Hiện đại (uv) vs. Truyền thống (pyenv + venv + pip)',
        subtitle: 'Nắm vững cả 2 cách để vừa làm dự án mới siêu tốc vừa tự tin làm việc với các repo cũ của công ty',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'way-modern-uv',
            badge: 'Cách 1 • Khuyên dùng số 1 (Chuẩn Mới)',
            title: 'Hệ sinh thái All-in-One với `uv`',
            subtitle: 'Thay thế pyenv + venv + pip + poetry trong 1 công cụ',
            detail:
              '• Cài Python: `uv python install 3.12`\n• Tạo project: `uv init app`\n• Tạo .venv & cài gói: `uv add fastapi`\n• Chạy code ngay (không cần activate): `uv run python main.py`\n• Khóa phiên bản: Tự động sinh `pyproject.toml` & `uv.lock`.',
            highlightColor: 'emerald',
          },
          {
            id: 'way-classic-pyenv',
            badge: 'Cách 2 • Truyền thống (Mọi repo cũ đều dùng)',
            title: 'Bộ ba `pyenv` + `venv` + `pip`',
            subtitle: 'Tách rời trình quản lý phiên bản và trình quản lý gói',
            detail:
              '• Cài Python: `pyenv install 3.12.7 && pyenv local 3.12.7`\n• Tạo .venv: `python -m venv .venv`\n• Bắt buộc kích hoạt: `source .venv/bin/activate` (Win: `.venv\\Scripts\\activate`)\n• Cài gói: `pip install -r requirements.txt`\n• Xuất danh sách gói: `pip freeze > requirements.txt`.',
            highlightColor: 'sky',
          },
          {
            id: 'way-conda-docker',
            badge: 'Cách 3 • Đặc thù Data Science / Production',
            title: 'Miniconda (AI/GPU) & Docker Container',
            subtitle: 'Khi cần thư viện C/CUDA hoặc đóng gói lên Server',
            detail:
              '• `conda` / `mamba`: Chỉ dùng khi làm AI/Deep Learning cũ cần cài kèm thư viện C++/CUDA hệ thống.\n• `Docker`: Khi đưa lên Production, dùng image `python:3.12-slim` kết hợp `uv sync --frozen` để đóng gói.',
            highlightColor: 'amber',
          },
        ],
        caption:
          'Người mới bắt đầu: Hãy cài và dùng **Cách 1 (`uv`)** ngay hôm nay, đồng thời đọc hiểu **Cách 2 (`pyenv` + `venv` + `pip`)** để đọc tài liệu trên mạng không bị bỡ ngỡ.',
      },
      {
        id: 'diag-s0-global-vs-local-hierarchy',
        title: 'Phân tầng Global (Toàn máy) vs. Local (Từng Dự án) với `uv` và `pyenv`',
        subtitle: 'Hiểu rõ cái gì đặt Global toàn máy, cái gì bắt buộc đặt riêng ở từng thư mục dự án',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'scope-global-py',
            badge: 'Tầng 1 • Global Python',
            title: 'Phiên bản Python Mặc định Toàn máy',
            subtitle: 'uv python pin --global 3.12 | pyenv global 3.12.7',
            detail:
              'Áp dụng khi bạn mở Terminal ở ngoài thư mục dự án (như `~/Desktop`). Chỉ dùng để chạy script lẻ hoặc lệnh kiểm tra nhanh. Lưu tại `~/.config/uv/.python-version` hoặc `~/.pyenv/version`.',
            highlightColor: 'sky',
          },
          {
            id: 'scope-local-project',
            badge: 'Tầng 2 • Per-Project (Ưu tiên cao hơn)',
            title: 'Phiên bản Python & .venv Riêng Từng Dự án',
            subtitle: 'uv python pin 3.10 | pyenv local 3.10.15 + .venv/',
            detail:
              'Mỗi dự án có file `.python-version` và thư mục `.venv/` riêng. Khi bạn `cd` vào dự án A, máy tự động chuyển sang Python 3.10; khi `cd` sang dự án B, máy tự động chuyển sang Python 3.12! Toàn bộ thư viện (`fastapi`, `pandas`) cài vào `.venv/` ở tầng này.',
            highlightColor: 'emerald',
          },
          {
            id: 'scope-global-tools',
            badge: 'Tầng 3 • Global CLI Tools',
            title: 'Công cụ CLI Dùng Chung Toàn máy (uv tool / pipx)',
            subtitle: 'uv tool install ruff | uvx <tool> | pipx install',
            detail:
              'Với các công cụ dòng lệnh độc lập (`ruff`, `httpie`, `yt-dlp`, `poetry`), KHÔNG dùng `pip install` toàn cục mà dùng `uv tool install <tên>` (hoặc `uvx`). Mỗi tool được tự động bọc trong một `.venv` ẩn riêng biệt tại `~/.local/share/uv/tools/`.',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Thứ tự ưu tiên khi bạn gõ lệnh: Cờ `--python` tạm thời > Môi trường `.venv` đang mở > File `.python-version` của dự án (Local) > Cấu hình Global toàn máy.',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-0-uv-complete-guide',
        title: 'Cách 1 (Khuyên dùng): Cài đặt & Sử dụng `uv` từ A–Z trên macOS, Windows và Linux',
        description: 'Copy từng dòng lệnh dưới đây chạy trên Terminal (macOS/Linux) hoặc PowerShell (Windows) để cài đặt uv, tải Python 3.12, tạo dự án và chạy code.',
        code: `# ============================================================================
# BƯỚC 1: CÀI ĐẶT 'uv' LÊN MÁY TÍNH (CHỈ CẦN LÀM 1 LẦN DUY NHẤT)
# ============================================================================
# 👉 Trên macOS hoặc Linux (Mở ứng dụng Terminal và dán lệnh sau):
# $ curl -LsSf https://astral.sh/uv/install.sh | sh
# (Hoặc nếu macOS đã có Homebrew):
# $ brew install uv

# 👉 Trên Windows (Mở PowerShell và dán lệnh sau):
# PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# (Hoặc dùng WinGet trên Windows 10/11):
# PS> winget install --id=Astral-sh.uv -e

# Kiểm tra sau khi cài xong (tắt mở lại Terminal nếu cần):
# $ uv --version
# -> uv 0.6.x

# ============================================================================
# BƯỚC 2: DÙNG 'uv' CÀI ĐẶT PYTHON (KHÔNG CẦN TẢI FILE CÀI TỪ PYTHON.ORG!)
# ============================================================================
# Cài đặt Python 3.12 (bản chuẩn ổn định nhất hiện nay) và Python 3.13:
# $ uv python install 3.12 3.13

# Xem danh sách các bản Python đã có trong máy:
# $ uv python list

# ============================================================================
# BƯỚC 3: KHỞI TẠO DỰ ÁN MỚI, TẠO .venv & CÀI THƯ VIỆN
# ============================================================================
# 1. Tạo thư mục dự án chuẩn 'my-first-app' và di chuyển vào trong:
# $ uv init my-first-app
# $ cd my-first-app

# 2. Ghim phiên bản Python 3.12 cho dự án này (tạo file .python-version):
# $ uv python pin 3.12

# 3. Thêm thư viện (uv tự động tạo thư mục .venv/ và file uv.lock!):
# $ uv add requests rich
# $ uv add --dev pytest ruff

# 4. Chạy chương trình Python trong môi trường ảo của dự án:
# $ uv run python main.py
# $ uv run pytest

# Khi tải (git clone) dự án của người khác về máy, chỉ cần gõ đúng 1 lệnh:
# $ uv sync`,
        output: `Initialized project \`my-first-app\`\nPinned \`.python-version\` to \`3.12\`\nResolved 12 packages in 18ms\nHello from my-first-app!`,
        annotations: [
          { line: 5, explanation: 'Lệnh cài `uv` chính thức cho macOS/Linux — cài trực tiếp vào `~/.local/bin` mà không cần quyền `sudo`.' },
          { line: 10, explanation: 'Lệnh cài `uv` chính thức cho Windows PowerShell — tự động thêm `uv` vào biến môi trường `PATH` của User.' },
          { line: 21, explanation: '`uv python install 3.12` tự động tải bản Python 3.12 chính thức về máy chỉ trong vài giây.' },
          { line: 30, explanation: '`uv init` tạo sẵn bộ khung dự án gồm `pyproject.toml`, `README.md`, `.gitignore`, `.python-version` và `main.py`.' },
          { line: 37, explanation: '`uv add` tương đương `npm install <pkg>`: tự tạo `.venv/`, tải gói vào `.venv` và ghi phụ thuộc vào `pyproject.toml`.' },
          { line: 41, explanation: '`uv run` tự động kích hoạt `.venv` ngầm và chạy lệnh bên trong đó — bạn không bao giờ sợ quên `activate`!' },
        ],
      },
      {
        id: 'ex-s0-0-pyenv-venv-complete-guide',
        title: 'Cách 2 (Truyền thống): Cài đặt `pyenv` + Cấu hình Shell (`~/.zshrc` / `~/.bashrc`) + `venv` & `pip`',
        description: 'Hướng dẫn đầy đủ cách cài pyenv (kèm cấu hình PATH để không bị lỗi không nhận lệnh), tạo môi trường ảo .venv bằng tay và dùng pip.',
        code: `# ============================================================================
# PHẦN 1: CÀI ĐẶT & CẤU HÌNH 'pyenv' (TRÌNH QUẢN LÝ PHIÊN BẢN PYTHON TRUYỀN THỐNG)
# ============================================================================
# 👉 1A. Trên macOS (dùng Homebrew):
# $ brew update && brew install pyenv
# Cấu hình biến môi trường vào ~/.zshrc (BẮT BUỘC để lệnh python nhận pyenv!):
# $ echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
# $ echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
# $ echo 'eval "$(pyenv init -)"' >> ~/.zshrc
# $ source ~/.zshrc

# 👉 1B. Trên Ubuntu / Debian / WSL2 Linux:
# $ curl https://pyenv.run | bash
# (Sau đó thêm 3 dòng export PYENV_ROOT / PATH / eval "$(pyenv init -)" vào ~/.bashrc)

# 👉 1C. Trên Windows (dùng pyenv-win trên PowerShell):
# PS> Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"; &"./install-pyenv-win.ps1"

# ============================================================================
# PHẦN 2: DÙNG 'pyenv' TẢI VÀ CHUYỂN ĐỔI PHIÊN BẢN PYTHON
# ============================================================================
# $ pyenv install 3.12.7          # Tải và biên dịch Python 3.12.7
# $ pyenv global 3.12.7           # Đặt 3.12.7 làm bản mặc định cho toàn máy
# $ pyenv local 3.12.7            # Đặt 3.12.7 cho riêng thư mục dự án hiện tại (.python-version)
# $ pyenv versions                # Kiểm tra các bản đã cài và bản đang kích hoạt (*)

# ============================================================================
# PHẦN 3: TẠO MÔI TRƯỜNG ẢO '.venv' VÀ CÀI THƯ VIỆN BẰNG 'pip'
# ============================================================================
# 1. Tạo thư mục môi trường ảo tên là '.venv' ngay trong thư mục dự án:
# $ python -m venv .venv

# 2. Kích hoạt (Activate) môi trường ảo (Con trỏ Terminal sẽ hiện chữ (.venv) ở đầu):
# - Trên macOS / Linux:          $ source .venv/bin/activate
# - Trên Windows PowerShell:     PS> .venv\\Scripts\\Activate.ps1
# - Trên Windows CMD:            C:\\> .venv\\Scripts\\activate.bat

# 3. Nâng cấp pip và cài đặt thư viện bên trong (.venv):
# (.venv) $ python -m pip install --upgrade pip
# (.venv) $ pip install requests fastapi uvicorn
# (.venv) $ pip freeze > requirements.txt        # Xuất danh sách gói ra file
# (.venv) $ pip install -r requirements.txt      # Cài lại từ file requirements.txt

# 4. Khi muốn thoát khỏi môi trường ảo:
# (.venv) $ deactivate`,
        output: `(.venv) $ python --version\nPython 3.12.7\n(.venv) $ which python\n/Users/dev/my-project/.venv/bin/python`,
        annotations: [
          { line: 6, explanation: '90% người mới cài `pyenv` xong nhưng gõ `python -V` vẫn ra bản cũ của hệ thống là vì quên thêm `eval "$(pyenv init -)"` vào `~/.zshrc` hoặc `~/.bashrc`!' },
          { line: 22, explanation: '`pyenv global 3.12.7` đặt phiên bản mặc định cho toàn bộ máy, còn `pyenv local 3.12.7` tạo file `.python-version` cho riêng thư mục đang đứng.' },
          { line: 31, explanation: '`python -m venv .venv` dùng module `venv` có sẵn của Python để tạo thư mục `.venv/`.' },
          { line: 34, explanation: 'Sau khi chạy `source .venv/bin/activate`, mọi lệnh `python` và `pip` đều trỏ vào bên trong `.venv/`, hoàn toàn an toàn!' },
          { line: 40, explanation: '`pip freeze > requirements.txt` ghi toàn bộ tên và phiên bản thư viện hiện tại ra file để đồng nghiệp cài lại bằng `pip install -r requirements.txt`.' },
        ],
      },
      {
        id: 'ex-s0-0-global-vs-per-project',
        title: 'Thực chiến: Quản lý Global (Toàn máy) vs. Per-Project (Từng Dự án) với `uv` và `pyenv`',
        description: 'Cách chạy song song Dự án A (Python 3.10) và Dự án B (Python 3.12) trên cùng 1 máy tính và cài CLI tool toàn cục đúng chuẩn.',
        code: `# ============================================================================
# 1. CẤU HÌNH GLOBAL (MẶC ĐỊNH TOÀN MÁY KHI ĐỨNG NGOÀI DỰ ÁN)
# ============================================================================
# 👉 Với uv:
# $ uv python install 3.10 3.12 3.13
# $ uv python install 3.12 --default      # Đưa python 3.12 vào PATH mặc định
# $ uv python pin --global 3.12           # Ghim 3.12 làm bản Global

# 👉 Với pyenv:
# $ pyenv install 3.10.15 && pyenv install 3.12.7
# $ pyenv global 3.12.7                   # Ghim 3.12.7 làm bản Global

# ============================================================================
# 2. CẤU HÌNH CHO TỪNG DỰ ÁN RIÊNG BIỆT (LOCAL / PER-PROJECT)
# ============================================================================
# --- DỰ ÁN 1: Hệ thống AI cũ yêu cầu đúng Python 3.10 ---
# $ mkdir ai-legacy && cd ai-legacy
# $ uv init && uv python pin 3.10         # (Hoặc: pyenv local 3.10.15)
# -> Sinh ra file .python-version chứa "3.10" ngay trong ai-legacy/
# $ uv add numpy                          # Tự tạo ai-legacy/.venv (Python 3.10)
# $ uv run python --version               # -> Python 3.10.15

# --- DỰ ÁN 2: Hệ thống Backend FastAPI mới dùng Python 3.12 ---
# $ cd .. && mkdir backend-api && cd backend-api
# $ uv init && uv python pin 3.12         # (Hoặc: pyenv local 3.12.7)
# -> Sinh ra file .python-version chứa "3.12" ngay trong backend-api/
# $ uv add fastapi uvicorn                # Tự tạo backend-api/.venv (Python 3.12)
# $ uv run python --version               # -> Python 3.12.7

# ============================================================================
# 3. CÀI CÔNG CỤ DÒNG LỆNH GLOBAL (GLOBAL CLI TOOLS) KHÔNG LÀM BẨN MÁY
# ============================================================================
# $ uv tool install ruff                  # Cài ruff dùng ở mọi thư mục trên máy
# $ uv tool install httpie                # Cài lệnh 'http' để gọi thử API
# $ uvx cookiecutter gh:tiangolo/full-stack-fastapi-template  # Chạy 1 lần như npx!`,
        output: `ai-legacy   -> Python 3.10.15 (.venv riêng)\nbackend-api -> Python 3.12.7  (.venv riêng)\nGlobal tool -> ruff installed in isolated environment`,
        annotations: [
          { line: 6, explanation: '`uv python install 3.12 --default` và `uv python pin --global 3.12` thiết lập Python 3.12 làm bản mặc định khi bạn ở ngoài các thư mục dự án.' },
          { line: 18, explanation: 'Trong thư mục `ai-legacy`, lệnh `uv python pin 3.10` (hoặc `pyenv local 3.10.15`) tạo file `.python-version` ghi đè cấu hình Global cho riêng thư mục này.' },
          { line: 25, explanation: 'Khi chuyển sang thư mục `backend-api`, file `.python-version` tại đây tự động chuyển môi trường sang Python 3.12 mà không ảnh hưởng gì tới `ai-legacy`.' },
          { line: 32, explanation: '`uv tool install` (hoặc `pipx install`) cài các ứng dụng CLI dùng chung toàn máy vào các môi trường cô lập riêng.' },
        ],
      },
      {
        id: 'ex-s0-0-uv-project-lifecycle',
        title: 'Quản lý Vòng đời Source Code, Dependency Groups, Lockfile & Inline Script với `uv`',
        description: 'Toàn bộ kỹ thuật tổ chức mã nguồn (--app vs --package), phân nhóm phụ thuộc (prod/dev/test), khóa uv.lock và xuất requirements.txt khi dùng uv.',
        code: `# ============================================================================
# 1. TỔ CHỨC CẤU TRÚC SOURCE CODE KHI KHỞI TẠO DỰ ÁN VỚI 'uv init'
# ============================================================================
# 👉 Kiểu 1: Ứng dụng Web / Script / FastAPI đơn giản (--app - Mặc định):
# $ uv init --app order-service
# -> Tạo: order-service/ (main.py, pyproject.toml, .python-version, README.md)

# 👉 Kiểu 2: Dự án Chuẩn Production / Thư viện nhiều module (--package / src-layout):
# $ uv init --package payment-sdk
# -> Tạo cấu trúc src-layout chuẩn PEP:
# payment-sdk/
# ├── pyproject.toml
# ├── .python-version
# └── src/
#     └── payment_sdk/
#         └── __init__.py

# ============================================================================
# 2. QUẢN LÝ DEPENDENCY THEO NHÓM (PROD vs. DEV vs. GROUP) & LOCKFILE
# ============================================================================
# $ cd payment-sdk
# $ uv add httpx "pydantic>=2.8,<3.0"     # Cài thư viện chính vào [project.dependencies]
# $ uv add --dev pytest pytest-cov ruff   # Cài công cụ phát triển vào [dependency-groups.dev]
# $ uv add --group docs mkdocs-material   # Tạo nhóm phụ thuộc riêng (VD: nhóm docs, lint)
# $ uv remove httpx                       # Gỡ bỏ thư viện và tự động dọn các gói con dư thừa

# Kiểm tra cây phụ thuộc & tại sao 1 thư viện con được cài vào máy:
# $ uv tree

# Cập nhật toàn bộ hoặc 1 gói cụ thể trong file khóa uv.lock:
# $ uv lock --upgrade-package pydantic

# Triển khai trên Server / Docker / CI-CD (Cài chính xác 100% từ uv.lock, không cài gói dev):
# $ uv sync --frozen --no-dev

# Khi cần xuất ra file requirements.txt cho hệ thống cũ:
# $ uv export --format requirements-txt --no-hashes -o requirements.txt

# ============================================================================
# 3. CHẠY FILE SCRIPT ĐỘC LẬP KÈM THƯ VIỆN RIÊNG (INLINE SCRIPT METADATA - PEP 723)
# ============================================================================
# Bạn có 1 file ' crawl.py ' lẻ bên ngoài dự án nhưng cần thư viện 'requests' và 'rich'?
# $ uv add --script crawl.py requests rich
# $ uv run crawl.py   # uv tự tạo môi trường tạm cho riêng file crawl.py rồi chạy ngay!`,
        output: `Resolved 18 packages in 12ms\npayment-sdk v0.1.0\n├── pydantic v2.9.2\n│   ├── annotated-types v0.7.0\n│   └── pydantic-core v2.23.4\n└── (dev) pytest v8.3.3`,
        annotations: [
          { line: 8, explanation: '`uv init --package` tự động tạo cấu trúc thư mục `src/<tên_package>/__init__.py` chuẩn chỉnh giúp chống lỗi import nhầm thư mục gốc.' },
          { line: 20, explanation: 'Phân tách rõ thư viện chạy Production (`uv add`) và công cụ phát triển (`uv add --dev` hoặc `--group`) trong `pyproject.toml`.' },
          { line: 25, explanation: '`uv tree` vẽ sơ đồ cây phụ thuộc trực quan ngay trên Terminal để biết gói nào kéo theo gói nào.' },
          { line: 31, explanation: '`uv sync --frozen --no-dev` là lệnh vàng trên Docker/Production: cam kết cài đúng từng byte theo `uv.lock` và loại bỏ các gói dev nặng nề.' },
          { line: 39, explanation: 'Tính năng PEP 723 (`uv add --script`) nhúng danh sách thư viện ngay đầu file `.py` dưới dạng comment `# /// script`, giúp gửi 1 file `.py` duy nhất cho đồng nghiệp chạy được ngay!' },
        ],
      },
      {
        id: 'ex-s0-0-vscode-cursor-config',
        title: 'Cấu hình Chuẩn cho VS Code / Cursor (`.vscode/settings.json` & `pyproject.toml`)',
        description: 'Bộ cấu hình thực tế giúp VS Code / Cursor tự động nhận môi trường ảo .venv, gợi ý kiểu dữ liệu thông minh và tự động format code bằng Ruff mỗi khi lưu file.',
        code: `# 1. Lệnh cài nhanh 4 Extension quan trọng nhất cho VS Code / Cursor trên Terminal:
# $ code --install-extension ms-python.python
# $ code --install-extension ms-python.vscode-pylance
# $ code --install-extension charliermarsh.ruff
# $ code --install-extension tamasfe.even-better-toml

# 2. Nội dung file '.vscode/settings.json' đặt trong thư mục dự án:
vscode_settings_json = """
{
  // Tự động trỏ vào môi trường ảo .venv của dự án
  "python.defaultInterpreterPath": "\${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true,

  // Bật kiểm tra kiểu dữ liệu tĩnh (Type Checking) với Pylance/Pyright
  "python.analysis.typeCheckingMode": "standard",
  "python.analysis.autoImportCompletions": true,
  "python.analysis.inlayHints.functionReturnTypes": true,

  // Dùng Ruff làm Formatter & Linter mặc định mỗi khi bấm Save (Cmd+S / Ctrl+S)
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  }
}
"""
print("Đã sẵn sàng cấu hình .vscode/settings.json chuẩn chuyên nghiệp!")`,
        output: `Đã sẵn sàng cấu hình .vscode/settings.json chuẩn chuyên nghiệp!`,
        annotations: [
          { line: 2, explanation: 'Bộ 4 Extension nền tảng: `ms-python.python` (chạy & debug), `vscode-pylance` (IntelliSense & kiểm tra kiểu), `ruff` (lint & format siêu tốc), `even-better-toml` (đọc `pyproject.toml`).' },
          { line: 11, explanation: '`python.defaultInterpreterPath` giúp VS Code / Cursor tự động dùng Python trong `.venv` ngay khi mở thư mục dự án.' },
          { line: 15, explanation: '`typeCheckingMode: "standard"` giúp phát hiện sớm lỗi truyền sai kiểu dữ liệu ngay khi đang gõ code (giống TypeScript).' },
          { line: 20, explanation: 'Khi bấm `Cmd+S` / `Ctrl+S`, Ruff tự động căn chỉnh khoảng trắng chuẩn PEP 8 và sắp xếp lại thứ tự các dòng `import` gọn gàng!' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Thiết lập máy tính mới (MacBook / Windows Laptop) từ con số 0 trong 5 phút',
        scenario: 'Bạn vừa nhận máy mới hoặc mới chuyển từ ngôn ngữ khác sang Python và muốn cài đặt bộ công cụ sạch sẽ, không rác hệ thống.',
        whyPythonFits: 'Chỉ cần cài `uv` + VS Code/Cursor + 4 Extensions (`Python`, `Pylance`, `Ruff`, `Even Better TOML`) là bạn đã có môi trường đạt chuẩn kỹ sư Senior.',
      },
      {
        title: 'Clone và chạy bất kỳ dự án mẫu hoặc mã nguồn mở Python nào trên GitHub',
        scenario: 'Khi tải một dự án trên GitHub (hoặc 1 trong 16 Dự án Mẫu của Learning Gate) về máy cá nhân.',
        whyPythonFits: 'Nếu dự án có `pyproject.toml`, chỉ cần chạy `uv sync` rồi `uv run ...`. Nếu dự án có `requirements.txt`, chỉ cần `uv venv && uv pip install -r requirements.txt`!',
      },
    ],
    tipsAndBestPractices: [
      'Luôn kiểm tra mình đang dùng Python ở đâu bằng lệnh `which python` (macOS/Linux) hoặc `Get-Command python` (Windows PowerShell). Đường dẫn đúng phải nằm trong `.venv` hoặc `.local/share/uv` / `.pyenv`.',
      'Đặt tên thư mục môi trường ảo thống nhất là **`.venv`** (có dấu chấm ở đầu) vì cả VS Code, Cursor, PyCharm và `uv` đều tự động nhận diện tên `.venv` mà không cần cấu hình thủ công.',
      'Để chạy các công cụ CLI viết bằng Python (như `ruff`, `httpie`, `yt-dlp`, `cookiecutter`) ở mọi nơi mà không cần cài vào dự án, hãy dùng lệnh `uvx <tên_công_cụ>` (tương đương `npx` bên Node.js!).',
    ],
    commonIssues: [
      {
        id: 'issue-s0-command-not-found-python',
        title: 'Lỗi `zsh: command not found: python` trên macOS / Linux mới',
        severity: 'warning',
        symptom: 'Gõ `python --version` trên macOS hoặc Ubuntu thì báo `command not found: python`, dù gõ `python3 --version` lại có.',
        whyItHappens:
          'Từ macOS Monterey và Ubuntu 20.04+, hệ điều hành đã gỡ bỏ tên tắt `python` (vốn từng trỏ vào Python 2 cũ) và chỉ để lại lệnh `python3`.',
        wrongCode: `# Gõ trực tiếp python khi chưa cài uv/pyenv hoặc chưa kích hoạt .venv:\n$ python main.py\n# -> zsh: command not found: python`,
        rightCode: `# Cách 1: Chạy qua uv (Tự động ánh xạ chuẩn cả python và python3)\n$ uv run python main.py\n\n# Cách 2: Khi đã kích hoạt .venv (source .venv/bin/activate), lệnh 'python' tự động có sẵn!\n$ source .venv/bin/activate\n(.venv) $ python main.py`,
        fixExplanation: 'Khi làm việc bên trong môi trường ảo `.venv` hoặc dùng `uv run` / `pyenv`, lệnh `python` luôn được ánh xạ tự động tới Python 3 của dự án.',
      },
      {
        id: 'issue-s0-windows-execution-policy',
        title: 'Lỗi không kích hoạt được `.venv` trên Windows PowerShell (`running scripts is disabled on this system`)',
        severity: 'critical',
        symptom: 'Trên Windows PowerShell, khi gõ `.venv\\Scripts\\activate` thì báo lỗi đỏ: `Activate.ps1 cannot be loaded because running scripts is disabled on this system (PSSecurityException)`.',
        whyItHappens:
          'Mặc định Windows PowerShell chặn chạy các file script `.ps1` để bảo mật cho đến khi bạn cấp quyền `RemoteSigned` cho tài khoản hiện tại.',
        wrongCode: `PS C:\\my-app> .venv\\Scripts\\activate\n# LỖI: File .venv\\Scripts\\Activate.ps1 cannot be loaded because running scripts is disabled`,
        rightCode: `# Chạy lệnh cấp quyền 1 lần duy nhất cho CurrentUser trên PowerShell:\nPS C:\\my-app> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\n\n# Sau đó kích hoạt bình thường (hoặc dùng thẳng 'uv run' không cần activate!):\nPS C:\\my-app> .venv\\Scripts\\Activate.ps1\n(.venv) PS C:\\my-app> python main.py`,
        fixExplanation: 'Chạy `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` trên PowerShell, hoặc dùng `uv run python main.py` để bỏ qua hoàn toàn bước chạy script `Activate.ps1`.',
      },
      {
        id: 'issue-s0-vscode-unresolved-import',
        title: 'Lỗi đã cài thư viện thành công trên Terminal nhưng VS Code vẫn báo gạch vàng `Import "..." could not be resolved`',
        severity: 'warning',
        symptom: 'Chạy `uv add fastapi` hoặc `pip install fastapi` xong, chạy code trên Terminal thì được nhưng trong VS Code / Cursor vẫn gạch chân vàng báo không tìm thấy thư viện.',
        whyItHappens:
          'VS Code đang trỏ nhầm vào Python mặc định của máy (nơi không có thư viện) chứ chưa trỏ vào thư mục `.venv/` của dự án.',
        wrongCode: `# Dưới góc phải thanh trạng thái (Status Bar) của VS Code đang hiện:\n# Python 3.9.6 ('/usr/bin/python3') -> Sai Interpreter!`,
        rightCode: `# Bấm tổ hợp phím Cmd + Shift + P (macOS) hoặc Ctrl + Shift + P (Windows/Linux)\n# Gõ: Python: Select Interpreter\n# Chọn dòng có chữ Recommended: Python 3.12.x ('.venv': venv) ./venv/bin/python`,
        fixExplanation: 'Luôn chọn Python Interpreter trỏ vào `./.venv/bin/python` (macOS/Linux) hoặc `.venv\\Scripts\\python.exe` (Windows) trong VS Code / Cursor.',
      },
    ],
    jsComparison: [
      {
        concept: 'Bước 1: Tạo & Khởi tạo Dự án Mới (Project Initialization)',
        jsTsWay: 'mkdir my-project && cd my-project && npm init -y',
        pythonWay: 'uv init my-project && cd my-project  (Python cũ: mkdir my-project && cd my-project && python -m venv .venv)',
        jsCode: `# Node.js:\nmkdir my-project && cd my-project\nnpm init -y\n# -> Tạo ra file package.json`,
        pythonCode: `# Lệnh uv (Tự tạo thư mục, pyproject.toml, .python-version, main.py):\nuv init my-project\ncd my-project\n\n# Tương ứng với Python cũ:\n# mkdir my-project && cd my-project && python -m venv .venv`,
        keyDifference: 'Thay vì phải tự tạo thư mục, tạo môi trường ảo `.venv` và file cấu hình thủ công, bạn chỉ cần chạy một lệnh `uv init my-project` duy nhất.',
      },
      {
        concept: 'Bước 2: Thêm Thư viện vào Dự án (Adding Dependencies)',
        jsTsWay: 'npm install requests  hoặc  yarn add requests',
        pythonWay: 'uv add requests  (Python cũ: pip install requests && pip freeze > requirements.txt)',
        jsCode: `# Node.js:\nnpm install requests\nnpm install -D vitest`,
        pythonCode: `# Lệnh uv (Tự tạo .venv nếu chưa có, cài gói cực nhanh và ghi vào pyproject.toml + uv.lock):\nuv add requests\nuv add --dev pytest\n\n# Tương ứng với Python cũ:\n# source .venv/bin/activate && pip install requests && pip freeze > requirements.txt`,
        keyDifference: 'Khi bạn gõ `uv add requests`, `uv` tự động tạo `.venv/`, tải gói vào `.venv/` và cập nhật cả `pyproject.toml` lẫn `uv.lock` (không cần chạy `pip freeze` thủ công như Python cũ).',
      },
      {
        concept: 'Bước 3: Chạy Code Đầu vào (Entrypoint) của Dự án',
        jsTsWay: 'node hello.js  hoặc  npm start',
        pythonWay: 'uv run hello.py  (Python cũ: source .venv/bin/activate && python hello.py)',
        jsCode: `# Node.js:\nnode hello.js\n# Hoặc:\nnpm start`,
        pythonCode: `# Lệnh uv (Tự động chạy bên trong môi trường ảo .venv mà không cần activate!):\nuv run hello.py\n# Hoặc chạy theo module chuẩn dự án lớn:\nuv run python -m my_project.main\n\n# Tương ứng với Python cũ:\n# source .venv/bin/activate && python hello.py`,
        keyDifference: 'Cơ chế `uv run` đảm bảo code luôn chạy bên trong môi trường ảo `.venv` của dự án mà bạn không cần bận tâm đến việc kích hoạt (`activate`) môi trường đó lên trước.',
      },
      {
        concept: 'Giải phẫu File Cấu hình: package.json vs. pyproject.toml',
        jsTsWay: 'package.json + package-lock.json + node_modules/ + .nvmrc',
        pythonWay: 'pyproject.toml + uv.lock (hoặc requirements.txt) + .venv/ + .python-version',
        jsCode: `{\n  "name": "my-project",\n  "engines": { "node": ">=22" },\n  "dependencies": { "axios": "^1.7.0" },\n  "devDependencies": { "vitest": "^2.0.0" }\n}`,
        pythonCode: `[project]\nname = "my-project"\nrequires-python = ">=3.12"\ndependencies = ["requests>=2.32.0"]\n\n[dependency-groups]\ndev = ["pytest>=8.3.0"]`,
        keyDifference: 'Bạn có thể bật/tắt nút "Đối chiếu JS/TS" trên thanh công cụ bất cứ lúc nào để ẩn hoặc hiện các bảng so sánh tương đương với Node.js/JS/TS này.',
      },
    ],
    externalReferences: [
      {
        title: 'Astral uv — Official Installation & User Guide',
        url: 'https://docs.astral.sh/uv/',
        sourceType: 'Tooling Docs',
        description: 'Tài liệu chính thức của uv: cài đặt trên macOS/Windows/Linux, quản lý Python, tạo dự án và cài đặt thư viện.',
      },
      {
        title: 'pyenv — Simple Python Version Management',
        url: 'https://github.com/pyenv/pyenv',
        sourceType: 'Tooling Docs',
        description: 'Hướng dẫn cài đặt và cấu hình pyenv trên macOS/Linux (và pyenv-win cho Windows).',
      },
      {
        title: 'VS Code Python Tutorial — Getting Started & Selecting Interpreter',
        url: 'https://code.visualstudio.com/docs/python/python-tutorial',
        sourceType: 'Official Docs',
        description: 'Hướng dẫn chính thức từ Microsoft về cấu hình VS Code cho lập trình Python, chọn môi trường .venv và debug.',
      },
    ],
    relatedTermIds: ['eco-uv', 'concept-gil', 'kw-def'],
    relatedLessonIds: ['s0-workflow-pyenv-venv-poetry-pipenv', 's0-python-overview-engine', 's0-versions-install-switch-run'],
    relatedExerciseIds: ['ex-s0-version-cli-check'],
  },
  {
    id: 's0-workflow-pyenv-venv-poetry-pipenv',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 0.5,
    title: '1.0B. Phương pháp 2 — Quản lý Dự án Không dùng uv: Làm chủ pyenv, venv / virtualenv, pip (pip-tools), Poetry & Pipenv',
    shortDescription:
      'Cẩm nang toàn diện dành cho lập trình viên không dùng uv hoặc làm việc trong các dự án doanh nghiệp đang sử dụng pyenv, venv/virtualenv, pip + pip-tools, Poetry và Pipenv để quản lý version, source code và dependencies.',
    estimatedMinutes: 50,
    theoryParagraphs: [
      '**Tại sao bạn cần nắm vững cách quản lý dự án bằng hệ công cụ truyền thống & chuyên biệt (ngoài `uv`)?** Trong thực tế đi làm tại các công ty, ngân hàng, tập đoàn hoặc khi tham gia các dự án mã nguồn mở lâu năm, hệ thống CI/CD và quy chuẩn của đội ngũ có thể đang vận hành ổn định trên **`pyenv` + `venv`/`virtualenv` + `pip` (`requirements.txt`)**, hoặc sử dụng **`Poetry`** (`poetry.lock`), hoặc **`Pipenv`** (`Pipfile.lock`). Bài học này hướng dẫn bạn cách sử dụng **độc lập, trọn vẹn từ A–Z** từng công cụ đó để quản lý vòng đời dự án mà không phụ thuộc vào `uv`.',
      '**1. Quản lý Phiên bản Python bằng `pyenv` (& `pyenv-virtualenv`)**: `pyenv` hoạt động theo cơ chế **Shims** — nó chèn thư mục `~/.pyenv/shims` lên đầu biến môi trường `PATH` để đánh chặn mọi lệnh `python`, `pip`. Khi bạn gõ `python`, `pyenv` kiểm tra theo thứ tự ưu tiên từ cao xuống thấp: (1) Biến môi trường `PYENV_VERSION` (`pyenv shell`) $\\rightarrow$ (2) File `.python-version` trong thư mục dự án hiện tại (`pyenv local`) $\\rightarrow$ (3) File `~/.pyenv/version` toàn máy (`pyenv global`). Nhờ vậy, bạn cài hàng chục bản Python trong `~/.pyenv/versions/` và gắn từng bản cho từng dự án hoàn toàn tự động.',
      '**2. Quản lý Môi trường Ảo & Phụ thuộc bằng Bộ Mặc định (`venv` / `virtualenv` + `pip` + `pip-tools`)**: `venv` là module tích hợp sẵn trong Python 3 (`python -m venv .venv`), trong khi `virtualenv` là gói cài ngoài nhanh hơn và cho phép tạo môi trường ảo với phiên bản Python bất kỳ (`virtualenv -p python3.11 .venv`). Khi quản lý dự án chuyên nghiệp với `pip`, người ta không gõ `pip freeze > requirements.txt` bừa bãi (vì nó trộn lẫn cả gói chính lẫn gói phụ thuộc con khó nâng cấp), mà tách thành 2 tầng thông qua **`pip-tools`**: bạn chỉ khai báo các gói cấp 1 trong `requirements.in`, rồi chạy `pip-compile` để sinh ra file khóa `requirements.txt` chuẩn chỉnh, và dùng `pip-sync` để đồng bộ môi trường!',
      '**3. Quản lý Dự án Toàn diện bằng `Poetry` và `Pipenv`**: Trước khi `uv` ra đời, **`Poetry`** là tiêu chuẩn vàng cho các dự án hiện đại: Poetry quản lý cả cấu trúc source code (`poetry new`), môi trường ảo (`poetry env use`), các nhóm phụ thuộc trong `pyproject.toml`, khóa phiên bản (`poetry.lock`) và đóng gói xuất bản (`poetry build` / `poetry publish`). Trong khi đó, **`Pipenv`** kết hợp `pip` và `virtualenv` thông qua cặp file `Pipfile` và `Pipfile.lock`, rất phổ biến trong các dự án Web Django/Flask truyền thống.',
    ],
    analogy: {
      title: 'Bức tranh Hệ Công cụ Quản lý Dự án khi KHÔNG dùng uv',
      realWorldScenario:
        'Khi không dùng công cụ "tất cả trong một" như uv, hệ sinh thái Python phân chia nhiệm vụ rõ ràng cho từng công cụ chuyên trách:',
      mappingPoints: [
        {
          realWorld: 'Trạm điều phối chọn phiên bản Động cơ Python cho từng dự án (`3.10.15` vs `3.12.7`)',
          pythonEquivalent: '`pyenv` (`pyenv install`, `pyenv global`, `pyenv local`)',
          explanation: 'Chuyên trách việc tải mã nguồn CPython, biên dịch và chuyển đổi phiên bản Python tự động theo file `.python-version`.',
        },
        {
          realWorld: 'Khuôn đóng vách ngăn cô lập thư mục thư viện cho từng dự án (`.venv/`)',
          pythonEquivalent: '`python -m venv .venv` hoặc `virtualenv .venv`',
          explanation: 'Tạo thư mục môi trường ảo riêng biệt. Bắt buộc kích hoạt (`source .venv/bin/activate`) trước khi cài gói hoặc chạy code.',
        },
        {
          realWorld: 'Trình cài đặt gói cơ bản & Bộ biên dịch file khóa `requirements.txt`',
          pythonEquivalent: '`pip` + `pip-tools` (`pip-compile` & `pip-sync`)',
          explanation: 'Viết gói chính vào `requirements.in`, biên dịch thành `requirements.txt` có khóa phiên bản chặt chẽ và đồng bộ bằng `pip-sync`.',
        },
        {
          realWorld: 'Hệ thống Quản lý Dự án, Dependency & Đóng gói Khép kín (Enterprise)',
          pythonEquivalent: '`Poetry` (`pyproject.toml` + `poetry.lock`) hoặc `Pipenv` (`Pipfile` + `Pipfile.lock`)',
          explanation: 'Tự động tạo `.venv`, tự giải quyết xung đột phiên bản phụ thuộc, tách nhóm `dev`/`prod` và chạy code qua `poetry run` / `pipenv run`.',
        },
      ],
      mentalModelTip:
        'Dù công ty bạn chọn bộ **(A) `pyenv` + `venv` + `pip-tools`**, bộ **(B) `pyenv` + `Poetry`**, hay bộ **(C) `pyenv` + `Pipenv`**, hãy luôn cấu hình để thư mục môi trường ảo nằm ngay tại **`.venv/` bên trong dự án** để VS Code / PyCharm tự động nhận diện!',
    },
    diagrams: [
      {
        id: 'diag-s0b-non-uv-stacks',
        title: '3 Mô hình Quản lý Dự án Chuẩn Thực tế khi Không dùng uv',
        subtitle: 'Tùy theo quy chuẩn của dự án hoặc công ty, bạn sẽ sử dụng 1 trong 3 mô hình hoàn chỉnh dưới đây',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'stack-pyenv-pip-tools',
            badge: 'Mô hình 1 • Chuẩn Cốt lõi & Tinh gọn',
            title: 'pyenv + venv/virtualenv + pip + pip-tools',
            subtitle: '.python-version • requirements.in → requirements.txt',
            detail:
              '• Chọn Python: `pyenv local 3.12.7`\n• Tạo & mở venv: `python -m venv .venv && source .venv/bin/activate`\n• Khóa gói: `pip-compile requirements.in -o requirements.txt`\n• Đồng bộ gói: `pip-sync requirements.txt dev-requirements.txt`\n• Cài package nội bộ: `pip install -e .`',
            highlightColor: 'sky',
          },
          {
            id: 'stack-pyenv-poetry',
            badge: 'Mô hình 2 • Chuẩn Doanh nghiệp & Đóng gói SDK',
            title: 'pyenv + Poetry (pyproject.toml + poetry.lock)',
            subtitle: 'poetry new/init • poetry add • poetry install • poetry run',
            detail:
              '• Cấu hình đặt .venv trong dự án: `poetry config virtualenvs.in-project true`\n• Chọn Python: `poetry env use 3.12`\n• Cài gói: `poetry add fastapi` / `poetry add --group dev pytest`\n• Đồng bộ: `poetry install`\n• Chạy ứng dụng: `poetry run python -m app.main`',
            highlightColor: 'emerald',
          },
          {
            id: 'stack-pyenv-pipenv',
            badge: 'Mô hình 3 • Chuẩn Web / Django Truyền thống',
            title: 'pyenv + Pipenv (Pipfile + Pipfile.lock)',
            subtitle: 'pipenv --python 3.12 • pipenv install • pipenv sync',
            detail:
              '• Đặt .venv trong dự án: `export PIPENV_VENV_IN_PROJECT=1`\n• Khởi tạo & cài gói: `pipenv --python 3.12` & `pipenv install django`\n• Gói dev: `pipenv install --dev pytest`\n• Triển khai Production từ lockfile: `pipenv sync`\n• Chạy ứng dụng: `pipenv run python manage.py runserver`',
            highlightColor: 'amber',
          },
        ],
        caption:
          'Để cài đặt các công cụ quản lý như `poetry`, `pipenv` hoặc `virtualenv` lên máy một cách sạch sẽ, hãy dùng **`pipx`** (`brew install pipx` / `apt install pipx` rồi `pipx install poetry pipenv virtualenv`).',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0b-1-pyenv-venv-pip-tools',
        title: 'Mô hình 1: Quản lý Version, Source Code & Dependency bằng `pyenv` + `venv`/`virtualenv` + `pip` (`pip-tools`)',
        description: 'Quy trình chuẩn từ lúc tạo dự án, ghim phiên bản Python bằng pyenv, tạo .venv, cài đặt package nội bộ (-e .) đến khóa requirements.txt bằng pip-tools.',
        code: `# ============================================================================
# BƯỚC 1: QUẢN LÝ PHIÊN BẢN PYTHON VỚI 'pyenv' (GLOBAL vs. LOCAL DỰ ÁN)
# ============================================================================
# $ pyenv install --list | grep " 3.12"   # Tìm các bản Python 3.12 có thể cài
# $ pyenv install 3.12.7                  # Tải và biên dịch Python 3.12.7
# $ pyenv global 3.12.7                   # Đặt làm mặc định toàn máy

# Khởi tạo thư mục dự án và ghim phiên bản Python riêng cho dự án:
# $ mkdir -p billing-service/src/billing && cd billing-service
# $ pyenv local 3.12.7                    # Tạo file .python-version ghi '3.12.7'
# $ pyenv which python                    # Kiểm tra đường dẫn thực thi Python hiện tại

# ============================================================================
# BƯỚC 2: TẠO & KÍCH HOẠT MÔI TRƯỜNG ẢO (.venv) BẰNG 'venv' HOẶC 'virtualenv'
# ============================================================================
# Cách A: Dùng module chuẩn 'venv' có sẵn trong Python:
# $ python -m venv .venv

# Cách B: Hoặc dùng 'virtualenv' (Nhanh hơn, cho phép chỉ định rõ cờ -p):
# $ virtualenv -p python3.12 .venv

# Kích hoạt môi trường ảo (BẮT BUỘC trước khi dùng pip):
# - macOS / Linux:      $ source .venv/bin/activate
# - Windows PowerShell: PS> .venv\\Scripts\\Activate.ps1

# ============================================================================
# BƯỚC 3: QUẢN LÝ DEPENDENCY CHUYÊN NGHIỆP VỚI 'pip' & 'pip-tools'
# ============================================================================
# (.venv) $ python -m pip install --upgrade pip pip-tools
#
# Tạo file 'requirements.in' (Chỉ ghi các thư viện chính bạn trực tiếp sử dụng):
#   fastapi>=0.115.0
#   uvicorn[standard]>=0.30.0
#   pydantic>=2.9.0
#
# Tạo file 'requirements-dev.in' (Kế thừa file chính và thêm công cụ test/lint):
#   -c requirements.txt
#   pytest>=8.3.0
#   ruff>=0.6.0
#
# Biên dịch ra file khóa 'requirements.txt' và 'requirements-dev.txt' cố định phiên bản:
# (.venv) $ pip-compile requirements.in -o requirements.txt
# (.venv) $ pip-compile requirements-dev.in -o requirements-dev.txt
#
# Đồng bộ chính xác môi trường .venv theo file khóa (tự gỡ các gói thừa!):
# (.venv) $ pip-sync requirements.txt requirements-dev.txt
#
# Cài đặt chính source code của dự án (thư mục src/) ở chế độ Editable để import mọi nơi:
# (.venv) $ pip install -e .`,
        output: `(.venv) $ pip-sync requirements.txt requirements-dev.txt\nSuccessfully installed fastapi-0.115.4 pydantic-2.9.2 pytest-8.3.3 ruff-0.7.2 uvicorn-0.32.0`,
        annotations: [
          { line: 10, explanation: '`pyenv local 3.12.7` tạo file `.python-version`. Bất cứ khi nào bạn `cd` vào `billing-service`, `pyenv` tự động kích hoạt Python 3.12.7.' },
          { line: 19, explanation: '`virtualenv -p python3.12 .venv` rất hữu ích khi bạn muốn tạo nhanh `.venv` bằng một bản Python cụ thể.' },
          { line: 39, explanation: '`pip-compile` giải quyết toàn bộ phụ thuộc bắc cầu và ghi phiên bản chính xác tuyệt đối (`==`) vào `requirements.txt`.' },
          { line: 43, explanation: '`pip-sync` đảm bảo thư mục `.venv` khớp 100% với `requirements.txt` (nếu có gói nào cài thừa bằng tay, `pip-sync` sẽ tự động gỡ bỏ).' },
          { line: 46, explanation: '`pip install -e .` (Editable install) liên kết thư mục `src/` vào `.venv`, giúp bạn chạy `pytest` hay `python -m` không bao giờ gặp lỗi `ModuleNotFoundError`.' },
        ],
      },
      {
        id: 'ex-s0b-2-poetry-complete-workflow',
        title: 'Mô hình 2: Quản lý Dự án Toàn diện bằng `Poetry` (`pyproject.toml` + `poetry.lock`)',
        description: 'Toàn bộ cách sử dụng Poetry từ cài đặt, cấu hình .venv trong dự án, khởi tạo source code, quản lý nhóm dependency đến chạy ứng dụng và build package.',
        code: `# ============================================================================
# BƯỚC 1: CÀI ĐẶT POETRY & CẤU HÌNH ĐẶT '.venv' NGAY TRONG THƯ MỤC DỰ ÁN
# ============================================================================
# Cài đặt Poetry độc lập qua pipx (hoặc script chính thức):
# $ pipx install poetry
# (Hoặc: curl -sSL https://install.python-poetry.org | python3 -)

# CẤU HÌNH VÀNG (Chỉ chạy 1 lần): Bảo Poetry luôn tạo thư mục '.venv/' ngay trong dự án
# thay vì giấu trong thư mục cache hệ thống, giúp VS Code / PyCharm tự nhận diện ngay!
# $ poetry config virtualenvs.in-project true

# ============================================================================
# BƯỚC 2: KHỞI TẠO CẤU TRÚC SOURCE CODE & CHỌN PHIÊN BẢN PYTHON
# ============================================================================
# Cách 1: Tạo dự án mới với cấu trúc src/ chuẩn chỉnh:
# $ poetry new --src analytics-engine
# $ cd analytics-engine

# Cách 2: Hoặc khởi tạo Poetry trong thư mục code đã có sẵn:
# $ poetry init

# Chỉ định phiên bản Python cho dự án (kết hợp hoàn hảo với pyenv):
# $ pyenv local 3.12.7
# $ poetry env use 3.12
# $ poetry env info               # Xem chi tiết đường dẫn .venv và phiên bản Python

# ============================================================================
# BƯỚC 3: QUẢN LÝ DEPENDENCY, LOCKFILE & ĐỒNG BỘ MÔI TRƯỜNG VỚI POETRY
# ============================================================================
# 1. Thêm thư viện chính (Production dependencies):
# $ poetry add fastapi "uvicorn[standard]" sqlalchemy

# 2. Thêm thư viện theo nhóm phát triển (Dev / Test / Lint groups):
# $ poetry add --group dev pytest pytest-asyncio ruff mypy

# 3. Gỡ bỏ thư viện hoặc xem cây phụ thuộc:
# $ poetry remove sqlalchemy
# $ poetry show --tree

# 4. Khi clone dự án có sẵn 'pyproject.toml' & 'poetry.lock' về máy:
# $ poetry install                # Cài đặt toàn bộ (cả prod + dev) và cài package hiện tại
# $ poetry install --without dev --no-root   # Lệnh chuẩn khi cài trên Docker Production!

# 5. Xuất ra requirements.txt nếu nền tảng deploy yêu cầu:
# $ poetry export -f requirements.txt --output requirements.txt --without-hashes

# ============================================================================
# BƯỚC 4: CHẠY CODE, KIỂM THỬ & ĐÓNG GÓI VỚI POETRY
# ============================================================================
# Chạy lệnh bên trong môi trường ảo của Poetry:
# $ poetry run python -m analytics_engine.main
# $ poetry run pytest
# $ poetry run ruff check .

# Đóng gói thành file .whl (Wheel) và .tar.gz trong thư mục dist/:
# $ poetry build`,
        output: `Creating virtualenv analytics-engine in /workspace/analytics-engine/.venv\nUsing version ^0.115.0 for fastapi\nInstalling dependencies from lock file\nWriting lock file`,
        annotations: [
          { line: 10, explanation: '`poetry config virtualenvs.in-project true` là thiết lập quan trọng nhất khi dùng Poetry để thư mục `.venv/` nằm ngay tại gốc dự án.' },
          { line: 15, explanation: '`poetry new --src analytics-engine` tự động tạo cấu trúc thư mục `src/analytics_engine/`, `tests/`, `pyproject.toml` và `README.md`.' },
          { line: 23, explanation: '`poetry env use 3.12` bảo Poetry tạo môi trường ảo `.venv` bằng đúng bản Python 3.12.' },
          { line: 32, explanation: '`poetry add --group dev ...` phân tách rõ các gói phục vụ phát triển vào mục `[tool.poetry.group.dev.dependencies]`.' },
          { line: 40, explanation: 'Trên môi trường Production/Docker, `poetry install --without dev --no-root` chỉ cài các thư viện cần thiết để chạy app.' },
        ],
      },
      {
        id: 'ex-s0b-3-pipenv-complete-workflow',
        title: 'Mô hình 3: Quản lý Dự án bằng `Pipenv` (`Pipfile` + `Pipfile.lock`)',
        description: 'Cách sử dụng Pipenv trong các dự án Web (Django / Flask / Backend API) sử dụng Pipfile và Pipfile.lock.',
        code: `# ============================================================================
# BƯỚC 1: CÀI ĐẶT PIPENV & CẤU HÌNH ĐẶT '.venv' TRONG DỰ ÁN
# ============================================================================
# $ pipx install pipenv
# Thêm dòng sau vào ~/.zshrc hoặc ~/.bashrc để Pipenv luôn tạo '.venv/' ngay trong dự án:
# $ export PIPENV_VENV_IN_PROJECT=1

# ============================================================================
# BƯỚC 2: KHỞI TẠO MÔI TRƯỜNG & QUẢN LÝ GÓI VỚI 'Pipfile'
# ============================================================================
# $ mkdir crm-webapp && cd crm-webapp
# $ pipenv --python 3.12                  # Tạo .venv với Python 3.12 và sinh file Pipfile

# Cài đặt thư viện chạy Production (Ghi vào mục [packages] trong Pipfile):
# $ pipenv install django gunicorn psycopg2-binary

# Cài đặt thư viện phát triển (Ghi vào mục [dev-packages] trong Pipfile):
# $ pipenv install --dev pytest pytest-django black

# Xem đồ thị cây phụ thuộc & kiểm tra lỗ hổng bảo mật CVE:
# $ pipenv graph
# $ pipenv check

# ============================================================================
# BƯỚC 3: KHÓA PHIÊN BẢN, ĐỒNG BỘ PRODUCTION & CHẠY ỨNG DỤNG
# ============================================================================
# Cập nhật file khóa Pipfile.lock (chứa mã băm SHA256 của từng gói):
# $ pipenv lock

# Khi triển khai trên Server Production (Cài chính xác 100% từ Pipfile.lock):
# $ pipenv sync
# (Hoặc trên máy lập trình viên cần cả gói dev: $ pipenv sync --dev)

# Chạy ứng dụng hoặc mở Shell bên trong môi trường Pipenv:
# $ pipenv run python manage.py runserver
# $ pipenv run pytest
# $ pipenv shell                          # Mở sub-shell đã kích hoạt .venv (gõ 'exit' để thoát)`,
        output: `Creating a virtualenv for this project...\nPipfile.lock (e4a1b9) out of date, updating to (9c2f10)...\nLocking [packages] dependencies...\nSuccess! Updated Pipfile.lock!`,
        annotations: [
          { line: 6, explanation: '`PIPENV_VENV_IN_PROJECT=1` giúp Pipenv đặt thư mục môi trường ảo tại `./.venv` ngay trong dự án thay vì thư mục `~/.local/share/virtualenvs/`.' },
          { line: 15, explanation: '`pipenv install` tự động thêm gói vào `Pipfile` và cập nhật mã băm an toàn trong `Pipfile.lock`.' },
          { line: 31, explanation: 'Khác với `pipenv install` (có thể cập nhật lại lockfile), lệnh `pipenv sync` cam kết cài đặt nguyên trạng 100% từ `Pipfile.lock`.' },
          { line: 35, explanation: '`pipenv run <lệnh>` giúp thực thi lệnh ngay bên trong `.venv` mà không cần mở `pipenv shell`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Tham gia dự án Doanh nghiệp đang dùng Poetry hoặc requirements.txt',
        scenario: 'Bạn nhận bàn giao một repository Backend của công ty có sẵn file `poetry.lock` hoặc `requirements.txt` + `.python-version`.',
        whyPythonFits: 'Nhìn vào file ở thư mục gốc là biết ngay công cụ cần dùng: Có `poetry.lock` $\\rightarrow$ chạy `poetry install`; có `Pipfile.lock` $\\rightarrow$ chạy `pipenv sync --dev`; có `requirements.txt` $\\rightarrow$ tạo `.venv` bằng `python -m venv .venv` rồi `pip install -r requirements.txt`!',
      },
    ],
    tipsAndBestPractices: [
      'Cách nhận diện nhanh công cụ quản lý của bất kỳ dự án Python nào chỉ trong 3 giây bằng cách nhìn vào **file lock** ở thư mục gốc: `uv.lock` $\\rightarrow$ dùng **`uv`**; `poetry.lock` $\\rightarrow$ dùng **`Poetry`**; `Pipfile.lock` $\\rightarrow$ dùng **`Pipenv`**; `requirements.txt` $\\rightarrow$ dùng **`venv` + `pip` / `pip-tools`**.',
      'Tuyệt đối không trộn lẫn hai trình quản lý khóa trong cùng một dự án (ví dụ: dự án đang dùng `poetry.lock` thì luôn dùng `poetry add`, không tự ý gõ `pip install` bên ngoài làm lệch file lock).',
      'Khi dùng `Poetry` hoặc `Pipenv`, luôn bật cấu hình tạo `.venv` nằm ngay trong thư mục gốc dự án (`poetry config virtualenvs.in-project true` và `PIPENV_VENV_IN_PROJECT=1`) để dễ kiểm soát và xóa sạch chỉ bằng `rm -rf .venv` khi cần tạo lại.',
    ],
    commonIssues: [
      {
        id: 'issue-s0b-poetry-hidden-venv',
        title: 'Poetry hoặc Pipenv tạo môi trường ảo ở thư mục ẩn ngoài dự án khiến VS Code không tự thấy',
        severity: 'warning',
        symptom: 'Chạy `poetry install` xong nhưng không thấy thư mục `.venv/` trong dự án và VS Code không tự gợi ý Interpreter.',
        whyItHappens:
          'Mặc định Poetry và Pipenv lưu tất cả virtualenv tập trung tại `~/Library/Caches/pypoetry/virtualenvs` (macOS) hoặc `~/.cache/pypoetry/virtualenvs` (Linux).',
        wrongCode: `# Chạy poetry install ngay khi mới cài Poetry mà chưa cấu hình in-project:\n$ poetry install\n# -> Tạo venv ở ~/.cache/pypoetry/virtualenvs/my-app-9x8a7b-py3.12`,
        rightCode: `# Chạy lệnh cấu hình 1 lần duy nhất để Poetry luôn tạo ./.venv ngay trong dự án:\n$ poetry config virtualenvs.in-project true\n# Nếu đã lỡ tạo ở ngoài, xóa env cũ đi rồi chạy lại:\n$ poetry env remove --all && poetry install`,
        fixExplanation: 'Bật `virtualenvs.in-project true` giúp thư mục `.venv/` luôn nằm ngay trong thư mục dự án, thống nhất giữa mọi công cụ.',
      },
    ],
    jsComparison: [
      {
        concept: 'Nhận diện Công cụ Quản lý Dự án qua File Khóa (Lockfile)',
        jsTsWay: 'package-lock.json (npm) | yarn.lock (Yarn) | pnpm-lock.yaml (pnpm) | bun.lockb (Bun)',
        pythonWay: 'requirements.txt (pip) | Pipfile.lock (Pipenv) | poetry.lock (Poetry) | uv.lock (uv)',
        jsCode: `# Nhìn file lock để gõ đúng lệnh:\n# Có pnpm-lock.yaml -> pnpm install\n# Có yarn.lock      -> yarn install\n# Có bun.lockb      -> bun install`,
        pythonCode: `# Nhìn file lock ở gốc dự án để gõ đúng lệnh:\n# Có uv.lock          -> uv sync\n# Có poetry.lock      -> poetry install\n# Có Pipfile.lock     -> pipenv sync --dev\n# Có requirements.txt -> source .venv/bin/activate && pip install -r requirements.txt`,
        keyDifference: 'Giống hệt thế giới JavaScript (npm, Yarn, pnpm, Bun), Python có các công cụ qua từng thời kỳ (`pip`/`venv`, `Pipenv`, `Poetry`, `uv`) — chỉ cần nhìn file lock ở thư mục gốc là bạn biết ngay phải dùng lệnh nào!',
      },
    ],
    externalReferences: [
      {
        title: 'Poetry — Python Packaging and Dependency Management Documentation',
        url: 'https://python-poetry.org/docs/',
        sourceType: 'Tooling Docs',
        description: 'Tài liệu chính thức toàn diện về cách sử dụng Poetry để quản lý dự án, phụ thuộc và đóng gói thư viện.',
      },
      {
        title: 'pip-tools — Compile requirements.in to locked requirements.txt',
        url: 'https://pip-tools.readthedocs.io/',
        sourceType: 'Tooling Docs',
        description: 'Hướng dẫn sử dụng bộ đôi pip-compile và pip-sync để quản lý requirements.txt chuẩn Production.',
      },
      {
        title: 'Pipenv — Python Dev Workflow for Humans',
        url: 'https://pipenv.pypa.io/',
        sourceType: 'Tooling Docs',
        description: 'Tài liệu chính thức từ PyPA về cách quản lý Pipfile, Pipfile.lock và môi trường ảo với Pipenv.',
      },
    ],
    relatedTermIds: ['eco-uv', 'concept-gil', 'kw-def'],
    relatedLessonIds: ['s0-install-setup-uv-pyenv-ide', 's0-stdlib-and-third-party-ecosystem', 's0-python-overview-engine', 's0-versions-install-switch-run'],
    relatedExerciseIds: ['ex-s0-version-cli-check'],
  },
  {
    id: 's0-stdlib-and-third-party-ecosystem',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 0.8,
    title: '1.0C. Bản đồ Thư viện Python: Thư viện Tiêu chuẩn (Standard Library) & Thư viện Thực chiến Hay Dùng (Cách dùng, Tips/Tricks & Thay thế)',
    shortDescription:
      'Cẩm nang toàn diện về các thư viện có sẵn trong Python (pathlib, collections, itertools, functools, datetime, json, dataclasses, subprocess...) và các thư viện thực tế phổ biến nhất (httpx, requests, Pydantic, FastAPI, SQLAlchemy, Polars/Pandas, pytest, Rich/Typer): giải quyết bài toán gì, cách dùng, mẹo tối ưu và thư viện thay thế.',
    estimatedMinutes: 55,
    theoryParagraphs: [
      '**Triết lý "Batteries Included" (Pin đi kèm máy) của Python là gì?** Nếu bạn đi từ JavaScript / Node.js sang, bạn sẽ quen với việc cài hàng chục gói `npm` nhỏ lẻ cho những tác vụ cơ bản (`lodash`, `mkdirp`, `glob`, `csv-parse`, `dotenv`...). Ngược lại, ngay khi cài Python xong, bạn đã có sẵn một kho **Thư viện Tiêu chuẩn (Python Standard Library)** cực kỳ đồ sộ đi kèm trình thông dịch: từ thao tác đường dẫn file (`pathlib`), cấu trúc dữ liệu hiệu năng cao (`collections`), lập trình hàm & caching (`itertools`, `functools`), ngày giờ múi giờ (`datetime`, `zoneinfo`), đọc ghi `json`/`csv`/`tomllib`, định nghĩa dữ liệu (`dataclasses`, `typing`, `enum`) cho tới gọi lệnh hệ điều hành (`subprocess`, `shutil`) và bảo mật (`secrets`, `hashlib`). Bạn chỉ cần gõ `import ...` là dùng ngay, không cần cài bất cứ gói nào!',
      '**Khi nào dùng Thư viện Tiêu chuẩn (Stdlib), khi nào cài Thư viện Ngoài (Third-Party trên PyPI)?** Quy tắc vàng của lập trình viên Python chuyên nghiệp: **(1) Ưu tiên Thư viện Tiêu chuẩn** cho các tác vụ cốt lõi về file, đường dẫn (`pathlib`), gom nhóm đếm phần tử (`collections.Counter`, `defaultdict`), bộ nhớ đệm (`functools.lru_cache`), ngày giờ chuẩn múi giờ (`zoneinfo`) để giảm phụ thuộc bên ngoài; **(2) Dùng Thư viện Thực chiến (Third-Party)** khi bài toán đòi hỏi giao thức mạng hiện đại, hiệu năng lõi C/Rust hoặc kiến trúc lớn: gọi HTTP/API (`httpx` hoặc `requests`), kiểm증 dữ liệu & biến môi trường (`pydantic`, `pydantic-settings`), xây dựng Web API (`FastAPI` / `Django`), truy vấn Database (`SQLAlchemy 2.0` + `Alembic`), xử lý dữ liệu lớn (`Polars` / `Pandas`), kiểm thử (`pytest`), và làm CLI/Logging đẹp mắt (`Rich`, `Typer`, `Loguru`).',
      '**Các cặp Thư viện "Đi cùng nhau" trong dự án thực tế**: Trong một dự án Python chuẩn Production, các thư viện hiếm khi đứng đơn lẻ mà thường kết hợp thành bộ đôi hoàn hảo: `FastAPI` + `Pydantic` + `Uvicorn` (Web API), `SQLAlchemy 2.0` + `Alembic` + `asyncpg` (Database & Migration), `httpx` + `tenacity` (Gọi API bất đồng bộ kèm cơ chế tự động thử lại khi lỗi mạng Exponential Backoff), `Typer` + `Rich` (Xây dựng công cụ dòng lệnh CLI có bảng màu và thanh tiến trình), `pytest` + `pytest-asyncio` + `pytest-cov` (Kiểm thử tự động).',
      '**Mẹo tra cứu nhanh trong ứng dụng**: Ngoài bài học tổng quan này, bạn có thể bấm vào tab **"Từ điển & Thư viện Python"** trên thanh menu trên cùng hoặc mở **"Cẩm nang Cài đặt & Quản lý Dự án" $\\rightarrow$ Tab "📚 Thư viện Chuẩn & Thực chiến"** để lọc theo từng nhóm bài toán, tìm kiếm hàm, copy lệnh cài đặt (`uv add` / `pip install`) và bật/tắt đối chiếu tương đương với Node.js/JS/TS.',
    ],
    analogy: {
      title: 'Bản đồ Chọn Thư viện Python theo Bài toán Thực tế',
      realWorldScenario:
        'Giống như người thợ có Hộp đồ nghề theo máy (Standard Library) và Các máy móc chuyên dụng mua thêm (Third-Party PyPI), biết chọn đúng thư viện giúp bạn tiết kiệm 80% thời gian viết code:',
      mappingPoints: [
        {
          realWorld: 'Đường dẫn File, Thư mục & Hệ điều hành (Không cần cài thêm)',
          pythonEquivalent: '`pathlib`, `shutil`, `subprocess`, `os`, `sys`',
          explanation: 'Dùng toán tử `/` của `Path` để nối đường dẫn đa nền tảng, `Path.rglob()` quét file, `shutil.copytree()` sao chép thư mục và `subprocess.run()` gọi lệnh hệ thống an toàn.',
        },
        {
          realWorld: 'Cấu trúc Dữ liệu, Bộ nhớ đệm (Cache) & Xử lý Dòng chảy (Không cần cài thêm)',
          pythonEquivalent: '`collections` (`Counter`, `defaultdict`, `deque`), `itertools`, `functools` (`@lru_cache`)',
          explanation: 'Giải quyết các bài toán đếm tần suất, gom nhóm không sợ lỗi `KeyError`, hàng đợi 2 đầu $O(1)$ và tự động cache kết quả hàm đệ quy/tính toán nặng.',
        },
        {
          realWorld: 'Gọi API (HTTP Client) & Kiểm chứng Dữ liệu (Validation / Env Config)',
          pythonEquivalent: '`httpx` (hoặc `requests`) + `pydantic` & `pydantic-settings`',
          explanation: '`httpx` hỗ trợ cả Sync lẫn Async (`async/await`) kèm Connection Pool; `Pydantic v2` (lõi Rust) ép kiểu và kiểm tra JSON/biến môi trường `.env` chặt chẽ.',
        },
        {
          realWorld: 'Xây dựng Web Backend, Database ORM, Xử lý Dữ liệu & Kiểm thử',
          pythonEquivalent: '`FastAPI` + `SQLAlchemy 2.0` + `Polars` / `Pandas` + `pytest`',
          explanation: 'Bộ tứ trụ cột của các hệ thống Python hiện đại: API tốc độ cao tự sinh Swagger, ORM an toàn kiểu, xử lý bảng dữ liệu triệu dòng và bộ test ngắn gọn.',
        },
      ],
      mentalModelTip:
        'Luôn tự hỏi: "Thư viện Tiêu chuẩn (Standard Library) của Python đã có sẵn công cụ cho việc này chưa?" Nếu là đường dẫn (pathlib), đếm/gom nhóm (collections), cache (functools) hay đọc JSON/TOML/CSV thì dùng ngay Stdlib. Nếu là gọi HTTP (httpx/requests), validate dữ liệu (Pydantic), làm Web API (FastAPI) hay xử lý bảng lớn (Polars/Pandas) thì dùng thư viện Third-Party đầu ngành!',
    },
    codeExamples: [
      {
        id: 'ex-s0c-stdlib-powerhouse',
        title: 'Nhóm 1: Tinh hoa Thư viện Tiêu chuẩn (Standard Library) — Dùng ngay không cần cài đặt',
        description: 'Kết hợp pathlib, collections (Counter, defaultdict), functools (lru_cache), dataclasses và datetime/zoneinfo trong thực tế.',
        code: `from pathlib import Path
from collections import Counter, defaultdict
from functools import lru_cache
from dataclasses import dataclass, field
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json

# ============================================================================
# 1. PATHLIB: Quản lý đường dẫn và đọc/ghi file thanh lịch bằng toán tử '/'
# ============================================================================
# Thay vì nối chuỗi thủ công dễ lỗi dấu '/' và '\\' giữa macOS/Linux và Windows:
base_dir = Path("data") / "reports" / "2026"
# base_dir.mkdir(parents=True, exist_ok=True)  # Tạo toàn bộ cây thư mục nếu chưa có
sample_path = base_dir / "summary.json"
print("File tên:", sample_path.name, "| Đuôi:", sample_path.suffix, "| Gốc:", sample_path.stem)

# ============================================================================
# 2. COLLECTIONS: Counter (đếm tần suất) & defaultdict (gom nhóm tự khởi tạo)
# ============================================================================
orders = [
    ("laptop", "electronics"),
    ("mouse", "electronics"),
    ("coffee", "grocery"),
    ("laptop", "electronics"),
]

# Đếm sản phẩm bán chạy nhất chỉ với 1 dòng:
product_counts = Counter(item for item, _ in orders)
print("Top sản phẩm:", product_counts.most_common(1))

# Gom nhóm sản phẩm theo danh mục mà KHÔNG bao giờ bị lỗi KeyError:
by_category: dict[str, list[str]] = defaultdict(list)
for product, category in orders:
    by_category[category].append(product)
print("Gom nhóm:", dict(by_category))

# ============================================================================
# 3. FUNCTOOLS (@lru_cache) & DATACLASSES: Cache kết quả & tạo Model dữ liệu
# ============================================================================
@lru_cache(maxsize=256)
def heavy_tax_calculation(amount: int, region: str) -> float:
    # Nếu gọi lại với cùng (amount, region), Python trả kết quả ngay từ RAM!
    rate = 0.1 if region == "VN" else 0.08
    return round(amount * (1 + rate), 2)

@dataclass(slots=True)
class Invoice:
    invoice_id: str
    total_vnd: int
    tags: list[str] = field(default_factory=list)  # Luôn dùng default_factory cho list/dict!
    created_at_vn: str = field(
        default_factory=lambda: datetime.now(timezone.utc)
        .astimezone(ZoneInfo("Asia/Ho_Chi_Minh"))
        .isoformat()
    )

inv = Invoice(invoice_id="INV-001", total_vnd=15_000_000, tags=["vip", "paid"])
print("Invoice:", inv)
print("Sau thuế:", heavy_tax_calculation(inv.total_vnd, "VN"))`,
        output: `File tên: summary.json | Đuôi: .json | Gốc: summary\nTop sản phẩm: [('laptop', 2)]\nGom nhóm: {'electronics': ['laptop', 'mouse', 'laptop'], 'grocery': ['coffee']}\nInvoice: Invoice(invoice_id='INV-001', total_vnd=15000000, tags=['vip', 'paid'], created_at_vn='2026-11-08T14:20:00+07:00')\nSau thuế: 16500000.0`,
        annotations: [
          { line: 13, explanation: 'Toán tử `/` của `Path` tự động dùng dấu `/` trên macOS/Linux và `\\` trên Windows. Thuộc tính `.name`, `.stem`, `.suffix` lấy tên file và phần mở rộng cực nhanh.' },
          { line: 27, explanation: '`Counter` nhận một iterable bất kỳ và trả về bảng băm đếm số lần xuất hiện, hỗ trợ `.most_common(n)` để lấy Top $N$ phần tử.' },
          { line: 31, explanation: '`defaultdict(list)` tự động tạo một `[]` rỗng mỗi khi bạn truy cập vào một key chưa tồn tại, giúp bỏ hẳn các đoạn `if key not in d:` rườm rà.' },
          { line: 39, explanation: '`@lru_cache` tự động nhớ kết quả trả về theo bộ tham số đầu vào (Memoization). Có thể kiểm tra tỷ lệ trúng cache bằng `heavy_tax_calculation.cache_info()`.' },
          { line: 46, explanation: '`@dataclass(slots=True)` tự sinh `__init__`, `__repr__`, `__eq__` và bật `__slots__` giúp giảm ~40% bộ nhớ RAM cho mỗi object.' },
        ],
      },
      {
        id: 'ex-s0c-third-party-ecosystem',
        title: 'Nhóm 2: Thư viện Thực chiến (Third-Party) — httpx, Pydantic v2, FastAPI, Polars & pytest',
        description: 'Cách các thư viện bên thứ 3 phổ biến nhất phối hợp với nhau trong một ứng dụng Python hiện đại (kèm giải thích Tips & Thay thế).',
        code: `# ============================================================================
# CÀI ĐẶT NHANH:
# - Dùng uv:   $ uv add httpx pydantic pydantic-settings fastapi polars rich
# - Dùng pip:  $ pip install httpx pydantic pydantic-settings fastapi polars rich
# ============================================================================

# 1. PYDANTIC V2: Kiểm chứng dữ liệu đầu vào (Validation) & Đọc file .env
from pydantic import BaseModel, Field, EmailStr

class CreateOrderRequest(BaseModel):
    customer_email: str
    quantity: int = Field(ge=1, le=100, description="Số lượng từ 1 đến 100")
    unit_price: float = Field(gt=0)

    @property
    def subtotal(self) -> float:
        return round(self.quantity * self.unit_price, 2)

# Pydantic tự động ép kiểu hợp lệ ("5" -> 5) hoặc báo lỗi ValidationError chi tiết:
order = CreateOrderRequest(customer_email="dev@company.vn", quantity=3, unit_price=250.0)
print("Dữ liệu hợp lệ:", order.model_dump(), "| Tổng:", order.subtotal)

# ----------------------------------------------------------------------------
# 2. HTTPX (hoặc REQUESTS): Gọi HTTP API an toàn với Context Manager & Timeout
# ----------------------------------------------------------------------------
# 💡 TIP QUAN TRỌNG:
# - Luôn truyền timeout=... để tránh treo chương trình vô thời hạn khi mạng đứt.
# - Tái sử dụng httpx.Client() (hoặc AsyncClient) để tận dụng Connection Pool!
#
# import httpx
# with httpx.Client(base_url="https://api.example.com", timeout=5.0) as client:
#     resp = client.get("/orders/123")
#     resp.raise_for_status()        # Ném lỗi ngay nếu HTTP 4xx / 5xx
#     data = resp.json()
#
# 🔄 Thư viện thay thế:
# - requests: Phổ biến nhất cho code đồng bộ (Sync), dùng requests.Session().
# - aiohttp: Chuyên cho hệ thống bất đồng bộ (Async) tải cao hoặc WebSockets.

# ----------------------------------------------------------------------------
# 3. POLARS (hoặc PANDAS): Phân tích & Biến đổi dữ liệu bảng tốc độ cao
# ----------------------------------------------------------------------------
# 💡 TIP: Polars viết bằng Rust, chạy đa nhân CPU và hỗ trợ Lazy Evaluation
# (pl.scan_parquet / pl.scan_csv) tối ưu truy vấn trước khi nạp RAM.
# 🔄 Thay thế: pandas (hệ sinh thái lâu đời), DuckDB (chạy SQL trực tiếp trên file).`,
        output: `Dữ liệu hợp lệ: {'customer_email': 'dev@company.vn', 'quantity': 3, 'unit_price': 250.0} | Tổng: 750.0`,
        annotations: [
          { line: 10, explanation: '`BaseModel` của Pydantic v2 sử dụng lõi `pydantic-core` bằng Rust. Dùng `.model_validate()` để parse dict, `.model_validate_json()` để parse chuỗi JSON và `.model_dump()` để xuất ra dict.' },
          { line: 26, explanation: 'Khi gọi API bằng `httpx` hoặc `requests`, luôn đặt `timeout` rõ ràng và dùng `resp.raise_for_status()` để bắt lỗi HTTP 4xx/5xx sớm.' },
          { line: 41, explanation: '`Polars` và `DuckDB` là 2 lựa chọn hiện đại cực nhanh bên cạnh `Pandas` truyền thống khi xử lý dữ liệu bảng từ vài trăm nghìn đến hàng chục triệu dòng.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Chọn đúng bộ thư viện (Tech Stack) khi khởi tạo dự án Python mới',
        scenario: 'Bạn chuẩn bị xây dựng một dịch vụ Backend API, một công cụ CLI tự động hóa hoặc một pipeline xử lý dữ liệu lớn.',
        whyPythonFits: 'Kết hợp hài hòa giữa Thư viện Tiêu chuẩn (`pathlib`, `collections`, `functools`, `zoneinfo`) và các thư viện Third-Party chuẩn công nghiệp (`FastAPI`, `Pydantic v2`, `SQLAlchemy 2.0`, `httpx`, `Polars`, `Rich`/`Typer`, `pytest`) giúp dự án gọn nhẹ, tốc độ cao và dễ bảo trì.',
      },
    ],
    tipsAndBestPractices: [
      'Luôn ưu tiên **Thư viện Tiêu chuẩn (Standard Library)** trước khi cài gói ngoài cho các tác vụ cơ bản: dùng `pathlib.Path` thay cho `os.path`, `collections.Counter` / `defaultdict` thay cho vòng lặp đếm thủ công, `functools.lru_cache` cho bộ nhớ đệm, và `tomllib` để đọc file `.toml`.',
      'Khi gọi API qua mạng bằng `httpx` hoặc `requests`, luôn khởi tạo **Client / Session** (`with httpx.Client(timeout=10.0) as client:`) để tái sử dụng kết nối TCP (Connection Pooling) và bắt buộc truyền `timeout` để tránh treo ứng dụng.',
      'Dùng `pydantic` và `pydantic-settings` ở ngay ranh giới đầu vào của ứng dụng (API Request, Webhook, File `.env`) để phát hiện lỗi dữ liệu ngay lập tức thay vì viết hàng chục câu lệnh `if/else` kiểm tra thủ công.',
      'Mở mục **"Từ điển & Thư viện Python"** trên thanh điều hướng để tra cứu chi tiết 16 nhóm thư viện kèm cách dùng, tips/tricks, các thư viện thay thế và so sánh tương đương với Node.js/JS/TS.',
    ],
    commonIssues: [
      {
        id: 'issue-s0c-requests-no-session-timeout',
        title: 'Gọi `requests.get()` hoặc `httpx.get()` trực tiếp trong vòng lặp mà không dùng Client/Session và quên `timeout`',
        severity: 'critical',
        symptom: 'Chương trình chạy rất chậm khi gọi hàng trăm API liên tiếp (do phải bắt tay TCP/TLS lại từ đầu mỗi lần) hoặc bị treo cứng mãi mãi khi server đối tác không phản hồi.',
        whyItHappens:
          'Mỗi lệnh `httpx.get()` / `requests.get()` rời rạc sẽ tạo một kết nối mạng mới rồi đóng ngay. Ngoài ra `requests` mặc định không giới hạn thời gian chờ (`timeout=None`).',
        wrongCode: `import requests\nfor url in urls:\n    # NGUY HIỂM: Không có timeout (dễ treo vĩnh viễn) và không tái sử dụng kết nối TCP!\n    r = requests.get(url)`,
        rightCode: `import httpx\n# CHUẨN: Dùng Client (hoặc requests.Session) để giữ Connection Pool và luôn có timeout\nwith httpx.Client(timeout=10.0) as client:\n    for url in urls:\n        r = client.get(url)\n        r.raise_for_status()`,
        fixExplanation: 'Sử dụng `with httpx.Client(timeout=10.0) as client:` (hoặc `with requests.Session() as s:`) giúp tái sử dụng kết nối TCP Keep-Alive, tăng tốc độ gọi API lên gấp nhiều lần và không bao giờ bị treo cứng.',
      },
      {
        id: 'issue-s0c-naive-datetime',
        title: 'Dùng `datetime.now()` hoặc `datetime.utcnow()` không có múi giờ (Naive Datetime) gây lệch giờ hệ thống',
        severity: 'warning',
        symptom: 'Thời gian lưu xuống Database bị lệch 7 tiếng khi deploy từ máy cá nhân (giờ Việt Nam `+07:00`) lên máy chủ Cloud (giờ `UTC`).',
        whyItHappens:
          '`datetime.now()` không truyền tham số sẽ lấy giờ cục bộ của máy đang chạy mà không đính kèm thông tin múi giờ (`tzinfo=None`), còn `datetime.utcnow()` đã bị ngừng khuyến khích (deprecated) từ Python 3.12.',
        wrongCode: `from datetime import datetime\nnow = datetime.now()       # Naive datetime (không biết của múi giờ nào!)\nutc = datetime.utcnow()    # Deprecated trong Python 3.12+`,
        rightCode: `from datetime import datetime, timezone\nfrom zoneinfo import ZoneInfo\n\nnow_utc = datetime.now(timezone.utc)  # Luôn lưu giờ chuẩn UTC có gắn múi giờ!\nnow_vn = now_utc.astimezone(ZoneInfo("Asia/Ho_Chi_Minh"))`,
        fixExplanation: 'Luôn dùng `datetime.now(timezone.utc)` ở tầng Backend/Database và chỉ chuyển sang múi giờ địa phương bằng `ZoneInfo("Asia/Ho_Chi_Minh")` khi hiển thị cho người dùng.',
      },
    ],
    jsComparison: [
      {
        concept: 'Hệ sinh thái Thư viện: Python vs. Node.js / TypeScript',
        jsTsWay: 'node:path + node:fs | fetch / axios | Zod | Express / Fastify / NestJS | Prisma / Drizzle | Vitest / Jest',
        pythonWay: 'pathlib + shutil | httpx / requests | Pydantic v2 | FastAPI / Django | SQLAlchemy 2.0 + Alembic | pytest',
        jsCode: `// TypeScript + Zod + fetch\nimport { z } from "zod";\nconst UserSchema = z.object({ id: z.number(), email: z.string().email() });\nconst res = await fetch("https://api.example.com/users/1");\nconst user = UserSchema.parse(await res.json());`,
        pythonCode: `# Python + Pydantic v2 + httpx\nimport httpx\nfrom pydantic import BaseModel, EmailStr\n\nclass UserSchema(BaseModel):\n    id: int\n    email: EmailStr\n\nwith httpx.Client(timeout=5.0) as client:\n    res = client.get("https://api.example.com/users/1")\n    user = UserSchema.model_validate(res.json())`,
        keyDifference: 'Bạn có thể mở mục "Từ điển & Thư viện Python" trên thanh điều hướng để xem bảng tra cứu chi tiết từng thư viện kèm nút Ẩn/Hiện so sánh Node.js/JS/TS.',
      },
    ],
    externalReferences: [
      {
        title: 'Python Standard Library — Official Documentation',
        url: 'https://docs.python.org/3/library/index.html',
        sourceType: 'Official Docs',
        description: 'Tài liệu chính thức toàn bộ Thư viện Tiêu chuẩn đi kèm sẵn với Python 3.',
      },
      {
        title: 'Awesome Python — Curated List of Python Frameworks, Libraries & Software',
        url: 'https://awesome-python.com/',
        sourceType: 'Deep Dive',
        description: 'Danh mục tổng hợp các thư viện Python thực chiến tốt nhất theo từng lĩnh vực.',
      },
    ],
    relatedTermIds: ['eco-uv', 'concept-gil', 'kw-import'],
    relatedLessonIds: ['s0-install-setup-uv-pyenv-ide', 's0-workflow-pyenv-venv-poetry-pipenv', 's0-python-overview-engine'],
    relatedExerciseIds: ['ex-s0-version-cli-check'],
  },
  {
    id: 's0-python-overview-engine',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 1,
    title: '1.1. Tổng quan Toàn diện về Python, Triết lý Thiết kế & Cơ chế Hoạt động Bên dưới Nắp máy',
    shortDescription:
      'Bắt đầu từ con số 0: Python là gì, tại sao thống trị thế giới công nghệ, triết lý Zen of Python và giải phẫu cách CPython biên dịch mã nguồn .py sang Bytecode (.pyc) rồi chạy trên máy ảo PVM.',
    estimatedMinutes: 30,
    theoryParagraphs: [
      '**Python là gì?** Ra đời năm 1991 bởi **Guido van Rossum**, Python là ngôn ngữ lập trình bậc cao (High-level), thông dịch kết hợp biên dịch Bytecode, định kiểu động (**Dynamically Typed**) nhưng định kiểu mạnh (**Strongly Typed** — không tự ý cộng chuỗi với số `"5" + 3` gây lỗi ngầm như JavaScript), và hỗ trợ đa mô hình lập trình (Hướng đối tượng OOP, Lập trình hàm Functional, và Thủ tục Procedural).',
      '**Triết lý cốt lõi — The Zen of Python (PEP 20)**: Khi bạn gõ `import this` vào Python, 19 nguyên lý thiết kế hiện ra, nổi bật nhất là: *"Đẹp tốt hơn xấu. Tường minh tốt hơn ngầm định (Explicit is better than implicit). Đơn giản tốt hơn phức tạp. Tính dễ đọc rất quan trọng (Readability counts). Và nên có một — tốt nhất là chỉ một — cách rõ ràng nhất để làm một việc."*',
      '**Sự thật về cách Python hoạt động (Không phải chỉ đọc từng dòng chữ!)**: Nhiều người lầm tưởng Python đọc trực tiếp từng dòng chữ trong file `.py` để chạy. Thực tế, **CPython** (bản cài đặt chuẩn viết bằng C) hoạt động qua **2 giai đoạn rõ rệt**: (1) **Pha Biên dịch (Compilation)**: Khi nạp file, trình biên dịch phân tích cú pháp thành cây **AST (Abstract Syntax Tree)** rồi dịch sang **Bytecode** (các mã lệnh cấp thấp lưu trong thư mục `__pycache__/ten_file.cpython-312.pyc` để lần sau khởi động nhanh hơn); (2) **Pha Thực thi (Execution)**: Máy ảo **PVM (Python Virtual Machine)** chạy vòng lặp đánh giá (Evaluation Loop `ceval.c`) đọc từng lệnh Bytecode trên cấu trúc Stack và gọi xuống các hàm C tương ứng của hệ điều hành.',
      '**Tại sao Python vừa bị chê "chậm" nhưng lại thống trị AI, Data Science & Backend?** Bản thân vòng lặp Python thuần chạy trên PVM chậm hơn C/Rust vì phải kiểm tra kiểu dữ liệu động ở mỗi bước. Tuy nhiên, Python được thiết kế như một **"Ngôn ngữ Nhạc trưởng (Glue Language)"**: các thư viện nặng như `NumPy`, `PyTorch`, `Polars`, `Pydantic v2`, `uv` đều có lõi viết bằng **C, C++ hoặc Rust** chạy trực tiếp trên phần cứng với tốc độ tối đa, còn lập trình viên chỉ cần viết vài dòng Python thanh lịch ở tầng trên để điều khiển!',
    ],
    analogy: {
      title: 'CPython giống như "Bếp trưởng Dịch Công thức sang Ký hiệu Tốc ký (Bytecode) cho Dây chuyền Máy C/Rust"',
      realWorldScenario:
        'Hãy hình dung quá trình từ lúc bạn viết một file `hello.py` bằng tiếng Anh dễ đọc cho đến khi vi xử lý CPU thực thi:',
      mappingPoints: [
        {
          realWorld: 'Cuốn sổ công thức viết bằng ngôn ngữ con người dễ đọc (`main.py`)',
          pythonEquivalent: 'Source Code (`.py`)',
          explanation: 'Ưu tiên số 1 là con người đọc hiểu nhanh nhất, bảo trì dễ nhất.',
        },
        {
          realWorld: 'Bản phiếu tốc ký mã hóa đã kiểm tra lỗi chính tả lưu vào tủ đệm (`__pycache__/*.pyc`)',
          pythonEquivalent: 'Python Bytecode (`.pyc`)',
          explanation: 'Nếu bạn không sửa file `.py`, lần chạy sau Python lấy thẳng phiếu tốc ký `.pyc` ra chạy ngay mà không cần dịch lại.',
        },
        {
          realWorld: 'Người điều phối đọc từng dòng phiếu tốc ký và bấm nút dàn máy cơ khí (`PVM`)',
          pythonEquivalent: 'Python Virtual Machine (`CPython Interpreter`)',
          explanation: 'Đọc từng chỉ thị Bytecode (`LOAD_FAST`, `BINARY_OP`, `CALL`) và điều khiển bộ nhớ Heap/Stack.',
        },
      ],
      mentalModelTip:
        'Python là ngôn ngữ **Strongly Typed (Kiểu mạnh)** nhưng **Dynamically Typed (Kiểu động)**: Biến không cố định kiểu lúc khai báo (`x = 5` rồi `x = "hi"` đều được), nhưng mỗi đối tượng trong RAM có kiểu cứng — bạn KHÔNG THỂ lấy `"Tuổi: " + 25` mà phải ép kiểu rõ ràng `f"Tuổi: {25}"`!',
    },
    diagrams: [
      {
        id: 'diag-s0-cpython-pipeline',
        title: 'Sơ đồ Luồng Thực thi 4 Bước của CPython (Từ Source Code .py đến CPU)',
        subtitle: 'Giải phẫu quá trình CPython biên dịch ngầm định ra Bytecode trước khi chạy trên máy ảo PVM',
        type: 'pipeline',
        nodes: [
          {
            id: 'step-source',
            badge: 'Bước 1 • Input',
            title: 'Mã nguồn (Source Code)',
            subtitle: 'main.py (UTF-8 Text)',
            detail:
              'Lập trình viên viết mã nguồn Python tuân thủ quy tắc thụt lề 4 dấu cách. Đây là văn bản thuần túy.',
            highlightColor: 'sky',
          },
          {
            id: 'step-ast',
            badge: 'Bước 2 • Lexer & Parser',
            title: 'Cây Cú pháp Trừu tượng (AST)',
            subtitle: 'Kiểm tra SyntaxError & IndentationError',
            detail:
              'Bộ phân tích từ vựng (Tokenizer) và Parser (PEG Parser từ Python 3.9+) chuyển văn bản thành cây cấu trúc AST. Nếu bạn gõ thiếu dấu `:` hoặc lệch thụt lề, chương trình dừng ngay tại bước này với lỗi `SyntaxError`!',
            highlightColor: 'amber',
          },
          {
            id: 'step-bytecode',
            badge: 'Bước 3 • Bytecode Compiler',
            title: 'Mã Bytecode Trung gian',
            subtitle: '__pycache__/main.cpython-312.pyc',
            detail:
              'Trình biên dịch chuyển cây AST thành các chỉ thị Bytecode cấp thấp (mỗi lệnh dài 2 bytes) và lưu đệm vào thư mục `__pycache__` đối với các module được `import`.',
            highlightColor: 'violet',
          },
          {
            id: 'step-pvm',
            badge: 'Bước 4 • Runtime Engine',
            title: 'Máy ảo PVM & C Extensions',
            subtitle: 'CPython Evaluation Loop -> OS / CPU',
            detail:
              'PVM (Python Virtual Machine) lấy từng lệnh Bytecode đưa vào Stack để thực thi, cấp phát đối tượng trên Heap và gọi xuống các thư viện C/Rust (`libpython`, `NumPy`, OS System Calls).',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khác với C/Rust biên dịch thẳng ra mã máy (Machine Code) phụ thuộc hệ điều hành, CPython biên dịch ra Bytecode độc lập phần cứng và chạy trên máy ảo PVM (tương tự cơ chế JVM của Java).',
      },
      {
        id: 'diag-s0-implementations',
        title: 'Các Bản Thực thi (Implementations) của Ngôn ngữ Python',
        subtitle: 'Python là tên bản đặc tả ngôn ngữ, còn CPython, PyPy, MicroPython là các trình thực thi khác nhau',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'impl-cpython',
            badge: 'Tiêu chuẩn (99% sử dụng)',
            title: 'CPython (Viết bằng C)',
            subtitle: 'python.org • Tương thích 100% hệ sinh thái',
            detail:
              'Bản thực thi gốc và chính thống nhất. Hỗ trợ hoàn hảo mọi thư viện C-Extension (`NumPy`, `PyTorch`, `Pydantic`). Từ bản 3.11–3.13 đã được tối ưu tốc độ mạnh mẽ.',
            highlightColor: 'sky',
          },
          {
            id: 'impl-pypy',
            badge: 'Tốc độ cao (JIT)',
            title: 'PyPy (Có JIT Compiler)',
            subtitle: 'Nhanh gấp 4–7 lần cho vòng lặp Python thuần',
            detail:
              'Tích hợp trình biên dịch Just-In-Time (JIT): phát hiện các đoạn vòng lặp chạy lặp đi lặp lại (hot loops) và dịch thẳng sang mã máy lúc đang chạy.',
            highlightColor: 'amber',
          },
          {
            id: 'impl-micro-cython',
            badge: 'Chuyên dụng & Nhúng',
            title: 'Cython / MicroPython / RustPython',
            subtitle: 'Tối ưu C-level & Vi điều khiển IoT',
            detail:
              'Cython biên dịch code Python có chú thích kiểu sang C thuần để viết thư viện tốc độ cao; MicroPython & CircuitPython thu gọn để chạy trên chip nhúng ESP32 / Raspberry Pi Pico chỉ với 256KB RAM.',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khi nói "cài đặt Python", mặc định chúng ta đang cài đặt và sử dụng **CPython**.',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-bytecode',
        title: 'Minh chứng 1: Nhìn tận mắt Bytecode của CPython bằng module chuẩn `dis`',
        claim:
          'CPython không thực thi văn bản thô mà dịch hàm Python thành chuỗi lệnh Bytecode chạy trên Stack.',
        methodology: 'Sử dụng `import dis; dis.dis(calc)` trên Python 3.12',
        metrics: [
          {
            label: 'Thời gian nạp lần đầu (Chưa có cache `.pyc` — phải Parse + Compile)',
            valueText: '~12.4 ms',
            barPercent: 80,
            note: 'Phải đọc file `.py`, dựng cây AST và sinh Bytecode.',
          },
          {
            label: 'Thời gian nạp lần thứ 2 (Đọc thẳng Bytecode từ `__pycache__/*.pyc`)',
            valueText: '~2.1 ms (Nhanh gấp 6 lần)',
            barPercent: 18,
            isOptimal: true,
            note: 'Bỏ qua hoàn toàn bước phân tích cú pháp, nạp thẳng Bytecode vào PVM.',
          },
        ],
        takeaway:
          'Thư mục `__pycache__` sinh ra trong dự án của bạn chính là bằng chứng của trình biên dịch Bytecode! Hãy luôn thêm `__pycache__/` vào `.gitignore`.',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-1-dis',
        title: 'Khám phá Triết lý Zen, Kiểm tra Kiểu Mạnh (Strong Typing) & Giải phẫu Bytecode',
        description: 'Chứng minh cách Python kiểm tra kiểu dữ liệu và xem mã Bytecode thực tế bên dưới một hàm.',
        code: `import dis
import sys

# 1. Xem phiên bản CPython và nền tảng đang chạy
print("Trình thực thi:", sys.implementation.name)  # 'cpython'
print("Phiên bản:", sys.version.split()[0])        # '3.12.7'

# 2. Định kiểu động (Dynamic) nhưng Định kiểu MẠNH (Strong Typing)
# print("Tổng tiền: " + 500) -> LỖI TypeError ngay lập tức (Không ép kiểu ngầm định bừa bãi!)
total = 500
print(f"Tổng tiền: {total} VNĐ")

# 3. Dùng module 'dis' (Disassembler) để xem Bytecode mà CPython sinh ra:
def calculate_tax(price: float) -> float:
    return price * 0.1

dis.dis(calculate_tax)`,
        output: `Trình thực thi: cpython\nPhiên bản: 3.12.7\nTổng tiền: 500 VNĐ\n  14           0 RESUME                   0\n  15           2 LOAD_FAST                0 (price)\n               4 LOAD_CONST               1 (0.1)\n               6 BINARY_OP                5 (*)\n              10 RETURN_VALUE`,
        annotations: [
          { line: 5, explanation: '`sys.implementation.name` xác nhận bạn đang chạy trên máy ảo `cpython`.' },
          { line: 9, explanation: 'Khác với JS (`"500" + 10` ra `"50010"`), Python bảo vệ bạn bằng lỗi `TypeError` nếu cộng chuỗi với số.' },
          { line: 17, explanation: '`dis.dis()` in ra các lệnh Bytecode thực tế: `LOAD_FAST` (đẩy biến `price` lên đỉnh Stack), `LOAD_CONST` (đẩy `0.1`), `BINARY_OP (*)` (nhân 2 phần tử trên Stack) và `RETURN_VALUE`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Khi nào Python là lựa chọn Số 1 tuyệt đối?',
        scenario: 'Xây dựng hệ thống AI/LLM/RAG, phân tích & xử lý dữ liệu lớn, Backend API (FastAPI/Django), Web Scraping và tự động hóa DevOps.',
        whyPythonFits: 'Tốc độ phát triển tính năng (Developer Velocity) nhanh gấp 3–5 lần C++/Java cùng hệ sinh thái thư viện AI/Data độc tôn.',
      },
      {
        title: 'Khi nào KHÔNG nên viết bằng Python thuần?',
        scenario: 'Viết hệ điều hành (Kernel), driver phần cứng, game 3D 120FPS hay bộ xử lý âm thanh thời gian thực cần độ trễ micro-giây.',
        whyPythonFits: 'Với các bài toán này, người ta viết lõi bằng Rust/C++ rồi bọc giao diện Python (Python Bindings qua `PyO3`) ở bên ngoài.',
      },
    ],
    tipsAndBestPractices: [
      'Gõ `python -c "import this"` trong Terminal để đọc 19 nguyên lý **Zen of Python** bất cứ khi nào bạn phân vân giữa 2 cách viết code.',
      'Luôn thêm `__pycache__/` và `*.py[cod]` vào file `.gitignore` để không đẩy các file Bytecode biên dịch tạm lên Git.',
    ],
    commonIssues: [
      {
        id: 'issue-s0-strong-typing',
        title: 'Nhầm lẫn giữa Dynamically Typed (Kiểu động) và Weakly Typed (Kiểu yếu)',
        severity: 'warning',
        symptom: '`TypeError: can only concatenate str (not "int") to str` khi ghép chuỗi với số.',
        whyItHappens:
          'Lập trình viên từ JS/PHP quen việc ngôn ngữ tự động nối `"User #" + 101`. Python là ngôn ngữ **Strongly Typed** nên từ chối ép kiểu ngầm định gây mơ hồ ("Explicit is better than implicit").',
        wrongCode: `user_id = 101\n# LỖI TypeError: Không thể cộng trực tiếp str và int!\nmessage = "Xin chào User #" + user_id`,
        rightCode: `user_id = 101\n# ĐÚNG: Dùng f-string vừa rõ ràng vừa nhanh nhất trong CPython!\nmessage = f"Xin chào User #{user_id}"`,
        fixExplanation: 'Luôn dùng `f-string` (`f"... {bien} ..."`) để nội suy biến vào chuỗi.',
      },
    ],
    jsComparison: [
      {
        concept: 'Hệ thống Kiểu: Strong vs. Weak Dynamic Typing',
        jsTsWay: 'JavaScript là Weakly Typed: "10" + 5 -> "105", "10" - 5 -> 5 (Tự động ép kiểu ngầm định)',
        pythonWay: 'Python là Strongly Typed: "10" + 5 -> Ném lỗi TypeError ngay lập tức!',
        jsCode: `console.log("10" + 5); // "105"\nconsole.log("10" - 5); // 5`,
        pythonCode: `# "10" + 5  -> TypeError!\nprint(int("10") + 5)  # 15\nprint(f"10{5}")       # "105"`,
        keyDifference: 'Python tuyệt đối không đoán mò ý định của bạn khi trộn lẫn chuỗi và số, giúp loại bỏ hàng loạt bug ẩn lúc tính toán tiền tệ/số liệu.',
      },
    ],
    externalReferences: [
      {
        title: 'PEP 20 — The Zen of Python',
        url: 'https://peps.python.org/pep-0020/',
        sourceType: 'PEP Standard',
        description: '19 nguyên lý triết lý thiết kế cốt lõi định hình toàn bộ ngôn ngữ Python của Tim Peters.',
      },
      {
        title: 'CPython Internals & Execution Model (Official Docs)',
        url: 'https://docs.python.org/3/reference/executionmodel.html',
        sourceType: 'Official Docs',
        description: 'Tài liệu chính thức giải thích mô hình thực thi, phạm vi tên và cơ chế vận hành của Python.',
      },
    ],
    relatedTermIds: ['concept-pass-by-object-ref', 'eco-uv', 'kw-def'],
    relatedLessonIds: ['s0-versions-install-switch-run', 's0-syntax-primitives-operators-flow'],
    relatedExerciseIds: ['ex-s1-mutable-trap'],
  },
  {
    id: 's0-versions-install-switch-run',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 2,
    title: '1.2. Các Phiên bản Python (2 vs 3, 3.8 → 3.13+), Cài đặt, Switch Phiên bản & 5 Cách Chạy Code',
    shortDescription:
      'Làm chủ bức tranh các phiên bản Python, tại sao có sự khác biệt, cách cài đặt và chuyển đổi (switch) linh hoạt nhiều phiên bản Python trên cùng 1 máy, và 5 phương thức chạy chương trình.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      '**Lịch sử Phiên bản & Tại sao Python 2 bị khai tử?**: Năm 2008, Python 3.0 ra đời với quyết định dũng cảm là **không tương thích ngược hoàn toàn với Python 2** để sửa chữa các khiếm khuyết thiết kế gốc (đặc biệt là chuyển toàn bộ chuỗi `str` sang chuẩn **Unicode UTF-8** mặc định, biến `print` thành hàm `print()`, và chuẩn hóa phép chia `5 / 2 = 2.5` thay vì bị cắt cụt thành `2` như Python 2). Python 2 đã chính thức ngừng hỗ trợ (End-of-Life) từ ngày 01/01/2020. Hiện nay, 100% dự án mới đều dùng **Python 3 (khuyên dùng từ 3.11 đến 3.13+)**.',
      '**Sự khác nhau giữa các phiên bản Python 3 hiện đại (3.8 → 3.13+)**: Mỗi năm vào tháng 10, Python phát hành một bản Minor mới (`3.x`). Việc nắm rõ tính năng của từng phiên bản giúp bạn biết tại sao đoạn code dùng `match-case` chạy được trên máy dùng Python 3.12 nhưng lại báo lỗi cú pháp trên server cũ chạy Python 3.9!',
      '**Có Switch (Chuyển đổi) phiên bản Python được không? — CÓ VÀ RẤT THƯỜNG XUYÊN!**: Trong thực tế đi làm, Dự án A (Legacy) của công ty có thể yêu cầu đúng **Python 3.10**, trong khi Dự án B (Mới) dùng **Python 3.12**, và bạn muốn thử nghiệm tính năng No-GIL trên **Python 3.13**. Tuyệt đối không gỡ đi cài lại Python trong hệ điều hành! Thay vào đó, chúng ta dùng trình quản lý phiên bản như **`uv`** (hoặc `pyenv`) kết hợp file **`.python-version`** đặt ở thư mục gốc của từng dự án để tự động switch phiên bản trong 0.01 giây!',
      '**Môi trường ảo (`.venv`) hoạt động ra sao?**: Khác với Node.js mặc định cài thư viện vào `node_modules/` của từng thư mục dự án, nếu bạn gõ `pip install` trần trụi, Python sẽ cài thư viện vào thư mục dùng chung của toàn hệ điều hành (Global Site-packages), gây xung đột phiên bản thư viện nghiêm trọng. Một **Virtual Environment (`.venv`)** tạo ra một thư mục cô lập chứa bản sao con trỏ tới trình thông dịch Python và thư mục `site-packages/` riêng biệt cho dự án đó.',
    ],
    analogy: {
      title: 'Switch Phiên bản Python (uv / pyenv) & Căn Hộ Khép Kín (.venv)',
      realWorldScenario:
        'Hãy hình dung máy tính của bạn là một Tòa nhà Chung cư Kỹ thuật số:',
      mappingPoints: [
        {
          realWorld: 'Trạm biến áp đa năng cung cấp cả nguồn điện 110V (Python 3.10) và 220V (Python 3.12) (`uv python` / `pyenv`)',
          pythonEquivalent: 'Version Manager (`uv python pin 3.12` -> tạo file `.python-version`)',
          explanation: 'Mỗi căn hộ (dự án) chỉ cần dán tờ giấy `.python-version` trước cửa ghi `3.12`, trạm biến áp tự động cấp đúng dòng điện Python 3.12 cho dự án đó!',
        },
        {
          realWorld: 'Tủ đồ nội thất riêng bên trong từng căn hộ (`.venv/lib/python3.12/site-packages`)',
          pythonEquivalent: 'Virtual Environment (`.venv/`)',
          explanation: 'Căn hộ A dùng thư viện `FastAPI 0.100`, căn hộ B dùng `FastAPI 0.115` hoàn toàn độc lập, không bao giờ đụng chạm nhau.',
        },
        {
          realWorld: 'Công tắc tổng kiểm tra xem file đang được chạy trực tiếp hay được mượn làm thư viện (`__name__ == "__main__"`)',
          pythonEquivalent: '`if __name__ == "__main__": main()`',
          explanation: 'Khi bạn chạy `python app.py`, Python gán `__name__ = "__main__"`. Nhưng khi file khác `import app`, biến `__name__` mang tên `"app"`, giúp ngăn code chạy tự động ngoài ý muốn!',
        },
      ],
      mentalModelTip:
        'Với công cụ `uv` hiện đại, bạn không cần nhớ lệnh `source .venv/bin/activate` thủ công nữa: chỉ cần gõ `uv run main.py`, `uv` sẽ tự động đọc `.python-version`, kích hoạt `.venv` đúng phiên bản và chạy code trong một bước duy nhất!',
    },
    diagrams: [
      {
        id: 'diag-s0-version-timeline',
        title: 'Dòng Thời gian & Khác biệt Cốt lõi giữa các Phiên bản Python (2.7 → 3.13+)',
        subtitle: 'Bấm vào từng phiên bản để xem các tính năng đột phá và cú pháp mới được bổ sung',
        type: 'version-timeline',
        nodes: [
          {
            id: 'ver-py2-vs-3',
            badge: 'Python 2 vs 3',
            title: 'Cuộc Đại Chuyển Đổi (2008–2020)',
            subtitle: 'Unicode UTF-8 mặc định, print(), phép chia thực /',
            detail:
              'Python 2 đã khai tử (EOL 2020). Python 3 biến mọi chuỗi `str` thành Unicode mặc định (hỗ trợ tiếng Việt/Emoji hoàn hảo), biến `print`, `exec` thành hàm, và ưu tiên trả về Iterator/View lười (`range`, `dict.keys()`, `zip`, `map`) thay vì tạo `list` tốn RAM.',
            highlightColor: 'rose',
          },
          {
            id: 'ver-38-39',
            badge: 'Python 3.8 & 3.9',
            title: 'Toán tử Walrus (:=) & Built-in Generic Types',
            subtitle: 'if (n := len(a)) > 10 • list[str] • dict1 | dict2',
            detail:
              'Python 3.8 giới thiệu toán tử gán trong biểu thức `:=` (Walrus operator) và f-string debug `f"{x=}"`. Python 3.9 cho phép viết trực tiếp `list[int]`, `dict[str, Any]` mà không cần `from typing import List, Dict`, cùng toán tử gộp từ điển `d1 | d2`.',
            highlightColor: 'sky',
          },
          {
            id: 'ver-310',
            badge: 'Python 3.10 (10/2021)',
            title: 'Pattern Matching (match-case) & Union (|)',
            subtitle: 'match event: case ... • int | None',
            detail:
              'Bước nhảy lớn về cú pháp: Bổ sung `match ... case` (Structural Pattern Matching - PEP 634), cho phép viết kiểu hợp `int | str | None` thay cho `Union[int, str, None]`, và nâng cấp thông báo lỗi chỉ rõ dòng thiếu dấu ngoặc.',
            highlightColor: 'violet',
          },
          {
            id: 'ver-311',
            badge: 'Python 3.11 (10/2022)',
            title: 'Faster CPython (+25% đến +60% Tốc độ!)',
            subtitle: 'Specializing Adaptive Interpreter • TaskGroup • tomllib',
            detail:
              'Nhờ dự án Faster CPython (PEP 659), trình thông dịch tự động thay thế bytecode chung bằng bytecode chuyên biệt theo kiểu dữ liệu lúc chạy, giúp tăng tốc độ trung bình 25% mà không cần đổi 1 dòng code! Bổ sung `asyncio.TaskGroup` và `tomllib`.',
            highlightColor: 'amber',
          },
          {
            id: 'ver-312',
            badge: 'Python 3.12 (10/2023)',
            title: 'Cú pháp Type Parameter [T] mới & f-string tự do',
            subtitle: 'type Point[T] = tuple[T, T] • def first[T](items: list[T]):',
            detail:
              'PEP 695 giới thiệu cú pháp khai báo Generic gọn nhẹ giống TypeScript (`def max_val[T](a: list[T]) -> T:`), gỡ bỏ mọi hạn chế lồng dấu nháy trong `f-string` (PEP 701) và tối ưu hóa kích thước đối tượng trong RAM.',
            highlightColor: 'emerald',
          },
          {
            id: 'ver-313',
            badge: 'Python 3.13+ (10/2024+)',
            title: 'Free-Threaded No-GIL (PEP 703) & JIT Compiler (PEP 744)',
            subtitle: 'Thử nghiệm tháo bỏ khóa GIL & Copy-and-Patch JIT',
            detail:
              'Cột mốc lịch sử của Python: Lần đầu tiên hỗ trợ bản build tùy chọn `python3.13t` tắt hoàn toàn khóa GIL (Free-threaded mode) cho phép chạy đa luồng CPU song song thực sự, kèm trình biên dịch JIT thử nghiệm và REPL đa dòng có màu sắc trực quan!',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khuyến nghị thực tế hiện nay: Chọn **Python 3.12** làm bản ổn định tiêu chuẩn cho Production, và trải nghiệm **Python 3.13+** cho các tính năng mới nhất.',
      },
      {
        id: 'diag-s0-5-ways-to-run',
        title: '5 Phương thức Chạy Chương trình Python trong Thực tế',
        subtitle: 'Tùy vào mục đích (Thử nghiệm nhanh, Chạy dự án Backend, Chạy tác vụ ngầm hay Phân tích dữ liệu) mà chọn cách chạy phù hợp',
        type: 'pipeline',
        nodes: [
          {
            id: 'run-repl',
            badge: 'Cách 1 • Interactive',
            title: 'Chạy REPL Tương tác',
            subtitle: '$ uv run python',
            detail:
              'Mở giao diện dòng lệnh `>>>` (Read-Eval-Print Loop) để thử nghiệm nhanh biểu thức, kiểm tra hàm hoặc tính toán tức thì. Gõ `exit()` hoặc `Ctrl+D` để thoát.',
            highlightColor: 'sky',
          },
          {
            id: 'run-script',
            badge: 'Cách 2 • Script File',
            title: 'Chạy File Kịch bản Đơn lẻ',
            subtitle: '$ uv run hello.py',
            detail:
              'Thực thi từ đầu đến cuối một file `.py` độc lập. Thư mục chứa file đó sẽ được thêm vào đầu `sys.path[0]`.',
            highlightColor: 'amber',
          },
          {
            id: 'run-module',
            badge: 'Cách 3 • Chuẩn Dự án (-m)',
            title: 'Chạy dưới dạng Module (-m)',
            subtitle: '$ uv run python -m app.main',
            detail:
              'Cờ `-m` bảo Python tìm module từ thư mục gốc hiện tại của dự án (`Current Working Directory`), giúp mọi lệnh `from app.services import ...` hoạt động chuẩn xác không bao giờ bị lỗi `ModuleNotFoundError`!',
            highlightColor: 'emerald',
          },
          {
            id: 'run-inline-nb',
            badge: 'Cách 4 & 5 • CLI / Notebook',
            title: 'Lệnh 1 dòng (-c) & Jupyter',
            subtitle: '$ python -c "..." | *.ipynb',
            detail:
              'Dùng `python -c "import secrets; print(secrets.token_hex(16))"` để tạo khóa nhanh trên Terminal, hoặc dùng Jupyter Notebook (`.ipynb`) để chạy từng ô code kèm biểu đồ trực quan.',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Quy tắc vàng khi làm dự án nhiều file: Luôn chạy bằng cờ `-m` (ví dụ `uv run python -m app.main` hoặc `uv run pytest`) thay vì chạy trực tiếp đường dẫn file sâu bên trong thư mục con!',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-uv-speed',
        title: 'Minh chứng 2: Tốc độ Quản lý Phiên bản & Cài đặt Môi trường Ảo (`uv` vs `pip` + `venv`)',
        claim:
          'Công cụ hiện đại `uv` (viết bằng Rust) giúp tạo môi trường ảo `.venv`, switch phiên bản Python và cài đặt gói nhanh gấp 10–80 lần công cụ truyền thống.',
        methodology: 'Benchmark khởi tạo môi trường ảo và cài đặt bộ thư viện FastAPI + Pydantic + SQLAlchemy',
        metrics: [
          {
            label: 'Cách hiện đại khuyên dùng: `uv venv` + `uv add fastapi sqlalchemy` (Có cache)',
            valueText: '0.45 giây',
            barPercent: 6,
            isOptimal: true,
            note: 'Tự động tải đúng phiên bản Python nếu máy chưa có, tạo `.venv` và khóa `uv.lock` gần như tức thì.',
          },
          {
            label: 'Cách truyền thống: `python3 -m venv .venv` + `pip install ...`',
            valueText: '18.20 giây (Chậm hơn ~40 lần)',
            barPercent: 92,
            note: 'Phải tự cài Python trước bằng tay, tạo `.venv` chậm và không tự sinh file lock chống lệch phiên bản.',
          },
        ],
        takeaway:
          'Bạn vẫn nên biết `python -m venv .venv` để làm việc trên các máy chủ cũ chưa cài `uv`, nhưng trên máy cá nhân và Docker mới, hãy luôn dùng `uv`!',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-2-install-switch',
        title: 'Hướng dẫn Cài đặt, Switch Phiên bản Python & Quản lý .venv Thực tế',
        description: 'Toàn bộ các lệnh Terminal từ lúc máy trắng tinh đến khi chạy đa phiên bản Python 3.10, 3.12, 3.13.',
        code: `# =====================================================================
# PHẦN A: CÀI ĐẶT & SWITCH PHIÊN BẢN PYTHON HIỆN ĐẠI VỚI 'uv' (Khuyên dùng)
# =====================================================================
# 1. Cài đặt uv (trên macOS/Linux hoặc Windows PowerShell):
# macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows:     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Tải cùng lúc nhiều phiên bản Python về máy (không lo xung đột!):
# $ uv python install 3.10 3.12 3.13
# $ uv python list   # Xem danh sách tất cả phiên bản Python hiện có trên máy

# 3. SWITCH PHIÊN BẢN PYTHON cho dự án hiện tại (Tạo file .python-version):
# $ uv python pin 3.12
# $ uv run python --version   -> Python 3.12.x

# 4. Chạy thử nhanh 1 file bằng phiên bản Python bất kỳ mà không cần switch cố định:
# $ uv run --python 3.10 main.py
# $ uv run --python 3.13 main.py

# =====================================================================
# PHẦN B: CÁCH TRUYỀN THỐNG VỚI 'python -m venv' (Mọi máy đều có sẵn)
# =====================================================================
# $ python3 -m venv .venv                 # Tạo thư mục môi trường ảo .venv
# $ source .venv/bin/activate             # Kích hoạt trên macOS / Linux
# $ .venv\\Scripts\\activate              # Kích hoạt trên Windows
# $ pip install -r requirements.txt       # Cài đặt thư viện vào .venv`,
        output: `Pinned \`.python-version\` to \`3.12\`\nPython 3.12.7`,
        annotations: [
          { line: 9, explanation: 'Lệnh `uv python install 3.10 3.12 3.13` tải các bản Python độc lập về máy chỉ trong vài giây mà không cần quyền Admin/sudo.' },
          { line: 13, explanation: '`uv python pin 3.12` ghi số `3.12` vào file `.python-version`. Từ lúc này, mọi lệnh trong thư mục dự án tự động dùng Python 3.12!' },
          { line: 17, explanation: '`uv run --python 3.13 main.py` cho phép kiểm thử ngay code của bạn trên Python 3.13 xem có tương thích hay không.' },
          { line: 23, explanation: 'Cách truyền thống dùng module có sẵn `venv` — cần nhớ lệnh `activate` tùy theo hệ điều hành.' },
        ],
      },
      {
        id: 'ex-s0-2-main-guard',
        title: 'Cơ chế __name__ == "__main__" khi Chạy File vs. Khi Import Module',
        description: 'Hiểu tại sao mọi file kịch bản Python chuẩn đều có dòng kiểm tra if __name__ == "__main__": ở cuối.',
        code: `# file: converter.py
def usd_to_vnd(amount: float, rate: float = 25_400) -> int:
    """Chuyển đổi USD sang VNĐ."""
    return int(amount * rate)

def main() -> None:
    print(f"Biến __name__ hiện tại là: {__name__!r}")
    print(f"100 USD = {usd_to_vnd(100):,} VNĐ")

# CHỐT CHẶN QUAN TRỌNG NHẤT TRONG PYTHON:
# Chỉ tự động chạy hàm main() khi file này được gọi trực tiếp ($ python converter.py)
# Nếu file khác gọi 'import converter', khối này sẽ KHÔNG tự chạy!
if __name__ == "__main__":
    main()`,
        output: `Biến __name__ hiện tại là: '__main__'\n100 USD = 2,540,000 VNĐ`,
        annotations: [
          { line: 6, explanation: 'Tách điểm khởi đầu chương trình vào hàm `main()` giúp các biến không bị rò rỉ ra phạm vi toàn cục (Global Scope).' },
          { line: 13, explanation: 'Khi chạy trực tiếp `python converter.py`, Python gán `__name__ = "__main__"`. Khi được `import converter`, `__name__` sẽ là `"converter"`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Chạy song song dự án AI (Python 3.10) và dự án Backend FastAPI (Python 3.12) trên 1 laptop',
        scenario: 'Một thư viện AI cũ chỉ hỗ trợ tối đa Python 3.10, nhưng dự án web mới cần cú pháp Generic của Python 3.12.',
        whyPythonFits: 'Chỉ cần chạy `uv python pin 3.10` ở thư mục AI và `uv python pin 3.12` ở thư mục Backend — mỗi khi bạn `cd` vào thư mục nào, `uv` tự động dùng đúng bản Python của thư mục đó!',
      },
    ],
    tipsAndBestPractices: [
      'Luôn commit cả 3 file `pyproject.toml`, `uv.lock` và `.python-version` lên Git để mọi thành viên trong nhóm và hệ thống CI/CD chạy đúng 100% phiên bản Python và thư viện như nhau.',
      'Không bao giờ commit thư mục `.venv/` lên Git (tương tự không bao giờ commit `node_modules/`).',
      'Sử dụng các công cụ chuẩn có sẵn qua cờ `-m` cực tiện lợi: `python -m json.tool data.json` (format JSON đẹp trên Terminal) hoặc `python -m http.server 8000` (mở web server tĩnh tức thì).',
    ],
    commonIssues: [
      {
        id: 'issue-s0-global-pip',
        title: 'Lỗi cài thư viện trực tiếp vào Python Hệ điều hành (PEP 668: externally-managed-environment)',
        severity: 'critical',
        symptom: '`error: externally-managed-environment — This environment is externally managed` khi gõ `pip install` trên macOS (Homebrew) hoặc Ubuntu/Debian.',
        whyItHappens:
          'Hệ điều hành Linux/macOS tự dùng Python của hệ thống cho các công cụ nền. Nếu bạn dùng `sudo pip install` ghi đè thư viện hệ thống sẽ làm hỏng cả công cụ của hệ điều hành!',
        wrongCode: `# SAI LẦM NGUY HIỂM: Cài trực tiếp hoặc ép dùng --break-system-packages\nsudo pip install fastapi --break-system-packages`,
        rightCode: `# ĐÚNG CHUẨN: Luôn tạo môi trường ảo (.venv) hoặc dùng uv\nuv init my-project && cd my-project\nuv add fastapi\n# Hoặc cách truyền thống:\npython3 -m venv .venv && source .venv/bin/activate && pip install fastapi`,
        fixExplanation: 'Không bao giờ cài thư viện dự án vào Global Python. Luôn làm việc bên trong `.venv` hoặc thông qua `uv add` / `uv run`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Chuyển đổi Phiên bản Runtime (Version Switching)',
        jsTsWay: 'nvm / fnm + file .nvmrc (nvm use 20, nvm use 22)',
        pythonWay: 'uv python / pyenv + file .python-version (uv python pin 3.12)',
        jsCode: `nvm install 22\necho "22" > .nvmrc\nnvm use`,
        pythonCode: `uv python install 3.12\nuv python pin 3.12   # Tự tạo .python-version\nuv run python -V`,
        keyDifference: '`uv` gộp cả vai trò của `nvm` (quản lý phiên bản Python) lẫn `pnpm` (quản lý gói thư viện) vào một công cụ duy nhất.',
      },
    ],
    externalReferences: [
      {
        title: 'Status of Python Versions (Official Release Cycle)',
        url: 'https://devguide.python.org/versions/',
        sourceType: 'Official Docs',
        description: 'Bảng theo dõi vòng đời hỗ trợ chính thức và lịch phát hành từ Python 3.8 đến 3.14.',
      },
      {
        title: 'uv Documentation — Managing Python Versions & Environments',
        url: 'https://docs.astral.sh/uv/guides/install-python/',
        sourceType: 'Tooling Docs',
        description: 'Hướng dẫn chính thức cách cài đặt và chuyển đổi nhiều phiên bản Python bằng uv.',
      },
    ],
    relatedTermIds: ['eco-uv', 'concept-gil', 'kw-match'],
    relatedLessonIds: ['s0-python-overview-engine', 's0-syntax-primitives-operators-flow'],
    relatedExerciseIds: ['ex-s1-mutable-trap'],
  },
  {
    id: 's0-syntax-primitives-operators-flow',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 3,
    title: '1.3. Cú pháp Nền tảng, Kiểu Dữ liệu Nguyên thủy, Toán tử & Luồng Điều khiển Cơ bản',
    shortDescription:
      'Nắm vững từ gốc: Quy tắc thụt lề (Indentation), int/float/Decimal, chuỗi f-string, hệ thống toán tử (//, **, :=, so sánh bắc cầu) và cấu trúc rẽ nhánh / vòng lặp.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      '**Cú pháp Thụt lề bắt buộc (Significant Indentation)**: Khác với C/Java/JavaScript dùng dấu ngoặc nhọn `{ ... }` để gom nhóm khối lệnh và chỉ coi việc thụt lề là làm đẹp, trong Python **thụt lề (chuẩn PEP 8 là 4 dấu cách - 4 spaces) chính là cú pháp bắt buộc** để xác định phạm vi khối lệnh sau dấu hai chấm `:`. Nhờ quy tắc này, mọi đoạn code Python của mọi lập trình viên trên thế giới đều có cấu trúc thị giác đồng nhất và không bao giờ có tranh cãi về vị trí đặt dấu `{`!',
      '**Các Kiểu dữ liệu Nguyên thủy (Primitive / Scalar Types)**: (1) **`int` (Số nguyên)**: Trong Python 3, `int` có độ lớn tùy ý (Arbitrary-precision), tự động mở rộng số byte trong RAM nên bạn có thể tính `10 ** 500` mà không bao giờ bị tràn số (`Overflow`); (2) **`float` (Số thực dấu phẩy động 64-bit IEEE 754)**: Do biểu diễn nhị phân, `0.1 + 0.2` sẽ ra `0.30000000000000004` — vì vậy khi tính toán tiền tệ tài chính, luôn dùng **`decimal.Decimal("0.1")`**; (3) **`bool` (Logic)**: Chỉ gồm `True` và `False` (viết hoa chữ cái đầu); (4) **`str` (Chuỗi ký tự Unicode bất biến)**: Hỗ trợ chuỗi nhiều dòng `"""..."""`, chuỗi thô `r"C:\\path"` (dùng cho Regex/đường dẫn) và nội suy siêu tốc với **`f-string`**; (5) **`None`**: Giá trị rỗng duy nhất.',
      '**Hệ thống Toán tử Đặc sắc của Python**: Bên cạnh `+`, `-`, `*`, Python phân tách rõ phép chia thực `/` (`7 / 2 = 3.5`) và phép **chia lấy phần nguyên xuống sàn `//`** (`7 // 2 = 3`), cùng phép **lũy thừa `**`** (`2 ** 10 = 1024`). Đặc biệt, Python hỗ trợ **So sánh bắc cầu liên tiếp (Chained Comparison)** cực kỳ tự nhiên như trong toán học: `0 <= score <= 10` hoặc `18 <= age < 65`!',
      '**Luồng Điều khiển (`if / elif / else` & Vòng lặp `for`, `while`)**: Python dùng từ khóa viết gọn `elif` (thay cho `else if`). Biểu thức điều kiện 3 ngôi được viết đọc xuôi như câu tiếng Anh: `status = "Đậu" if score >= 5.0 else "Trượt"`. Ngoài ra, từ Python 3.8+, **Toán tử Hải mã `:=` (Walrus Operator)** cho phép vừa gán biến vừa kiểm tra điều kiện ngay trong cùng một biểu thức `if (n := len(items)) > 10:`.',
    ],
    analogy: {
      title: 'Thụt lề Bắt buộc là "Bậc thang Phân cấp Tổ chức" & Bẫy Tiền lẻ Nhị phân (float vs. Decimal)',
      realWorldScenario:
        'Hai khái niệm nền tảng giúp người mới không bao giờ bỡ ngỡ khi viết những dòng code đầu tiên:',
      mappingPoints: [
        {
          realWorld: 'Mục lục sách thụt lề theo từng cấp Chương -> Mục -> Ý nhỏ (`Indentation`)',
          pythonEquivalent: 'Dấu `:` kết hợp thụt lề 4 dấu cách (`    `)',
          explanation: 'Nhìn vào lề trái là biết ngay câu lệnh nào nằm bên trong `if` hay `for` mà không cần đếm hàng chục dấu đóng ngoặc `}}}` rối mắt.',
        },
        {
          realWorld: 'Thước đo chia vạch 1/3 mét bằng hệ thập phân (`0.33333...` lẻ mãi) vs. Tiền xu mệnh giá cố định (`Decimal`)',
          pythonEquivalent: '`float` (`0.1 + 0.2 != 0.3`) vs. `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")`',
          explanation: 'Máy tính dùng hệ nhị phân (cơ số 2) nên không biểu diễn chính xác tuyệt đối `0.1` trong kiểu `float`. Dùng `Decimal` để tính đúng từng đồng tiền!',
        },
        {
          realWorld: 'Vừa cân hành lý vừa đọc ngay số cân trên màn hình (`Walrus :=`)',
          pythonEquivalent: '`if (weight := get_bag_weight()) > 23:`',
          explanation: 'Tránh việc phải gọi hàm `get_bag_weight()` 2 lần hoặc phải khai báo biến ở dòng riêng phía trên `if`.',
        },
      ],
      mentalModelTip:
        'Trong VS Code hoặc PyCharm, phím `Tab` mặc định được cấu hình tự động chèn **4 dấu cách (Spaces)**. Tuyệt đối không trộn lẫn ký tự `Tab (\\t)` và `Space` trong cùng một file Python (sẽ gây lỗi `TabError`)!',
    },
    diagrams: [
      {
        id: 'diag-s0-operators-flow',
        title: 'Bản đồ Các Toán tử & Biểu thức Đặc trưng trong Python',
        subtitle: 'Những cú pháp giúp code Python ngắn gọn và sát với ngôn ngữ toán học tự nhiên nhất',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'op-math',
            badge: 'Toán tử Số học',
            title: 'Chia Thực (/) vs Chia Nguyên (//) & Lũy thừa (**)',
            subtitle: '7 / 2 -> 3.5 | 7 // 2 -> 3 | 2 ** 3 -> 8',
            detail:
              'Lưu ý: Python không có toán tử `i++` hay `--i`! Để tăng biến lên 1, luôn viết `i += 1`. Phép chia `//` luôn làm tròn xuống sàn (Floor division: `-7 // 2` ra `-4`).',
            highlightColor: 'sky',
          },
          {
            id: 'op-chain',
            badge: 'So sánh Bắc cầu',
            title: 'Chained Comparisons (Toán học tự nhiên)',
            subtitle: '0 <= x <= 100 • a == b == c',
            detail:
              'Thay vì phải viết `x >= 0 and x <= 100`, Python cho phép viết liền `0 <= x <= 100`. Biểu thức giữa `x` chỉ được tính toán đúng 1 lần duy nhất!',
            highlightColor: 'emerald',
          },
          {
            id: 'op-walrus-ternary',
            badge: 'Biểu thức Thu gọn',
            title: 'Ternary (if-else) & Walrus Operator (:=)',
            subtitle: '"VIP" if point > 100 else "Member" • (n := len(s))',
            detail:
              'Toán tử 3 ngôi đặt giá trị phổ biến lên đầu: `ket_qua_dung if dieu_kien else ket_qua_sai`. Toán tử `:=` vừa gán giá trị vào biến `n` vừa trả về chính giá trị đó cho biểu thức `if` hoặc `while`.',
            highlightColor: 'amber',
          },
        ],
        caption:
          'Toán tử logic trong Python dùng từ tiếng Anh rõ ràng `and`, `or`, `not` thay vì các ký hiệu `&&`, `||`, `!`.',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-fstring-speed',
        title: 'Minh chứng 3: Hiệu năng Nội suy Chuỗi (`f-string` vs `.format()` vs Cộng chuỗi `+`)',
        claim:
          '`f-string` (PEP 498) không chỉ dễ đọc nhất mà còn là cách tạo chuỗi nhanh nhất trong CPython vì được biên dịch thành opcode `FORMAT_VALUE` & `BUILD_STRING` riêng biệt.',
        methodology: 'Benchmark thực hiện 1.000.000 lần ghép biến vào chuỗi trên Python 3.12',
        metrics: [
          {
            label: 'Dùng `f-string`: `f"User {name} có {points} điểm"` (Chuẩn hiện đại)',
            valueText: '0.078 giây (Nhanh nhất)',
            barPercent: 25,
            isOptimal: true,
            note: 'Biên dịch trực tiếp thành Bytecode tối ưu cấp thấp, không tốn chi phí gọi phương thức.',
          },
          {
            label: 'Dùng toán tử `+` kèm `str()`: `"User " + name + " có " + str(points)`',
            valueText: '0.165 giây',
            barPercent: 55,
            note: 'Phải tạo nhiều đối tượng chuỗi trung gian trong RAM rồi hủy bỏ.',
          },
          {
            label: 'Dùng phương thức `.format()` cũ: `"User {} có {} điểm".format(name, points)`',
            valueText: '0.240 giây (Chậm gấp 3 lần f-string)',
            barPercent: 85,
            note: 'Phải tra cứu phương thức và phân tích chuỗi định dạng lúc Runtime.',
          },
        ],
        takeaway:
          'Luôn ưu tiên sử dụng `f-string` trong mọi trường hợp định dạng chuỗi (trừ khi viết template cho module `logging` cần lười đánh giá bằng `%s`).',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-3-syntax',
        title: 'Cú pháp Cốt lõi: Kiểu dữ liệu, Decimal tài chính, f-string nâng cao & Luồng điều khiển',
        description: 'Tổng hợp những viên gạch đầu tiên cần nắm vững trước khi bước vào cấu trúc dữ liệu.',
        code: `from decimal import Decimal

# 1. Số nguyên độ lớn vô hạn & Số thực chính xác tuyệt đối với Decimal
big_number: int = 2 ** 100  # Không bao giờ bị tràn số (Overflow)!
price_float = 0.1 + 0.2     # 0.30000000000000004 (Sai số nhị phân IEEE 754)
price_exact = Decimal("0.1") + Decimal("0.2")  # Decimal('0.3') -> Chính xác 100%!

# 2. Định dạng f-string chuyên nghiệp (Căn lề, phần nghìn, làm tròn, debug biến =)
product = "MacBook Pro"
cost = 45990000
tax_rate = 0.08
print(f"Sản phẩm: {product} | Giá: {cost:,.0f}đ | Thuế: {tax_rate:.1%}")
print(f"Debug nhanh tên và giá trị biến: {cost=}")

# 3. So sánh bắc cầu (Chained Comparison) + Toán tử 3 ngôi + Walrus (:=)
score = 8.6
if 8.0 <= score <= 10.0:
    rank = "Giỏi" if score < 9.0 else "Xuất sắc"
    print(f"Điểm {score} -> Xếp loại: {rank}")

items = ["Python", "FastAPI", "Pydantic", "SQLAlchemy"]
if (count := len(items)) >= 3:
    print(f"Danh sách có {count} công nghệ cốt lõi")`,
        output: `Sản phẩm: MacBook Pro | Giá: 45,990,000đ | Thuế: 8.0%\nDebug nhanh tên và giá trị biến: cost=45990000\nĐiểm 8.6 -> Xếp loại: Giỏi\nDanh sách có 4 công nghệ cốt lõi`,
        annotations: [
          { line: 6, explanation: 'Truyền chuỗi `"0.1"` vào `Decimal("0.1")` để tính toán tiền tệ, ngân hàng, hóa đơn chính xác tuyệt đối.' },
          { line: 12, explanation: 'Trong `f-string`, `:,.0f` tự động thêm dấu phẩy ngăn cách hàng nghìn; `:.1%` tự nhân 100 và gắn ký hiệu `%`.' },
          { line: 13, explanation: 'Cú pháp `f"{cost=}"` (từ Python 3.8+) tự động in cả tên biến lẫn giá trị `cost=45990000`, cực kỳ tiện khi debug!' },
          { line: 17, explanation: '`8.0 <= score <= 10.0` là cú pháp so sánh bắc cầu đặc sản của Python.' },
          { line: 22, explanation: 'Toán tử Walrus `(count := len(items))` vừa gán độ dài vào biến `count` vừa so sánh `>= 3` ngay trên 1 dòng.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Xử lý tính tiền đơn hàng, chiết khấu & thuế VAT trong E-commerce / Fintech',
        scenario: 'Cộng hàng nghìn dòng hóa đơn lẻ mà không được phép lệch dù chỉ 0.01 đồng.',
        whyPythonFits: 'Module chuẩn `decimal.Decimal` tích hợp sẵn của Python hỗ trợ đầy đủ các quy tắc làm tròn kế toán (`ROUND_HALF_UP`).',
      },
    ],
    tipsAndBestPractices: [
      'Không bao giờ so sánh hai số `float` trực tiếp bằng `a == b`. Hãy dùng `math.isclose(a, b)` hoặc chuyển sang `decimal.Decimal`.',
      'Tận dụng tính năng `f"{biến=}"` khi muốn in log kiểm tra nhanh giá trị của biến hoặc biểu thức.',
      'Trong vòng lặp `for` hoặc `while`, Python có nhánh `else:` đặc biệt: khối `else:` sau vòng lặp sẽ chạy khi vòng lặp kết thúc tự nhiên (KHÔNG bị ngắt giữa chừng bởi lệnh `break`).',
    ],
    commonIssues: [
      {
        id: 'issue-s0-float-precision',
        title: 'Bẫy Sai số Dấu phẩy động (0.1 + 0.2 != 0.3) khi kiểm tra điều kiện bằng',
        severity: 'warning',
        symptom: 'Biểu thức `if 0.1 + 0.2 == 0.3:` trả về `False` khiến logic thanh toán bị sai!',
        whyItHappens:
          'Số thập phân `0.1` khi đổi sang hệ nhị phân là phân số tuần hoàn vô hạn, nên khi lưu trong 64-bit IEEE 754 `float` sẽ có sai số cực nhỏ `0.30000000000000004`.',
        wrongCode: `balance = 0.1 + 0.2\nif balance == 0.3:\n    print("Đủ tiền")  # KHÔNG BAO GIỜ CHẠY VÀO ĐÂY!`,
        rightCode: `import math\nfrom decimal import Decimal\n\n# Cách 1: Dùng math.isclose cho tính toán khoa học\nif math.isclose(0.1 + 0.2, 0.3):\n    print("Đủ tiền (isclose)")\n\n# Cách 2: Dùng Decimal cho tiền tệ tài chính\nif Decimal("0.1") + Decimal("0.2") == Decimal("0.3"):\n    print("Đủ tiền (Decimal chính xác 100%)")`,
        fixExplanation: 'Sử dụng `math.isclose()` cho số thực đo đạc hoặc `decimal.Decimal` (truyền chuỗi vào constructor) cho dữ liệu tài chính.',
      },
    ],
    jsComparison: [
      {
        concept: 'Toán tử Logic, Chia nguyên & Biểu thức 3 ngôi (Ternary)',
        jsTsWay: '&&, ||, ! | Math.floor(7 / 2) | cond ? a : b',
        pythonWay: 'and, or, not | 7 // 2 | a if cond else b',
        jsCode: `const q = Math.floor(7 / 2);\nconst label = score >= 5 ? "Pass" : "Fail";`,
        pythonCode: `q = 7 // 2\nlabel = "Pass" if score >= 5 else "Fail"`,
        keyDifference: 'Python có sẵn toán tử chia lấy nguyên `//` và lũy thừa `**`, không cần gọi `Math.floor()` hay `Math.pow()`.',
      },
    ],
    externalReferences: [
      {
        title: 'PEP 8 — Style Guide for Python Code',
        url: 'https://peps.python.org/pep-0008/',
        sourceType: 'PEP Standard',
        description: 'Quy chuẩn trình bày mã nguồn chính thức của Python (thụt lề 4 spaces, quy tắc đặt tên, độ dài dòng).',
      },
      {
        title: 'Floating Point Arithmetic: Issues and Limitations (Python Docs)',
        url: 'https://docs.python.org/3/tutorial/floatingpoint.html',
        sourceType: 'Official Docs',
        description: 'Giải thích chính thức từ Python Docs về biểu diễn số thực IEEE 754 và cách dùng module decimal.',
      },
    ],
    relatedTermIds: ['kw-none', 'kw-is', 'fn-range', 'eco-uv'],
    relatedLessonIds: ['s0-versions-install-switch-run', 's1-env-memory', 's1-collections-slicing'],
    relatedExerciseIds: ['ex-s0-version-cli-check', 'ex-s1-mutable-trap'],
  },
];

import React, { useState } from 'react';
import {
  X,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Wrench,
  Code2,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Laptop,
  Monitor,
  Server,
  FolderGit2,
  Layers,
  Package,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { SampleProject } from '@/types/sample.types';
import { cn } from '@/utils/cn';

export interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleProject?: SampleProject;
}

type OsType = 'macos' | 'windows' | 'linux';
type GuideTab = 'uv-workflow' | 'non-uv-workflow' | 'ide' | 'troubleshoot' | 'project';
type NonUvStack = 'pyenv-venv-pip' | 'poetry' | 'pipenv';

const CopyCommandBlock: React.FC<{
  title: string;
  badge?: string;
  description?: string;
  code: string;
}> = ({ title, badge, description, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/70 px-3.5 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">
            {title}
          </span>
          {badge && (
            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Đã copy</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy lệnh</span>
            </>
          )}
        </button>
      </div>
      {description && (
        <div className="px-3.5 py-2 text-xs text-slate-400 border-b border-slate-800/50 bg-slate-900/40">
          {description}
        </div>
      )}
      <pre className="p-3.5 font-mono text-xs leading-relaxed text-emerald-300 overflow-x-auto select-text">
        {code}
      </pre>
    </div>
  );
};

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  sampleProject,
}) => {
  const { selectLesson } = useNavigationStore();
  const [selectedOs, setSelectedOs] = useState<OsType>('macos');
  const [activeTab, setActiveTab] = useState<GuideTab>(
    sampleProject ? 'project' : 'uv-workflow'
  );
  const [nonUvStack, setNonUvStack] = useState<NonUvStack>('pyenv-venv-pip');

  if (!isOpen) return null;

  const handleOpenLesson = (lessonId: string) => {
    selectLesson(lessonId);
    onClose();
  };

  const baseCmd = (
    sampleProject?.interactiveCommands[0]?.command || 'uv run python main.py'
  ).replace(/^uv run\s+/, '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden"
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  2 Phương pháp Quản lý Dự án Python Toàn diện (Dùng uv & Không dùng uv)
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  Version • Source Code • Dependency • Lockfile
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Chọn Phương pháp 1 (Quản lý trọn gói bằng uv) hoặc Phương pháp 2 (Quản lý bằng pyenv, venv/virtualenv, pip, Poetry, Pipenv)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenLesson('s0-install-setup-uv-pyenv-ide')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Mở Bài 1.0A: Quản lý Dự án bằng uv"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Bài 1.0A (uv)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenLesson('s0-workflow-pyenv-venv-poetry-pipenv')
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/15 border border-sky-500/40 px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition-colors cursor-pointer"
              title="Mở Bài 1.0B: Quản lý Dự án bằng pyenv / pip / Poetry / Pipenv"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Bài 1.0B (pyenv/Poetry/pip)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hướng dẫn"
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* OS Selector + Main Workflow Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 bg-slate-900/40 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {sampleProject && (
              <button
                type="button"
                onClick={() => setActiveTab('project')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                  activeTab === 'project'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                )}
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Chạy Dự án #{sampleProject.number} (2 Cách)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('uv-workflow')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'uv-workflow'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phương pháp 1: Quản lý Dự án bằng `uv`</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('non-uv-workflow')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'non-uv-workflow'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>
                Phương pháp 2: Không dùng `uv` (pyenv / venv / pip / Poetry / Pipenv)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ide')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'ide'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Cấu hình VS Code / Cursor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('troubleshoot')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'troubleshoot'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Sửa Lỗi Thường gặp</span>
            </button>
          </div>

          {/* OS Selector Pills */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 shrink-0">
            <span className="px-2 text-[11px] font-semibold text-slate-400">
              Hệ điều hành:
            </span>
            <button
              type="button"
              onClick={() => setSelectedOs('macos')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'macos'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>macOS</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOs('windows')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'windows'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Windows</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOs('linux')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'linux'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Linux / WSL2</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 0: SAMPLE PROJECT LOCAL RUN GUIDE (2 COMPLETE WAYS) */}
          {activeTab === 'project' && sampleProject && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Hướng dẫn Quản lý & Chạy Dự án #{sampleProject.number}:{' '}
                    {sampleProject.title} ({sampleProject.slug}/)
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Dưới đây là quy trình đầy đủ theo <strong>2 phương pháp độc lập</strong>{' '}
                  trên hệ điều hành <strong>{selectedOs.toUpperCase()}</strong> để bạn chọn theo đúng công cụ mình đang dùng:
                </p>
              </div>

              <CopyCommandBlock
                title={`Phương pháp 1: Quản lý & chạy dự án ${sampleProject.slug} bằng 'uv'`}
                badge="Phương pháp 1 • Dùng uv"
                description="Dành cho người dùng uv: Quản lý từ phiên bản Python, tạo .venv, cài dependency từ pyproject.toml đến chạy ứng dụng."
                code={
                  selectedOs === 'windows'
                    ? `# 1. Tạo thư mục dự án và ghim phiên bản Python 3.12 (PowerShell)
mkdir ${sampleProject.slug}
cd ${sampleProject.slug}
uv python install 3.12
uv python pin 3.12

# 2. Tạo các file theo cây thư mục mẫu, sau đó đồng bộ .venv & khóa uv.lock:
uv sync

# 3. Thêm thư viện mới (nếu cần) và chạy ứng dụng / kiểm thử:
# uv add <ten_thu_vien>
# uv add --dev pytest ruff
uv run ${baseCmd}
uv run pytest`
                    : `# 1. Tạo thư mục dự án và ghim phiên bản Python 3.12
mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug}
uv python install 3.12
uv python pin 3.12

# 2. Tạo các file theo cây thư mục mẫu, sau đó đồng bộ .venv & khóa uv.lock:
uv sync

# 3. Thêm thư viện mới (nếu cần) và chạy ứng dụng / kiểm thử:
# uv add <ten_thu_vien>
# uv add --dev pytest ruff
uv run ${baseCmd}
uv run pytest`
                }
              />

              <CopyCommandBlock
                title={`Phương pháp 2A: Quản lý & chạy dự án ${sampleProject.slug} bằng 'pyenv + venv/virtualenv + pip'`}
                badge="Phương pháp 2A • pyenv + venv + pip"
                description="Dành cho người không dùng uv, sử dụng bộ công cụ chuẩn pyenv + venv + pip:"
                code={
                  selectedOs === 'windows'
                    ? `# 1. Chọn phiên bản Python bằng pyenv-win và tạo môi trường ảo .venv
mkdir ${sampleProject.slug}
cd ${sampleProject.slug}
pyenv local 3.12.7
python -m venv .venv

# 2. Kích hoạt môi trường ảo (.venv) trên Windows PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\\Scripts\\Activate.ps1

# 3. Cài đặt source code dự án ở chế độ Editable (-e .) kèm thư viện:
python -m pip install --upgrade pip
pip install -e . pytest ruff

# 4. Chạy ứng dụng và kiểm thử trực tiếp trong (.venv):
${baseCmd}
pytest`
                    : `# 1. Chọn phiên bản Python bằng pyenv và tạo môi trường ảo .venv
mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug}
pyenv local 3.12.7
python3 -m venv .venv

# 2. Kích hoạt môi trường ảo (.venv) trên ${selectedOs === 'macos' ? 'macOS' : 'Linux'}:
source .venv/bin/activate

# 3. Cài đặt source code dự án ở chế độ Editable (-e .) kèm thư viện:
python -m pip install --upgrade pip
pip install -e . pytest ruff

# 4. Chạy ứng dụng và kiểm thử trực tiếp trong (.venv):
${baseCmd}
pytest`
                }
              />

              <CopyCommandBlock
                title={`Phương pháp 2B: Quản lý & chạy dự án ${sampleProject.slug} bằng 'Poetry' hoặc 'Pipenv'`}
                badge="Phương pháp 2B • Poetry / Pipenv"
                description="Nếu đội ngũ của bạn quản lý dự án bằng Poetry (poetry.lock) hoặc Pipenv (Pipfile.lock):"
                code={`# === NẾU DÙNG POETRY ===
cd ${sampleProject.slug}
poetry config virtualenvs.in-project true
poetry env use 3.12
poetry install
poetry run ${baseCmd}
poetry run pytest

# === NẾU DÙNG PIPENV ===
cd ${sampleProject.slug}
export PIPENV_VENV_IN_PROJECT=1
pipenv --python 3.12
pipenv install -e .
pipenv install --dev pytest ruff
pipenv run ${baseCmd}
pipenv run pytest`}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 1: COMPLETE WORKFLOW USING UV (PHƯƠNG PHÁP 1)                     */}
          {/* ===================================================================== */}
          {activeTab === 'uv-workflow' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Phương pháp 1 • Quy trình Khép kín 100% bằng `uv`
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Quản lý Version Python, Tổ chức Source Code, Dependency, Lockfile & Chạy Dự án bằng `uv`
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Khi chọn phương pháp này, bạn <strong>chỉ cần cài duy nhất công cụ `uv`</strong>. Toàn bộ 5 khâu trong vòng đời dự án (tải Python, chia cấu trúc source code, tạo <code>.venv</code>, cài/khóa thư viện <code>uv.lock</code>, chạy ứng dụng & đóng gói) đều thực hiện xuyên suốt bằng các lệnh của <code>uv</code> dưới đây:
                </p>
              </div>

              <CopyCommandBlock
                title={`Giai đoạn 1: Cài đặt 'uv' lên ${
                  selectedOs === 'macos'
                    ? 'macOS'
                    : selectedOs === 'windows'
                    ? 'Windows PowerShell'
                    : 'Linux / WSL2'
                }`}
                badge="Bước 1/5 • Cài đặt công cụ"
                code={
                  selectedOs === 'macos'
                    ? `# Cài đặt qua script chính thức (hoặc: brew install uv)
curl -LsSf https://astral.sh/uv/install.sh | sh
uv --version`
                    : selectedOs === 'windows'
                    ? `# Cài đặt trên PowerShell (hoặc: winget install --id=Astral-sh.uv -e)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
uv --version`
                    : `# Cài đặt trên Linux / WSL2
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
uv --version`
                }
              />

              <CopyCommandBlock
                title="Giai đoạn 2: Quản lý Phiên bản Python (Global toàn máy & Local từng dự án)"
                badge="Bước 2/5 • Version Management"
                description="Dùng 'uv python' để tải nhiều bản Python về máy, đặt bản mặc định toàn máy (Global) hoặc ghim riêng cho từng dự án (Local .python-version):"
                code={`# 1. Tải các phiên bản Python cần dùng về máy (không cần cài Python thủ công trước):
uv python install 3.10 3.12 3.13

# 2. Xem tất cả phiên bản Python hiện có trên máy:
uv python list

# 3. [GLOBAL] Đặt Python 3.12 làm bản mặc định toàn máy (khi đứng ngoài thư mục dự án):
uv python install 3.12 --default
uv python pin --global 3.12

# 4. [PER-PROJECT] Ghim phiên bản Python riêng cho thư mục dự án hiện tại (tạo file .python-version):
uv python pin 3.12          # Dự án hiện tại dùng 3.12
# uv python pin 3.10        # Nếu vào dự án cũ cần Python 3.10`}
              />

              <CopyCommandBlock
                title="Giai đoạn 3: Khởi tạo & Tổ chức Cấu trúc Source Code Dự án"
                badge="Bước 3/5 • Source Code Layout"
                description="Tùy theo loại dự án (Ứng dụng Web/Script, Thư viện/Package chuẩn src-layout, hay Monorepo nhiều dịch vụ) mà chọn cờ khởi tạo phù hợp:"
                code={`# 👉 KIỂU 1: Tạo dự án Ứng dụng (FastAPI, Web, CLI, Data Script) với '--app':
uv init --app my-api-service
cd my-api-service
# Cấu trúc sinh ra:
# my-api-service/
# ├── .python-version       (Ghim phiên bản Python)
# ├── pyproject.toml        (Khai báo metadata & dependencies)
# ├── README.md
# └── main.py

# 👉 KIỂU 2: Tạo dự án chuẩn Production / SDK (Cấu trúc src/ layout) với '--package':
uv init --package my-core-sdk
# Cấu trúc sinh ra (Khuyên dùng cho dự án nhiều file/module):
# my-core-sdk/
# ├── pyproject.toml
# └── src/
#     └── my_core_sdk/
#         └── __init__.py`}
              />

              <CopyCommandBlock
                title="Giai đoạn 4: Quản lý Môi trường ảo (.venv), Dependency Groups & Khóa uv.lock"
                badge="Bước 4/5 • Dependency & Lockfile"
                description="Cách thêm/xóa thư viện, phân nhóm thư viện (Production vs Dev/Test/Docs), khóa phiên bản và đồng bộ môi trường:"
                code={`# 1. Thêm thư viện chạy chính thức (Production dependencies -> ghi vào [project.dependencies]):
uv add fastapi "uvicorn[standard]" "pydantic>=2.9,<3.0"

# 2. Thêm thư viện chỉ dùng lúc phát triển/test (--dev -> ghi vào [dependency-groups.dev]):
uv add --dev pytest pytest-asyncio ruff mypy

# 3. Thêm nhóm phụ thuộc tùy chỉnh (ví dụ nhóm docs hoặc benchmark):
uv add --group docs mkdocs-material

# 4. Gỡ bỏ một thư viện khỏi dự án:
uv remove mypy

# 5. Xem sơ đồ cây phụ thuộc (gói nào kéo theo gói nào):
uv tree

# 6. Cập nhật file khóa uv.lock (nâng cấp 1 gói hoặc toàn bộ):
uv lock --upgrade-package fastapi

# 7. Đồng bộ môi trường khi git clone dự án về máy (hoặc trên Docker Production):
uv sync                     # Máy Dev: Cài cả gói chính + gói dev
uv sync --frozen --no-dev   # Server Production: Cài chính xác từ uv.lock, bỏ gói dev!

# 8. Xuất ra requirements.txt (nếu cần tương thích với hệ thống cũ):
uv export --format requirements-txt --no-hashes -o requirements.txt`}
              />

              <CopyCommandBlock
                title="Giai đoạn 5: Chạy Ứng dụng, Chạy Script Độc lập & Quản lý Công cụ CLI Global"
                badge="Bước 5/5 • Run, Scripts & Global Tools"
                code={`# 1. Chạy ứng dụng hoặc bộ test bên trong .venv của dự án (Không cần gõ lệnh activate!):
uv run python -m my_core_sdk.main
uv run uvicorn main:app --reload
uv run pytest -v

# 2. Chạy thử code với 1 phiên bản Python khác ngay lập tức:
uv run --python 3.13 pytest

# 3. Chạy 1 file script .py lẻ bên ngoài dự án cần thư viện riêng (Inline Script PEP 723):
uv add --script backup_db.py psycopg2-binary rich
uv run backup_db.py

# 4. Cài đặt hoặc chạy công cụ CLI toàn cục (Global CLI Tools):
uv tool install ruff        # Cài ruff dùng ở mọi nơi trên máy
uvx httpie https://httpbin.org/get   # Chạy 1 lần không cần cài (giống npx)

# 5. Đóng gói dự án thành file Wheel (.whl) và Source (.tar.gz) vào thư mục dist/:
uv build`}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: COMPLETE WORKFLOW WITHOUT UV (PHƯƠNG PHÁP 2)                  */}
          {/* ===================================================================== */}
          {activeTab === 'non-uv-workflow' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Phương pháp 2 • Dành cho Lập trình viên & Dự án KHÔNG dùng `uv`
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    Quản lý Dự án bằng `pyenv` kết hợp `venv / virtualenv + pip`, `Poetry` hoặc `Pipenv`
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Khi không dùng <code>uv</code>, bạn dùng <strong>pyenv</strong> để quản lý phiên bản Python (Global/Local), và chọn <strong>1 trong 3 bộ công cụ quản lý dự án & dependency</strong> dưới đây xuyên suốt dự án của mình:
                  </p>
                </div>

                {/* Sub-selector for the 3 Non-uv Project Management Stacks */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNonUvStack('pyenv-venv-pip')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'pyenv-venv-pip'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>
                      Cách 2A: pyenv + venv / virtualenv + pip (pip-tools)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNonUvStack('poetry')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'poetry'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>Cách 2B: pyenv + Poetry (pyproject.toml + poetry.lock)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNonUvStack('pipenv')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'pipenv'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Cách 2C: pyenv + Pipenv (Pipfile + Pipfile.lock)</span>
                  </button>
                </div>
              </div>

              {/* COMMON STEP 1 FOR ALL NON-UV STACKS: PYENV VERSION MANAGEMENT */}
              <CopyCommandBlock
                title={`Bước Nền tảng (Chung): Cài đặt & Quản lý Phiên bản Python bằng 'pyenv' (${selectedOs.toUpperCase()})`}
                badge="Quản lý Version Python • Global & Local"
                description="Dùng pyenv để cài đặt nhiều phiên bản Python, đặt bản mặc định toàn máy (pyenv global) và ghim bản riêng cho từng dự án (pyenv local):"
                code={
                  selectedOs === 'macos'
                    ? `# 1. Cài đặt pyenv qua Homebrew & cấu hình vào ~/.zshrc:
brew update && brew install pyenv pipx
pipx ensurepath
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc

# 2. Tải các phiên bản Python về máy:
pyenv install 3.10.15
pyenv install 3.12.7

# 3. Đặt bản mặc định toàn máy (GLOBAL) & ghim bản riêng cho dự án (LOCAL):
pyenv global 3.12.7                 # Mặc định toàn máy dùng 3.12.7
cd /duong/dan/du-an && pyenv local 3.12.7   # Tạo file .python-version trong dự án`
                    : selectedOs === 'windows'
                    ? `# 1. Cài đặt pyenv-win trên Windows PowerShell:
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"
&"./install-pyenv-win.ps1"

# 2. Tải phiên bản Python và đặt Global / Local cho dự án:
pyenv install 3.12.7
pyenv global 3.12.7                 # Mặc định toàn máy
cd C:\\du-an && pyenv local 3.12.7   # Tạo file .python-version cho dự án`
                    : `# 1. Cài đặt pyenv trên Ubuntu / Debian / Linux & cấu hình ~/.bashrc:
curl https://pyenv.run | bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

# 2. Tải phiên bản Python và đặt Global / Local cho dự án:
pyenv install 3.12.7
pyenv global 3.12.7                 # Mặc định toàn máy
cd /duong/dan/du-an && pyenv local 3.12.7   # Tạo file .python-version cho dự án`
                }
              />

              {/* STACK 2A: PYENV + VENV / VIRTUALENV + PIP + PIP-TOOLS */}
              {nonUvStack === 'pyenv-venv-pip' && (
                <div className="space-y-4">
                  <CopyCommandBlock
                    title="Cách 2A — Giai đoạn 1: Tổ chức Source Code & Tạo Môi trường ảo bằng 'venv' hoặc 'virtualenv'"
                    badge="venv / virtualenv"
                    description="Sau khi đã ghim phiên bản Python bằng 'pyenv local 3.12.7', tạo thư mục .venv ngay trong dự án và kích hoạt:"
                    code={
                      selectedOs === 'windows'
                        ? `# 1. Tạo cấu trúc thư mục dự án chuẩn:
mkdir my-service, my-service\\src, my-service\\src\\my_service, my-service\\tests
cd my-service
pyenv local 3.12.7

# 2. Tạo môi trường ảo '.venv' (Cách 1: dùng module venv có sẵn):
python -m venv .venv
# (Hoặc Cách 2: dùng công cụ 'virtualenv' nếu muốn nhanh hơn & chọn rõ bản Python):
# pip install virtualenv && virtualenv -p python3.12 .venv

# 3. BẮT BUỘC: Kích hoạt môi trường ảo (.venv) trước khi làm việc:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\\Scripts\\Activate.ps1
# -> Đầu dòng lệnh hiện (.venv) là đã vào trong môi trường của dự án!`
                        : `# 1. Tạo cấu trúc thư mục dự án chuẩn:
mkdir -p my-service/src/my_service my-service/tests && cd my-service
pyenv local 3.12.7

# 2. Tạo môi trường ảo '.venv' (Cách 1: dùng module venv có sẵn):
python -m venv .venv
# (Hoặc Cách 2: dùng công cụ 'virtualenv' nếu muốn nhanh hơn & chọn rõ bản Python):
# pipx install virtualenv && virtualenv -p python3.12 .venv

# 3. BẮT BUỘC: Kích hoạt môi trường ảo (.venv) trước khi làm việc:
source .venv/bin/activate
# -> Đầu dòng lệnh hiện (.venv) là đã vào trong môi trường của dự án!`
                    }
                  />

                  <CopyCommandBlock
                    title="Cách 2A — Giai đoạn 2: Quản lý Dependency & Lockfile bằng 'pip' và 'pip-tools'"
                    badge="requirements.in → requirements.txt"
                    description="Cách quản lý phụ thuộc chuyên nghiệp bằng pip: tách file khai báo (requirements.in) và file khóa (requirements.txt) bằng pip-tools:"
                    code={`# 1. Nâng cấp pip và cài đặt pip-tools bên trong (.venv):
(.venv) $ python -m pip install --upgrade pip setuptools wheel pip-tools

# 2. Tạo file 'requirements.in' (chỉ ghi các thư viện chính của ứng dụng):
#   fastapi>=0.115.0
#   uvicorn[standard]>=0.30.0
#   sqlalchemy>=2.0.0

# 3. Tạo file 'requirements-dev.in' (ghi các công cụ test, format, lint):
#   -c requirements.txt
#   pytest>=8.3.0
#   ruff>=0.7.0

# 4. Biên dịch ra file khóa 'requirements.txt' và 'requirements-dev.txt' (cố định mọi phiên bản ==):
(.venv) $ pip-compile requirements.in -o requirements.txt
(.venv) $ pip-compile requirements-dev.in -o requirements-dev.txt

# 5. Cài đặt & đồng bộ chính xác môi trường theo file khóa (tự động gỡ các gói thừa!):
(.venv) $ pip-sync requirements.txt requirements-dev.txt
# (Hoặc cách cơ bản nếu không dùng pip-tools: pip install -r requirements.txt)

# 6. Cài đặt chính source code của dự án ở chế độ Editable (-e .) để import không bị lỗi:
(.venv) $ pip install -e .

# 7. Chạy ứng dụng, chạy kiểm thử và thoát môi trường ảo khi xong việc:
(.venv) $ python -m my_service.main
(.venv) $ pytest
(.venv) $ deactivate`}
                  />
                </div>
              )}

              {/* STACK 2B: PYENV + POETRY */}
              {nonUvStack === 'poetry' && (
                <div className="space-y-4">
                  <CopyCommandBlock
                    title="Cách 2B — Giai đoạn 1: Cài đặt Poetry, Cấu hình .venv & Khởi tạo Source Code"
                    badge="Poetry Setup & Init"
                    description="Poetry quản lý trọn gói pyproject.toml, tạo .venv, khóa poetry.lock và đóng gói thư viện:"
                    code={`# 1. Cài đặt Poetry độc lập qua pipx (khuyên dùng) hoặc official installer:
pipx install poetry
# (Hoặc: curl -sSL https://install.python-poetry.org | python3 -)

# 2. CẤU HÌNH QUAN TRỌNG NHẤT: Bảo Poetry tạo thư mục '.venv/' ngay trong thư mục dự án:
poetry config virtualenvs.in-project true

# 3. Khởi tạo dự án mới với cấu trúc chuẩn 'src/' layout:
poetry new --src my-poetry-service
cd my-poetry-service
# (Hoặc nếu thư mục dự án đã có sẵn code: chạy 'poetry init')

# 4. Liên kết Poetry với phiên bản Python (đã cài qua pyenv):
pyenv local 3.12.7
poetry env use 3.12
poetry env info`}
                  />

                  <CopyCommandBlock
                    title="Cách 2B — Giai đoạn 2: Quản lý Dependency, Khóa poetry.lock & Chạy Dự án với Poetry"
                    badge="poetry add / install / run"
                    code={`# 1. Thêm thư viện chính thức (Production dependencies):
poetry add fastapi "uvicorn[standard]" pydantic

# 2. Thêm thư viện vào nhóm phát triển (Dev / Test / Lint group):
poetry add --group dev pytest pytest-cov ruff mypy

# 3. Gỡ bỏ thư viện và xem cây phụ thuộc:
poetry remove mypy
poetry show --tree

# 4. Khóa phiên bản vào file 'poetry.lock' và cài đặt đồng bộ:
poetry lock
poetry install                              # Cài đặt đầy đủ trên máy Dev
poetry install --without dev --no-root      # Cài đặt tối giản trên Docker / Server Production

# 5. Chạy ứng dụng & bộ kiểm thử bên trong môi trường của Poetry:
poetry run python -m my_poetry_service.main
poetry run uvicorn my_poetry_service.main:app --reload
poetry run pytest

# 6. Mở trực tiếp Shell đã kích hoạt .venv hoặc Đóng gói thư viện (.whl):
poetry shell
poetry build`}
                  />
                </div>
              )}

              {/* STACK 2C: PYENV + PIPENV */}
              {nonUvStack === 'pipenv' && (
                <div className="space-y-4">
                  <CopyCommandBlock
                    title="Cách 2C — Toàn bộ Quy trình Quản lý Dự án bằng 'Pipenv' (Pipfile & Pipfile.lock)"
                    badge="Pipenv Workflow"
                    description="Pipenv thay thế requirements.txt bằng Pipfile và Pipfile.lock, tự động quản lý virtualenv cho dự án:"
                    code={`# 1. Cài đặt Pipenv qua pipx và bật chế độ tạo '.venv/' ngay trong thư mục dự án:
pipx install pipenv
export PIPENV_VENV_IN_PROJECT=1
# (Trên Windows PowerShell: $env:PIPENV_VENV_IN_PROJECT="1")

# 2. Khởi tạo dự án với phiên bản Python 3.12:
mkdir my-django-app && cd my-django-app
pyenv local 3.12.7
pipenv --python 3.12

# 3. Cài đặt thư viện chính (ghi vào mục [packages] trong Pipfile):
pipenv install django gunicorn psycopg2-binary

# 4. Cài đặt thư viện phát triển (ghi vào mục [dev-packages] trong Pipfile):
pipenv install --dev pytest pytest-django ruff

# 5. Khóa phiên bản an toàn vào 'Pipfile.lock' & kiểm tra cây phụ thuộc:
pipenv lock
pipenv graph

# 6. Đồng bộ môi trường từ file khóa Pipfile.lock (Khi clone dự án về hoặc trên Server):
pipenv sync --dev           # Trên máy Dev (cài cả gói chính + gói dev)
pipenv sync                 # Trên Server Production (chỉ cài gói chính từ Pipfile.lock)

# 7. Chạy ứng dụng hoặc mở Shell của Pipenv:
pipenv run python manage.py runserver
pipenv run pytest
pipenv shell`}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VS CODE / CURSOR SETUP */}
          {activeTab === 'ide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Bước quan trọng số 1 (Mọi công cụ đều giống nhau)
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-white">
                    Chọn đúng Python Interpreter (.venv)
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    Dù bạn tạo <code>.venv</code> bằng <code>uv</code>,{' '}
                    <code>python -m venv</code>, <code>Poetry</code> hay{' '}
                    <code>Pipenv</code>, trong VS Code / Cursor hãy bấm{' '}
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-emerald-300 border border-slate-700">
                      {selectedOs === 'macos'
                        ? 'Cmd + Shift + P'
                        : 'Ctrl + Shift + P'}
                    </kbd>{' '}
                    → Gõ{' '}
                    <code className="text-sky-300 font-mono">
                      Python: Select Interpreter
                    </code>{' '}
                    → Chọn{' '}
                    <code className="text-emerald-300 font-mono">
                      {selectedOs === 'windows'
                        ? '.venv\\Scripts\\python.exe'
                        : './.venv/bin/python'}
                    </code>
                    .
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Bước quan trọng số 2
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-white">
                    Bộ 4 Extensions Bắt buộc
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                    <li>
                      • <strong className="text-white">Python</strong>{' '}
                      (<code>ms-python.python</code>) — Chạy & Debug
                    </li>
                    <li>
                      • <strong className="text-white">Pylance</strong>{' '}
                      (<code>ms-python.vscode-pylance</code>) — Gợi ý code & Kiểu
                    </li>
                    <li>
                      • <strong className="text-white">Ruff</strong>{' '}
                      (<code>charliermarsh.ruff</code>) — Format & Lint siêu tốc
                    </li>
                    <li>
                      • <strong className="text-white">Even Better TOML</strong>{' '}
                      (<code>tamasfe.even-better-toml</code>) — Đọc pyproject.toml
                    </li>
                  </ul>
                </div>
              </div>

              <CopyCommandBlock
                title="Lệnh cài nhanh bộ 4 Extensions cho VS Code (hoặc thay 'code' bằng 'cursor')"
                badge="Terminal 1 chạm"
                code={`code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension charliermarsh.ruff
code --install-extension tamasfe.even-better-toml`}
              />

              <CopyCommandBlock
                title="File mẫu '.vscode/settings.json' chuẩn Senior (Format on Save + Type Checking)"
                badge=".vscode/settings.json"
                code={`{
  "python.defaultInterpreterPath": "${
    selectedOs === 'windows'
      ? '${workspaceFolder}\\\\.venv\\\\Scripts\\\\python.exe'
      : '${workspaceFolder}/.venv/bin/python'
  }",
  "python.terminal.activateEnvironment": true,
  "python.analysis.typeCheckingMode": "standard",
  "python.analysis.autoImportCompletions": true,
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  }
}`}
              />
            </div>
          )}

          {/* TAB 4: TROUBLESHOOTING FOR BEGINNERS */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3.5">
              {[
                {
                  title:
                    '1. Lỗi "error: externally-managed-environment" khi gõ pip install trên macOS / Ubuntu',
                  cause:
                    'Bạn đang gõ pip install trực tiếp vào Python của hệ điều hành mà chưa tạo hoặc chưa kích hoạt môi trường ảo .venv.',
                  fix: 'Nếu dùng uv: chạy `uv add <tên_gói>`. Nếu không dùng uv: chạy `python3 -m venv .venv && source .venv/bin/activate && pip install <tên_gói>` (hoặc `poetry add` / `pipenv install`).',
                },
                {
                  title:
                    '2. Poetry hoặc Pipenv tạo môi trường ảo ở đâu đó ngoài dự án khiến VS Code không thấy thư mục .venv',
                  cause:
                    'Mặc định Poetry và Pipenv lưu virtualenv tập trung trong thư mục Cache của hệ điều hành.',
                  fix: 'Với Poetry: chạy `poetry config virtualenvs.in-project true`. Với Pipenv: đặt biến môi trường `export PIPENV_VENV_IN_PROJECT=1` trước khi chạy `pipenv install`.',
                },
                {
                  title:
                    '3. Lỗi đỏ "Activate.ps1 cannot be loaded because running scripts is disabled" trên Windows PowerShell',
                  cause:
                    'Mặc định Windows PowerShell chặn chạy các file script .ps1 của người dùng.',
                  fix: 'Mở PowerShell và chạy lệnh: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`. Hoặc dùng `uv run` / `poetry run` / `pipenv run` để không cần gọi Activate.ps1.',
                },
                {
                  title:
                    '4. Cài pyenv xong, đã chạy pyenv global 3.12.7 nhưng gõ python --version vẫn ra bản cũ',
                  cause:
                    'Bạn chưa thêm thư mục shims của pyenv vào biến môi trường PATH trong file cấu hình Shell (`~/.zshrc` trên macOS hoặc `~/.bashrc` trên Linux).',
                  fix: 'Chạy 3 lệnh cấu hình `PYENV_ROOT`, `PATH` và `eval "$(pyenv init -)"` rồi chạy `source ~/.zshrc`.',
                },
                {
                  title:
                    '5. Lỗi "ModuleNotFoundError: No module named ..." khi chạy file nằm trong thư mục src/',
                  cause:
                    'Project chưa được cài đặt ở chế độ Editable vào trong `.venv`, hoặc bạn đang chạy trực tiếp đường dẫn file con thay vì chạy từ gốc dự án.',
                  fix: 'Cài đặt package nội bộ vào `.venv` bằng `uv sync` / `pip install -e .` / `poetry install` và chạy qua cờ `-m` (ví dụ `python -m ten_package.main`).',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Nguyên nhân:</strong>{' '}
                    {item.cause}
                  </p>
                  <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 font-mono">
                    <strong>Cách khắc phục:</strong> {item.fix}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

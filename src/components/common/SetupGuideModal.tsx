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
  Globe,
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
type GuideTab = 'uv' | 'pyenv' | 'global-vs-local' | 'ide' | 'troubleshoot' | 'project';

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
    sampleProject ? 'project' : 'uv'
  );

  if (!isOpen) return null;

  const handleOpenFullLesson = () => {
    selectLesson('s0-install-setup-uv-pyenv-ide');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden"
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
                  Cẩm nang Cài đặt Python, uv / pyenv, .venv & Cấu hình IDE
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  Dành cho Người mới Bắt đầu
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Hướng dẫn từng bước từ máy trắng tinh đến khi tạo dự án, quản lý phiên bản Python và chạy code thực tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenFullLesson}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Đọc Bài 1.0 Chi tiết</span>
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

        {/* OS Selector + Guide Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 bg-slate-900/40 px-4 py-2.5 sm:px-6">
          {/* Guide Section Tabs */}
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
                <span>Chạy Dự án #{sampleProject.number} trên Máy thật</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('uv')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'uv'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>1. Cách Hiện đại: uv (Khuyên dùng)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pyenv')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'pyenv'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>2. Cách Truyền thống: pyenv + venv + pip</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('global-vs-local')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeTab === 'global-vs-local'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>3. Global vs. Từng Dự án</span>
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
              <span>4. Cấu hình VS Code / Cursor</span>
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
              <span>5. Sửa Lỗi Thường gặp</span>
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
          {/* TAB 0: SAMPLE PROJECT LOCAL RUN GUIDE */}
          {activeTab === 'project' && sampleProject && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Hướng dẫn dựng & chạy Dự án #{sampleProject.number}:{' '}
                    {sampleProject.title} trên máy của bạn
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Dự án này gồm <strong>{sampleProject.files.length} file</strong>{' '}
                  trong thư mục gốc{' '}
                  <code className="text-emerald-300 font-mono">
                    {sampleProject.slug}/
                  </code>
                  . Bạn có thể tạo nhanh cấu trúc thư mục và chạy ngay bằng{' '}
                  <strong>uv</strong> (Cách A) hoặc <strong>venv + pip</strong>{' '}
                  (Cách B) theo hệ điều hành <strong>{selectedOs.toUpperCase()}</strong>:
                </p>
              </div>

              <CopyCommandBlock
                title={`Cách A (Khuyên dùng): Dựng & chạy ${sampleProject.slug} bằng công cụ 'uv'`}
                badge="Siêu tốc • Tự động cài Python & .venv"
                description="uv sẽ tự động tải Python 3.12 (nếu máy chưa có), tạo thư mục .venv và chạy ứng dụng chuẩn xác."
                code={
                  selectedOs === 'windows'
                    ? `# 1. Tạo thư mục dự án và di chuyển vào trong (PowerShell)
mkdir ${sampleProject.slug}
cd ${sampleProject.slug}

# 2. Khởi tạo môi trường Python 3.12 và tạo .venv
uv python install 3.12
uv python pin 3.12
uv venv

# 3. Tạo các file theo cây thư mục bên trái (bấm nút 'Copy file' ở từng tab để dán nội dung)
# Sau đó đồng bộ thư viện từ pyproject.toml và chạy lệnh:
uv sync
${sampleProject.interactiveCommands[0]?.command || 'uv run python main.py'}`
                    : `# 1. Tạo thư mục dự án và di chuyển vào trong
mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug}

# 2. Khởi tạo môi trường Python 3.12 và tạo .venv
uv python install 3.12
uv python pin 3.12
uv venv

# 3. Tạo các file theo cây thư mục bên trái (bấm nút 'Copy file' ở từng tab để dán nội dung)
# Sau đó đồng bộ thư viện từ pyproject.toml và chạy lệnh:
uv sync
${sampleProject.interactiveCommands[0]?.command || 'uv run python main.py'}`
                }
              />

              <CopyCommandBlock
                title={`Cách B (Truyền thống): Dựng & chạy bằng 'pyenv / python -m venv' + 'pip'`}
                badge="Chuẩn truyền thống"
                code={
                  selectedOs === 'windows'
                    ? `# 1. Tạo và kích hoạt môi trường ảo .venv trên Windows PowerShell
mkdir ${sampleProject.slug}
cd ${sampleProject.slug}
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\\Scripts\\Activate.ps1

# 2. Cài đặt gói phụ thuộc ở chế độ Editable (đọc từ pyproject.toml)
python -m pip install --upgrade pip
pip install -e . pytest ruff

# 3. Chạy ứng dụng hoặc chạy kiểm thử
${(sampleProject.interactiveCommands[0]?.command || 'python main.py').replace(/^uv run\s+/, '')}`
                    : `# 1. Tạo và kích hoạt môi trường ảo .venv trên ${selectedOs === 'macos' ? 'macOS' : 'Linux'}
mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug}
python3 -m venv .venv
source .venv/bin/activate

# 2. Cài đặt gói phụ thuộc ở chế độ Editable (đọc từ pyproject.toml)
python -m pip install --upgrade pip
pip install -e . pytest ruff

# 3. Chạy ứng dụng hoặc chạy kiểm thử
${(sampleProject.interactiveCommands[0]?.command || 'python main.py').replace(/^uv run\s+/, '')}`
                }
              />
            </div>
          )}

          {/* TAB 1: MODERN UV WORKFLOW */}
          {activeTab === 'uv' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <h3 className="text-sm font-bold text-emerald-300">
                  Tại sao người mới nên dùng `uv` ngay từ ngày đầu tiên?
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Trước đây, bạn phải cài riêng <strong>pyenv</strong> (để cài Python),{' '}
                  <strong>venv</strong> (để tạo môi trường ảo), <strong>pip</strong> (để cài thư viện) và{' '}
                  <strong>poetry</strong> (để khóa file lock). Ngày nay, công cụ{' '}
                  <strong className="text-emerald-300">uv</strong> (viết bằng Rust) gộp tất cả vào{' '}
                  <strong>1 công cụ duy nhất</strong> — kể cả khi máy bạn chưa hề cài Python,{' '}
                  <code>uv</code> cũng tự tải Python về cho bạn trong 2 giây!
                </p>
              </div>

              <CopyCommandBlock
                title={`Bước 1: Cài đặt 'uv' lên ${
                  selectedOs === 'macos'
                    ? 'macOS (Terminal)'
                    : selectedOs === 'windows'
                    ? 'Windows (PowerShell)'
                    : 'Linux / WSL2'
                }`}
                badge="Chỉ làm 1 lần duy nhất"
                description="Mở ứng dụng Terminal (macOS/Linux) hoặc PowerShell (Windows), copy và chạy lệnh dưới đây:"
                code={
                  selectedOs === 'macos'
                    ? `# Cách 1: Cài bằng script chính thức của Astral (Không cần quyền sudo)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Cách 2: Hoặc cài qua Homebrew (nếu máy Mac đã có brew)
brew install uv

# Kiểm tra phiên bản sau khi cài xong:
uv --version`
                    : selectedOs === 'windows'
                    ? `# Cách 1: Chạy trực tiếp trên Windows PowerShell (Không cần quyền Admin)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Cách 2: Hoặc cài qua WinGet (có sẵn trên Windows 10/11)
winget install --id=Astral-sh.uv -e

# Tắt mở lại PowerShell rồi kiểm tra:
uv --version`
                    : `# Cài đặt trực tiếp trên Ubuntu / Debian / Fedora / Arch / WSL2:
curl -LsSf https://astral.sh/uv/install.sh | sh

# Nạp lại PATH cho phiên làm việc hiện tại và kiểm tra:
source $HOME/.local/bin/env
uv --version`
                }
              />

              <CopyCommandBlock
                title="Bước 2: Dùng 'uv' cài đặt Python 3.12 / 3.13 & Chuyển đổi Phiên bản"
                badge="Thay thế hoàn toàn pyenv"
                description="Bạn có thể cài song song nhiều phiên bản Python (3.10, 3.12, 3.13) mà không bao giờ sợ xung đột với hệ điều hành."
                code={`# 1. Tải và cài đặt Python 3.12 (bản chuẩn ổn định nhất) và 3.13:
uv python install 3.12 3.13

# 2. Xem danh sách các phiên bản Python đang có trên máy:
uv python list

# 3. Ghim (Switch) phiên bản Python cho thư mục dự án hiện tại (tạo file .python-version):
uv python pin 3.12

# 4. Kiểm tra phiên bản Python đang hoạt động:
uv run python --version`}
              />

              <CopyCommandBlock
                title="Bước 3: Khởi tạo Dự án mới, tạo .venv, cài Thư viện & Chạy Code"
                badge="Quy trình chuẩn hàng ngày"
                description="Tương đương với 'npm init', 'npm install' và 'npm run' bên Node.js:"
                code={`# 1. Tạo dự án mới tên là 'hello-python' và đi vào thư mục:
uv init hello-python
cd hello-python

# 2. Cài đặt thư viện (uv tự động tạo thư mục .venv/ và khóa phiên bản vào uv.lock):
uv add requests rich fastapi
uv add --dev pytest ruff

# 3. Chạy file code Python (uv tự động dùng môi trường .venv của dự án):
uv run python main.py

# 4. Chạy bộ kiểm thử pytest hoặc kiểm tra code với ruff:
uv run pytest
uv run ruff check .`}
              />
            </div>
          )}

          {/* TAB 2: CLASSIC PYENV + VENV + PIP */}
          {activeTab === 'pyenv' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                <h3 className="text-sm font-bold text-sky-300">
                  Khi nào dùng bộ công cụ truyền thống `pyenv` + `venv` + `pip`?
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Nhiều dự án lâu năm ở các công ty hoặc tài liệu hướng dẫn trên mạng sử dụng{' '}
                  <strong>pyenv</strong> để cài phiên bản Python, kết hợp module có sẵn{' '}
                  <code>python -m venv .venv</code> để tạo môi trường ảo và{' '}
                  <code>pip install -r requirements.txt</code> để cài thư viện. Dưới đây là từng bước chuẩn xác nhất:
                </p>
              </div>

              <CopyCommandBlock
                title={`Bước 1: Cài đặt & Cấu hình Shell cho 'pyenv' trên ${
                  selectedOs === 'macos'
                    ? 'macOS (Zsh)'
                    : selectedOs === 'windows'
                    ? 'Windows (pyenv-win)'
                    : 'Ubuntu / Linux (Bash)'
                }`}
                badge="Lưu ý cấu hình PATH"
                description="90% người mới cài pyenv xong nhưng gõ 'python --version' không đổi là do quên bước nạp pyenv init vào Shell!"
                code={
                  selectedOs === 'macos'
                    ? `# 1. Cài đặt pyenv qua Homebrew:
brew update && brew install pyenv

# 2. BẮT BUỘC: Thêm cấu hình pyenv vào file ~/.zshrc để Terminal nhận diện:
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

# 3. Áp dụng cấu hình ngay lập tức:
source ~/.zshrc`
                    : selectedOs === 'windows'
                    ? `# 1. Cài đặt pyenv-win trên Windows PowerShell:
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"
&"./install-pyenv-win.ps1"

# 2. Tắt và mở lại cửa sổ PowerShell, sau đó kiểm tra:
pyenv --version`
                    : `# 1. Cài các gói thư viện biên dịch cần thiết (Ubuntu/Debian) và cài pyenv:
sudo apt update && sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl git libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
curl https://pyenv.run | bash

# 2. Thêm cấu hình vào ~/.bashrc:
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc`
                }
              />

              <CopyCommandBlock
                title="Bước 2: Tải Python bằng 'pyenv' và thiết lập phiên bản Global / Local"
                badge="Quản lý đa phiên bản"
                code={`# 1. Tải phiên bản Python 3.12.7 về máy:
pyenv install 3.12.7

# 2. Đặt Python 3.12.7 làm bản mặc định cho toàn máy tính:
pyenv global 3.12.7

# 3. Hoặc ghim phiên bản riêng cho thư mục dự án hiện tại (tạo file .python-version):
pyenv local 3.12.7

# 4. Kiểm tra danh sách các bản Python đã cài:
pyenv versions
python --version`}
              />

              <CopyCommandBlock
                title={`Bước 3: Tạo Môi trường ảo '.venv', Kích hoạt (Activate) & Cài gói bằng 'pip'`}
                badge={
                  selectedOs === 'windows'
                    ? 'Lệnh chuẩn Windows'
                    : 'Lệnh chuẩn macOS / Linux'
                }
                description="Luôn kích hoạt .venv (để đầu dòng lệnh hiện chữ (.venv)) trước khi gõ pip install!"
                code={
                  selectedOs === 'windows'
                    ? `# 1. Tạo thư mục môi trường ảo '.venv' trong thư mục dự án:
python -m venv .venv

# 2. Cấp quyền chạy script (chỉ cần chạy 1 lần trên Windows) & Kích hoạt .venv:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\\Scripts\\Activate.ps1

# 3. Khi thấy chữ (.venv) ở đầu dòng, nâng cấp pip và cài thư viện:
python -m pip install --upgrade pip
pip install requests fastapi uvicorn

# 4. Lưu danh sách thư viện ra file requirements.txt (hoặc cài từ file có sẵn):
pip freeze > requirements.txt
pip install -r requirements.txt

# 5. Khi muốn thoát khỏi môi trường ảo:
deactivate`
                    : `# 1. Tạo thư mục môi trường ảo '.venv' trong thư mục dự án:
python -m venv .venv

# 2. Kích hoạt (Activate) môi trường ảo:
source .venv/bin/activate

# 3. Khi thấy chữ (.venv) ở đầu dòng, nâng cấp pip và cài thư viện:
python -m pip install --upgrade pip
pip install requests fastapi uvicorn

# 4. Lưu danh sách thư viện ra file requirements.txt (hoặc cài từ file có sẵn):
pip freeze > requirements.txt
pip install -r requirements.txt

# 5. Khi muốn thoát khỏi môi trường ảo:
deactivate`
                }
              />
            </div>
          )}

          {/* TAB 2.5: GLOBAL VS PER-PROJECT (LOCAL) WORKFLOW */}
          {activeTab === 'global-vs-local' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <h3 className="text-sm font-bold text-emerald-300">
                  Nguyên tắc Vàng phân định Global (Toàn máy) vs. Local (Từng Dự án)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trong Python, bạn cần tách bạch rõ <strong>2 thứ</strong>:{' '}
                  <strong>(1) Phiên bản trình thông dịch Python</strong> (3.10, 3.11, 3.12, 3.13) và{' '}
                  <strong>(2) Các gói thư viện / công cụ</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                    <div className="text-xs font-bold text-sky-300">
                      🌐 Khi nào dùng GLOBAL (Toàn máy)?
                    </div>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                      <li>
                        • Đặt 1 <strong>phiên bản Python mặc định</strong> (VD: Python 3.12) để khi gõ <code>python</code> ở ngoài thư mục dự án (như Desktop) vẫn chạy được.
                      </li>
                      <li>
                        • Cài các <strong>công cụ dòng lệnh độc lập (CLI Tools)</strong> như <code>ruff</code>, <code>httpie</code>, <code>yt-dlp</code>, <code>poetry</code> bằng <code>uv tool install</code> (hoặc <code>pipx</code>).
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                    <div className="text-xs font-bold text-emerald-300">
                      📁 Khi nào dùng LOCAL (Cho từng Dự án)?
                    </div>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                      <li>
                        • Khi <strong>Dự án A cần Python 3.10</strong> nhưng <strong>Dự án B cần Python 3.12</strong>: ghim vào file <code>.python-version</code> ở gốc từng dự án!
                      </li>
                      <li>
                        • <strong>100% thư viện code</strong> (<code>fastapi</code>, <code>pandas</code>, <code>sqlalchemy</code>, <code>pytest</code>) <strong>BẮT BUỘC cài vào <code>.venv/</code> riêng của từng dự án</strong>.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Comparison Table: uv vs pyenv */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300">
                      <th className="py-2.5 px-3.5 font-bold">Mục đích sử dụng</th>
                      <th className="py-2.5 px-3.5 font-bold text-emerald-400">
                        Với `uv` (Hiện đại - Khuyên dùng)
                      </th>
                      <th className="py-2.5 px-3.5 font-bold text-sky-400">
                        Với `pyenv` + `venv` + `pip` (Truyền thống)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">
                        1. Đặt Python mặc định toàn máy (Global)
                      </td>
                      <td className="py-2.5 px-3.5 text-emerald-300">
                        uv python install 3.12 --default
                        <br />
                        uv python pin --global 3.12
                      </td>
                      <td className="py-2.5 px-3.5 text-sky-300">
                        pyenv install 3.12.7
                        <br />
                        pyenv global 3.12.7
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">
                        2. Ghim Python riêng cho 1 Dự án (Local .python-version)
                      </td>
                      <td className="py-2.5 px-3.5 text-emerald-300">
                        cd my-project
                        <br />
                        uv python pin 3.10
                      </td>
                      <td className="py-2.5 px-3.5 text-sky-300">
                        cd my-project
                        <br />
                        pyenv local 3.10.15
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">
                        3. Chạy thử 1 lần với bản Python khác (Tạm thời)
                      </td>
                      <td className="py-2.5 px-3.5 text-emerald-300">
                        uv run --python 3.13 main.py
                      </td>
                      <td className="py-2.5 px-3.5 text-sky-300">
                        pyenv shell 3.13.0 && python main.py
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">
                        4. Cài thư viện cho Dự án (Vào .venv của dự án)
                      </td>
                      <td className="py-2.5 px-3.5 text-emerald-300">
                        uv add fastapi pydantic
                        <br />
                        uv add --dev pytest
                      </td>
                      <td className="py-2.5 px-3.5 text-sky-300">
                        python -m venv .venv && source .venv/bin/activate
                        <br />
                        pip install fastapi pydantic pytest
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">
                        5. Cài CLI Tool dùng mọi nơi trên máy (Global Tool)
                      </td>
                      <td className="py-2.5 px-3.5 text-emerald-300">
                        uv tool install ruff
                        <br />
                        uvx ruff check .
                      </td>
                      <td className="py-2.5 px-3.5 text-sky-300">
                        pipx install ruff
                        <br />
                        pipx run ruff check .
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CopyCommandBlock
                title="Kịch bản thực tế 1: Dùng 'uv' quản lý Global vs. Nhiều Dự án khác phiên bản Python"
                badge="uv Global + Per-Project"
                description="Xem cách máy bạn mặc định chạy Python 3.12, nhưng tự động chuyển sang Python 3.10 khi vào dự án AI cũ:"
                code={`# 1. [GLOBAL] Đặt Python 3.12 làm bản mặc định cho toàn máy tính:
uv python install 3.10 3.12 3.13
uv python install 3.12 --default
uv python pin --global 3.12

# Kiểm tra ở thư mục bất kỳ ngoài dự án (ví dụ ~/Desktop):
python --version
# -> Python 3.12.x (Bản Global)

# =====================================================================
# 2. [PER-PROJECT] Dự án A (Legacy AI) bắt buộc phải dùng Python 3.10:
# =====================================================================
mkdir legacy-ai-app && cd legacy-ai-app
uv init
uv python pin 3.10          # Tạo file .python-version ghi '3.10' trong thư mục này
uv add numpy                # Tự động tạo .venv bằng Python 3.10 và cài numpy!
uv run python --version     # -> Python 3.10.x (Chỉ áp dụng cho legacy-ai-app)

# =====================================================================
# 3. [PER-PROJECT] Dự án B (Backend Mới) dùng Python 3.12:
# =====================================================================
cd .. && mkdir modern-api && cd modern-api
uv init
uv python pin 3.12          # Tạo file .python-version ghi '3.12'
uv add fastapi uvicorn      # Tạo .venv riêng bằng Python 3.12
uv run python --version     # -> Python 3.12.x

# =====================================================================
# 4. [GLOBAL CLI TOOLS] Cài công cụ dùng chung cho toàn máy (không làm bẩn dự án):
# =====================================================================
uv tool install ruff        # Cài ruff toàn cục trong môi trường cô lập riêng
uv tool install httpie      # Cài công cụ test API 'http' toàn cục
uvx black --version         # Chạy thử 1 công cụ bất kỳ không cần cài (giống npx)`}
              />

              <CopyCommandBlock
                title="Kịch bản thực tế 2: Dùng 'pyenv' + 'venv' quản lý Global vs. Từng Dự án"
                badge="pyenv Global vs Local"
                description="Với pyenv, lệnh 'pyenv global' đặt mặc định toàn máy, còn 'pyenv local' ghim phiên bản cho riêng thư mục dự án:"
                code={`# 1. [GLOBAL] Cài 2 phiên bản Python và đặt 3.12.7 làm mặc định toàn máy:
pyenv install 3.10.15
pyenv install 3.12.7
pyenv global 3.12.7         # Ghi vào ~/.pyenv/version

# Gõ ở bất kỳ đâu trên máy:
python --version            # -> Python 3.12.7

# =====================================================================
# 2. [PER-PROJECT] Vào thư mục Dự án A cần Python 3.10.15:
# =====================================================================
mkdir project-a && cd project-a
pyenv local 3.10.15         # Tạo file .python-version tại project-a/
python --version            # -> Tự động đổi sang Python 3.10.15!

# Tạo môi trường ảo .venv cho Project A (sẽ mang phiên bản 3.10.15):
python -m venv .venv
${
  selectedOs === 'windows'
    ? '.venv\\Scripts\\Activate.ps1'
    : 'source .venv/bin/activate'
}
pip install requests
deactivate

# Khi bạn 'cd ..' ra ngoài thư mục project-a:
cd ..
python --version            # -> Tự động quay về bản Global Python 3.12.7!`}
              />
            </div>
          )}

          {/* TAB 3: VS CODE / CURSOR SETUP */}
          {activeTab === 'ide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Bước quan trọng số 1
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-white">
                    Chọn đúng Python Interpreter (.venv)
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    Trong VS Code hoặc Cursor, bấm tổ hợp phím{' '}
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-emerald-300 border border-slate-700">
                      {selectedOs === 'macos'
                        ? 'Cmd + Shift + P'
                        : 'Ctrl + Shift + P'}
                    </kbd>{' '}
                    → Gõ{' '}
                    <code className="text-sky-300 font-mono">
                      Python: Select Interpreter
                    </code>{' '}
                    → Chọn dòng có chứa{' '}
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
                description="Tạo file .vscode/settings.json trong thư mục dự án và dán nội dung này vào để mỗi khi bấm Save, code tự động được căn chỉnh đẹp chuẩn PEP 8:"
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
                  fix: 'Luôn tạo và kích hoạt môi trường ảo trước: chạy `uv add <tên_gói>` HOẶC `python3 -m venv .venv && source .venv/bin/activate && pip install <tên_gói>`. Tuyệt đối không dùng sudo pip install.',
                },
                {
                  title:
                    '2. Lỗi đỏ "Activate.ps1 cannot be loaded because running scripts is disabled" trên Windows PowerShell',
                  cause:
                    'Mặc định Windows PowerShell chặn chạy các file script .ps1 của người dùng.',
                  fix: 'Mở PowerShell và chạy lệnh: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (bấm Y để đồng ý). Hoặc dùng `uv run python ...` thì không cần chạy Activate.ps1 nữa!',
                },
                {
                  title:
                    '3. Đã cài thư viện trên Terminal nhưng VS Code vẫn báo gạch chân vàng "Import could not be resolved"',
                  cause:
                    'VS Code đang chọn nhầm trình thông dịch Python mặc định của máy chứ chưa chọn Python nằm trong thư mục .venv của dự án.',
                  fix: 'Bấm `Cmd/Ctrl + Shift + P` → Gõ `Python: Select Interpreter` → Chọn dòng có đường dẫn `./.venv/bin/python` (hoặc `.venv\\Scripts\\python.exe`).',
                },
                {
                  title:
                    '4. Cài pyenv xong, đã chạy pyenv global 3.12.7 nhưng gõ python --version vẫn ra bản cũ',
                  cause:
                    'Bạn chưa thêm thư mục shims của pyenv vào biến môi trường PATH trong file cấu hình Shell (`~/.zshrc` trên macOS hoặc `~/.bashrc` trên Linux).',
                  fix: 'Chạy 3 lệnh cấu hình `PYENV_ROOT`, `PATH` và `eval "$(pyenv init -)"` ở Tab số 2 rồi chạy `source ~/.zshrc` (hoặc chuyển sang dùng `uv python pin 3.12`).',
                },
                {
                  title:
                    '5. Lỗi "ModuleNotFoundError: No module named ..." khi chạy file nằm sâu trong thư mục con',
                  cause:
                    'Khi bạn chạy `python src/app/main.py`, Python chỉ thêm `src/app/` vào sys.path chứ không thêm thư mục gốc của dự án.',
                  fix: 'Luôn đứng ở thư mục gốc của dự án và chạy qua cờ `-m` (ví dụ: `uv run python -m app.main`) hoặc cài gói dự án ở chế độ editable (`uv sync` / `pip install -e .`).',
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

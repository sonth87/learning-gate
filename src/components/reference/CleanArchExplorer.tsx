import React, { useState } from 'react';
import { FolderTree, FileCode2, ArrowRightLeft } from 'lucide-react';
import { CLEAN_ARCH_FILES } from '@/data/reference/pdfDeepDivesData';
import { CodeBlock } from '@/components/common/CodeBlock';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cn } from '@/utils/cn';

const ASCII_TREE = `my-python-backend/
├── src/
│   └── app/
│       ├── __init__.py
│       ├── main.py                # Khởi tạo FastAPI app, middlewares, lifespan
│       ├── core/
│       │   ├── config.py          # Cấu hình biến môi trường với pydantic-settings
│       │   ├── database.py        # Khởi tạo SQLAlchemy AsyncEngine & get_db()
│       │   └── security.py        # Xử lý JWT token, băm mật khẩu (pwdlib/bcrypt)
│       ├── models/                # 1. Tầng Database Entities (SQLAlchemy 2.0)
│       │   └── student.py
│       ├── schemas/               # 2. Tầng DTO & Validation (Pydantic v2)
│       │   └── student.py
│       ├── repositories/          # 3. Tầng Truy vấn dữ liệu (Data Access Layer)
│       │   └── student_repo.py
│       ├── services/              # 3.5. Tầng Nghiệp vụ (Business Logic Layer)
│       │   └── student_service.py
│       └── api/                   # 4. Tầng Giao vận HTTP (Controllers / Routers)
│           ├── deps.py            # Dependency Injection dùng chung (current_user...)
│           └── v1/
│               └── students.py
├── migrations/                    # Thư mục chứa các bản nâng cấp DB của Alembic
├── tests/                         # Unit test & Integration test với pytest
├── .env
├── pyproject.toml                 # Quản lý dependencies, cấu hình Ruff & Pyright
└── Dockerfile`;

export const CleanArchExplorer: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState(CLEAN_ARCH_FILES[3].path);
  const showJsTsComparison = useSettingsStore((s) => s.showJsTsComparison);
  const codePanelRef = React.useRef<HTMLDivElement | null>(null);

  const activeFile =
    CLEAN_ARCH_FILES.find((f) => f.path === selectedPath) || CLEAN_ARCH_FILES[0];

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        codePanelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
          <FolderTree className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Chuyên đề 3 (PDF): Kiến trúc Dự án FastAPI Chuẩn Clean Architecture (src-layout)
          </h2>
          <p className="text-xs text-slate-400">
            Bấm vào từng file trong kiến trúc 4 tầng (Model → Schema → Repository → Service → Router) để xem vai trò và code mẫu kết nối.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: ASCII Tree & Interactive File Buttons */}
        <div className="lg:col-span-5 min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-x-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
              Sơ đồ tổ chức thư mục chuẩn (src-layout):
            </div>
            <pre className="font-mono text-[11px] leading-5 text-slate-300">
              {ASCII_TREE}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-300 px-1">
              Chọn file để mổ xẻ chi tiết từng tầng:
            </div>
            {CLEAN_ARCH_FILES.map((file) => {
              const active = file.path === activeFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file.path)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all',
                    active
                      ? 'border-sky-500/50 bg-sky-500/15 text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-sky-400' : 'text-slate-500'
                      )}
                    />
                    <span className="font-mono text-xs font-semibold truncate">
                      {file.path}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-amber-300">
                    {file.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected File Code & Layer Explanation */}
        <div
          ref={codePanelRef}
          className="lg:col-span-7 min-w-0 space-y-4 scroll-mt-16"
        >
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-md bg-sky-500/20 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                {activeFile.layer}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {activeFile.path}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {activeFile.description}
            </p>

            {showJsTsComparison && (
              <div className="flex items-center gap-2 pt-1 text-xs text-cyan-300">
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>Tương đương bên Node.js / NestJS:</strong>{' '}
                  {activeFile.jsEquivalent}
                </span>
              </div>
            )}
          </div>

          <CodeBlock
            title={`Code mẫu chuẩn: ${activeFile.path}`}
            description={activeFile.layer}
            code={activeFile.sampleCode}
          />
        </div>
      </div>
    </div>
  );
};

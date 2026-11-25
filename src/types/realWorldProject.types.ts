import { SkillLevel } from './curriculum.types';
import { SampleInteractiveCommand, SampleProjectFile } from './sample.types';

export type ProjectSourceKind = 'production-template' | 'pbl-tutorial';

export interface RealWorldLibrary {
  /** Tên thư viện / công cụ, ví dụ: "FastAPI", "Pydantic v2", "Alembic" */
  name: string;
  /** Vai trò chính trong project */
  role: string;
  /** Giải thích dễ hiểu cho người mới: tại sao cần dùng nó thay vì tự viết tay */
  whyNeeded: string;
}

export interface ProjectChapterItem {
  /** Số thứ tự hoặc mã chương, ví dụ "Chapter 1", "Bước 1", "Module A" */
  chapter: string;
  /** Tiêu đề chương/bước */
  title: string;
  /** Tóm tắt tiếng Việt cho người mới: chương này làm gì, thêm file/thư viện nào */
  summaryVi: string;
  /** Link trực tiếp tới bài viết của chương đó (nếu có) */
  url?: string;
}

export interface RealWorldProject {
  id: string;
  groupId: string;
  title: string;
  repoName: string;
  url: string;
  kind: ProjectSourceKind;
  complexity: SkillLevel;
  scaleLabel: string;
  summary: string;
  /** Project này sinh ra để làm gì? Giải quyết bài toán thực tế nào? */
  purpose: string;
  /** Luồng hoạt động từ đầu vào -> xử lý -> đầu ra */
  howItWorks: string[];
  /** Cây thư mục tiêu biểu kèm comment giải thích từng file/folder */
  directoryTree: string;
  /** Danh sách thư viện cốt lõi & vai trò */
  libraries: RealWorldLibrary[];
  /** Gợi ý cho người mới: nên mở file/thư mục nào đọc trước */
  readingFocus: string;
  tags: string[];
  /** Danh sách các chương / bài học chi tiết (đặc biệt cho các chuỗi tutorial nhiều phần như Flask Mega-Tutorial 23 chương) */
  chapters?: ProjectChapterItem[];
  /** Bộ file code thật có comment tiếng Việt chi tiết từng dòng cho người mới, mở trực tiếp trong VS Code IDE */
  ideFiles: SampleProjectFile[];
  /** Các lệnh chạy thử trong Terminal của VS Code IDE */
  ideCommands: SampleInteractiveCommand[];
}

export interface RealWorldProjectGroup {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  beginnerTip: string;
}

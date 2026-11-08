import { LevelMeta, SkillLevel } from '@/types/curriculum.types';

export const SKILL_LEVELS: LevelMeta[] = [
  {
    id: 'fundamental',
    label: 'Fundamental',
    viLabel: 'Nhập môn & Nền tảng',
    tagline: 'Làm quen cú pháp, mô hình bộ nhớ nhãn dán, kiểu dữ liệu, luồng điều khiển và công cụ hiện đại (uv, Ruff).',
    color: 'emerald',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    order: 1,
  },
  {
    id: 'basic',
    label: 'Basic',
    viLabel: 'Cơ bản Vững chắc',
    tagline: 'Cấu trúc dữ liệu (List, Dict, Set, Tuple), hàm, xử lý ngoại lệ, đọc/ghi file, String Slicing & Comprehension.',
    color: 'sky',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    order: 2,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    viLabel: 'Cơ chế Chuyên sâu',
    tagline: 'OOP, MRO, Dunder Methods, Iterator/Generator (yield), Decorator, Context Manager (with) & Type Hints.',
    color: 'violet',
    bgClass: 'bg-violet-500/15',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500/30',
    order: 3,
  },
  {
    id: 'pro',
    label: 'Pro',
    viLabel: 'Kỹ sư Thực chiến',
    tagline: 'Project Engineering, pytest, FastAPI, Dependency Injection, Pydantic v2, SQLAlchemy 2.0 Async & Clean Architecture.',
    color: 'amber',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    order: 4,
  },
  {
    id: 'master',
    label: 'Master',
    viLabel: 'Kiến trúc sư Hệ thống',
    tagline: 'Giải phẫu GIL, AsyncIO Event Loop, Multiprocessing, Celery, AI/LLM/Data Pipelines, Docker tối ưu & Observability.',
    color: 'rose',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    order: 5,
  },
];

export const LEVEL_MAP: Record<SkillLevel, LevelMeta> = SKILL_LEVELS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SkillLevel, LevelMeta>
);

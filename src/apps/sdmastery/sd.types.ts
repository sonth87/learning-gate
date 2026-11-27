export type SdMainTab = 'learn' | 'lab' | 'warroom' | 'cases' | 'atlas' | 'interview';

/** Thứ tự tab cố định; ⌘1..⌘6 theo thứ tự này (menu trong appRegistry). */
export const SD_TAB_ORDER: SdMainTab[] = ['learn', 'lab', 'warroom', 'cases', 'atlas', 'interview'];

export interface SdTabMeta {
  id: SdMainTab;
  labelVi: string;
  labelEn: string;
  /** Mô tả ngắn, trực diện cho placeholder (tab chưa làm). */
  descVi: string;
  descEn: string;
  /** Mốc sẽ làm (TASKS.md). Rỗng nếu tab đã có. */
  milestone: string;
}

export const SD_TABS: Record<SdMainTab, SdTabMeta> = {
  learn: {
    id: 'learn',
    labelVi: 'Bài học',
    labelEn: 'Learn',
    descVi: 'Lộ trình bài học, quiz và flashcard.',
    descEn: 'Lessons, quizzes and flashcards.',
    milestone: '',
  },
  lab: {
    id: 'lab',
    labelVi: 'Phòng Lab',
    labelEn: 'Lab',
    descVi: 'Kéo thả các thành phần để thiết kế hệ thống, chạy mô phỏng và được chấm theo ràng buộc.',
    descEn: 'Drag components to design a system, run the simulation and get graded against constraints.',
    milestone: '',
  },
  warroom: {
    id: 'warroom',
    labelVi: 'Xử lý sự cố',
    labelEn: 'War-Room',
    descVi: 'Chín sự cố giả lập: quan sát dấu hiệu, tìm nguyên nhân, khắc phục và viết postmortem.',
    descEn: 'Nine simulated incidents: read the signals, find the cause, fix it and write a postmortem.',
    milestone: '',
  },
  cases: {
    id: 'cases',
    labelVi: 'Case thiết kế',
    labelEn: 'Design Cases',
    descVi: 'Thiết kế hệ thống hoàn chỉnh (URL Shortener, News Feed...) và xem kiến trúc phát triển từ v1 đến vN.',
    descEn: 'Full system designs (URL Shortener, News Feed...) with an evolution timeline from v1 to vN.',
    milestone: '',
  },
  atlas: {
    id: 'atlas',
    labelVi: 'Từ điển mẫu',
    labelEn: 'Pattern Atlas',
    descVi: 'Tra cứu mẫu thiết kế và thuật ngữ, gắn với popover thuật ngữ trong bài học.',
    descEn: 'Look up design patterns and terms, linked to the term popover in lessons.',
    milestone: '',
  },
  interview: {
    id: 'interview',
    labelVi: 'Phỏng vấn',
    labelEn: 'Interview',
    descVi: 'Luyện phỏng vấn system design theo 5 chặng SNAKE, có đồng hồ bấm giờ.',
    descEn: 'Practice system design interviews in 5 SNAKE stages with a timer.',
    milestone: '',
  },
};

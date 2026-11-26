import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import type { CalloutKind, PacketKind, StepCategory } from './types';

export const WORKBENCH_I18N: Record<
  WorkbenchLang,
  {
    course: string;
    lessonsCount: (n: number) => string;
    lessonOf: (idx: number, total: number) => string;
    stepOf: (idx: number, total: number) => string;
    stepsCount: (n: number) => string;
    minutes: (n: number) => string;
    inThisLesson: string;
    whatChanged: string;
    youWillLearn: string;
    progress: string;
    replay: string;
    pause: string;
    play: string;
    liveCode: string;
    visualStage: string;
    fullNotes: string;
    runCode: string;
    running: string;
    back: string;
    next: string;
    finishLesson: string;
    lessonCompleted: string;
    nextModule: string;
    searchPlaceholder: string;
    searchTitle: string;
    searchStats: (lessons: number, steps: number, concepts: number) => string;
    recentSection: string;
    lessonsSection: string;
    stepsSection: string;
    conceptsSection: string;
    noResults: string;
    openCourseMenu: string;
    closeApp: string;
    collapseSidebar: string;
    expandSidebar: string;
    resizeSidebarHint: string;
    tabs: {
      learn: string;
      practice: string;
      lab: string;
      cheatsheets: string;
      more: string;
    };
    practiceActions: {
      title: string;
      quiz: (n: number) => string;
      exercises: (passed: number, total: number) => string;
      flashcards: (n: number) => string;
      readings: (n: number) => string;
    };
    keyboardHint: {
      step: string;
      replay: string;
      pause: string;
    };
    difficulty: {
      Beginner: string;
      Intermediate: string;
      Advanced: string;
    };
    categories: Record<StepCategory, string>;
    calloutTitles: Record<CalloutKind, string>;
    packets: Record<PacketKind, string>;
    themes: {
      light: string;
      dark: string;
    };
  }
> = {
  vi: {
    course: 'Khóa học',
    lessonsCount: (n) => `${n} bài học`,
    lessonOf: (idx, total) => `Bài ${idx} / ${total}`,
    stepOf: (idx, total) => `Bước ${idx} / ${total}`,
    stepsCount: (n) => `${n} bước`,
    minutes: (n) => `${n} phút`,
    inThisLesson: 'TRONG BÀI HỌC NÀY',
    whatChanged: 'ĐIỂM THAY ĐỔI TRÊN MÔ HÌNH',
    youWillLearn: 'MỤC TIÊU NẮM VỮNG',
    progress: 'TIẾN ĐỘ',
    replay: 'Chạy lại',
    pause: 'Tạm dừng',
    play: 'Tiếp tục',
    liveCode: 'Chạy thử Code',
    visualStage: 'Mô hình động',
    fullNotes: 'Bài giảng gốc',
    runCode: 'Chạy Python',
    running: 'Đang chạy…',
    back: 'Trước',
    next: 'Tiếp',
    finishLesson: 'Hoàn thành bài (+20 XP)',
    lessonCompleted: 'Đã hoàn thành bài học',
    nextModule: 'Sang bài kế tiếp',
    searchPlaceholder: 'Tìm bài học, bước & khái niệm…',
    searchTitle: 'Tìm kiếm nhanh toàn khóa',
    searchStats: (lessons, steps, concepts) =>
      `${lessons} bài · ${steps} bước mô hình · ${concepts} thuật ngữ`,
    recentSection: 'VỪA HỌC GẦN ĐÂY',
    lessonsSection: 'BÀI HỌC',
    stepsSection: 'BƯỚC MÔ HÌNH',
    conceptsSection: 'KHÁI NIỆM & TỪ ĐIỂN',
    noResults: 'Không tìm thấy kết quả phù hợp.',
    openCourseMenu: 'Mở danh sách bài học',
    closeApp: 'Đóng',
    collapseSidebar: 'Thu gọn mục lục',
    expandSidebar: 'Mở rộng mục lục',
    resizeSidebarHint: 'Kéo để thay đổi độ rộng · Nháy đúp để đặt lại mặc định',
    tabs: {
      learn: 'Bài học',
      practice: 'Thực hành',
      lab: 'Code Lab',
      cheatsheets: 'Tra cứu',
      more: 'Khác',
    },
    practiceActions: {
      title: 'THỰC HÀNH BÀI NÀY',
      quiz: (n) => `Quiz (${n} câu)`,
      exercises: (passed, total) => `Bài tập (${passed}/${total})`,
      flashcards: (n) => `Flashcard (${n})`,
      readings: () => 'Dự án Thực tế (39)',
    },
    keyboardHint: {
      step: 'chuyển bước',
      replay: 'chạy lại',
      pause: 'tạm dừng',
    },
    difficulty: {
      Beginner: 'Cơ bản',
      Intermediate: 'Trung cấp',
      Advanced: 'Chuyên sâu',
    },
    categories: {
      SETUP: 'KHỞI TẠO',
      PROBLEM: 'VẤN ĐỀ',
      TECHNIQUE: 'KỸ THUẬT',
      MECHANISM: 'CƠ CHẾ RUNTIME',
      PITFALL: 'CẠM BẪY',
      REAL_CODE: 'THỰC CHIẾN',
      RECAP: 'ĐÚC KẾT',
    },
    calloutTitles: {
      'key-idea': 'Ý TƯỞNG CỐT LÕI',
      'watch-out': 'CẢNH BÁO CẠM BẪY',
      'good-to-know': 'MẸO HAY NÊN NHỚ',
      compare: 'ĐỐI CHIẾU JS / TS ↔ PYTHON',
      technique: 'MẪU CHUẨN PYTHONIC',
    },
    packets: {
      request: 'luồng gọi / dữ liệu vào',
      response: 'kết quả trả về',
      pointer: 'tham chiếu / tra cứu',
      mutation: 'cập nhật trạng thái / yield',
      'cache-hit': 'trúng cache O(1) (Cache Hit)',
      error: 'ngoại lệ / tác vụ gây nghẽn',
      retry: 'gọi lại (retry)',
      timeout: 'quá thời gian chờ (timeout)',
      dropped: 'bị loại bỏ (dropped)',
    },
    themes: {
      light: 'Giấy sáng (Paper)',
      dark: 'Bản vẽ tối (Espresso)',
    },
  },
  en: {
    course: 'Course',
    lessonsCount: (n) => `${n} lessons`,
    lessonOf: (idx, total) => `Lesson ${idx} of ${total}`,
    stepOf: (idx, total) => `Step ${idx} of ${total}`,
    stepsCount: (n) => `${n} steps`,
    minutes: (n) => `${n} min`,
    inThisLesson: 'IN THIS LESSON',
    whatChanged: 'WHAT CHANGED',
    youWillLearn: "YOU'LL LEARN",
    progress: 'PROGRESS',
    replay: 'Replay',
    pause: 'Pause',
    play: 'Play',
    liveCode: 'Live Code',
    visualStage: 'Visual Model',
    fullNotes: 'Full Notes',
    runCode: 'Run Python',
    running: 'Running…',
    back: 'Back',
    next: 'Next',
    finishLesson: 'Complete Lesson (+20 XP)',
    lessonCompleted: 'Lesson completed',
    nextModule: 'Next Lesson',
    searchPlaceholder: 'Search lessons & concepts…',
    searchTitle: 'Quick Course Search',
    searchStats: (lessons, steps, concepts) =>
      `${lessons} lessons · ${steps} visual steps · ${concepts} concepts`,
    recentSection: 'RECENT',
    lessonsSection: 'LESSONS',
    stepsSection: 'MODEL STEPS',
    conceptsSection: 'CONCEPTS & GLOSSARY',
    noResults: 'No matching lessons or concepts found.',
    openCourseMenu: 'Open course menu',
    closeApp: 'Close',
    collapseSidebar: 'Collapse course sidebar',
    expandSidebar: 'Expand course sidebar',
    resizeSidebarHint: 'Drag to resize panel · Double-click to reset width',
    tabs: {
      learn: 'Learn',
      practice: 'Practice',
      lab: 'Code Lab',
      cheatsheets: 'Cheatsheets',
      more: 'More',
    },
    practiceActions: {
      title: 'PRACTICE THIS MODULE',
      quiz: (n) => `Quiz (${n} Qs)`,
      exercises: (passed, total) => `Exercises (${passed}/${total})`,
      flashcards: (n) => `Flashcards (${n})`,
      readings: () => 'Real Projects (39)',
    },
    keyboardHint: {
      step: 'step',
      replay: 'replay',
      pause: 'pause',
    },
    difficulty: {
      Beginner: 'Beginner',
      Intermediate: 'Intermediate',
      Advanced: 'Advanced',
    },
    categories: {
      SETUP: 'SETUP',
      PROBLEM: 'PROBLEM',
      TECHNIQUE: 'TECHNIQUE',
      MECHANISM: 'MECHANISM',
      PITFALL: 'WATCH OUT',
      REAL_CODE: 'PRODUCTION',
      RECAP: 'RECAP',
    },
    calloutTitles: {
      'key-idea': 'KEY IDEA',
      'watch-out': 'WATCH OUT',
      'good-to-know': 'GOOD TO KNOW',
      compare: 'JS / TS ↔ PYTHON',
      technique: 'PYTHONIC TECHNIQUE',
    },
    packets: {
      request: 'call / input',
      response: 'return / output',
      pointer: 'reference / lookup',
      mutation: 'state / yield',
      'cache-hit': 'cache / O(1) hit',
      error: 'exception / blocked',
      retry: 'retry',
      timeout: 'timed out',
      dropped: 'dropped',
    },
    themes: {
      light: 'Paper Light',
      dark: 'Espresso Dark',
    },
  },
};

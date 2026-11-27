import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import type { CalloutKind, LiveNodeState, PacketKind, StepCategory } from './types';

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
    /** live-sim: nhóm chuỗi cho stage, timeline, telemetry, controls, tracer, inspector (05 §7) */
    live: {
      packetScale: (n: number) => string;
      loadWord: string;
      states: Record<LiveNodeState, string>;
      down: string;
      timeline: string;
      speed: string;
      playbackSpeed: (x: number) => string;
      time: (t: number, d: number) => string;
      backToStart: string;
      nextMarker: string;
      prevMarker: string;
      notSimulated: string;
      pastWarning: (t: number) => string;
      seekLabel: string;
      series: {
        rps: string;
        p99: string;
        errors: string;
        cost: string;
        queue: string;
      };
      slo: (name: string, v: string) => string;
      markers: {
        scenario: string;
        learner: string;
        milestone: string;
        alert: string;
      };
      telemetry: {
        rps: string;
        p99: string;
        error: string;
        cost: string;
        goodput: string;
      };
      load: {
        title: string;
        multiplier: string;
        current: (rps: number) => string;
        quick: string;
      };
      chaos: {
        title: string;
        kill: string;
        slow: string;
        partition: string;
        expireCache: string;
        hotKey: string;
        badDeploy: string;
        pickHint: string;
        pickCancel: string;
        injected: (what: string, target: string) => string;
        invalidTarget: string;
      };
      knobs: {
        title: string;
        reset: string;
        changes: (used: number, max: number) => string;
      };
      tracer: {
        title: string;
        trace: string;
        representativeNote: string;
        total: (ms: number) => string;
        outcome: {
          ok: string;
          timeout: string;
          error: string;
          dropped: string;
        };
        spans: {
          net: string;
          queue: string;
          service: string;
          retryWait: string;
          timeout: string;
        };
        slowest: (pct: number) => string;
        retries: (n: number) => string;
        close: string;
      };
      inspector: {
        title: string;
        whyState: string;
        sparkline60s: string;
      };
      badges: {
        DOWN: string;
        WARMING: string;
        COLD: string;
        LAG: (ms: number) => string;
        QUEUE: (n: string) => string;
        LIMIT: string;
        DEPLOY: string;
        BAD_DEPLOY: string;
        HOT: string;
        SLOW: string;
        PARTITION: string;
      };
      disclaimer: string;
      announce: {
        stateChanged: (node: string, state: string) => string;
        sloBreached: string;
        sloRecovered: string;
      };
    };
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
    live: {
      packetScale: (n) => `1 chấm = ${n} req/s`,
      loadWord: 'tải',
      states: {
        idle: 'Nhàn rỗi',
        healthy: 'Bình thường',
        busy: 'Đang bận',
        saturated: 'Gần quá tải',
        overloaded: 'Quá tải',
        down: 'Đã dừng',
        recovering: 'Đang khởi động lại',
      },
      down: 'DOWN',
      timeline: 'Dòng thời gian',
      speed: 'Tốc độ',
      playbackSpeed: (x) => `Tốc độ mô phỏng ${x}×`,
      time: (t, d) => `t = ${t.toFixed(1)} s / ${d} s`,
      backToStart: 'Về đầu',
      nextMarker: 'Mốc kế tiếp (+10 s)',
      prevMarker: 'Mốc trước (-10 s)',
      notSimulated: 'Chưa mô phỏng',
      pastWarning: (t) =>
        `Đang xem quá khứ. Đổi tham số sẽ thay thế phần mô phỏng sau ${t.toFixed(1)} giây.`,
      seekLabel: 'Thanh tua thời gian mô phỏng',
      series: {
        rps: 'RPS',
        p99: 'p99',
        errors: 'ERR',
        cost: 'Chi phí',
        queue: 'Hàng đợi',
      },
      slo: (name, v) => `SLO ${name} ≤ ${v}`,
      markers: {
        scenario: 'Mốc kịch bản',
        learner: 'Thao tác của bạn',
        milestone: 'Mốc trạng thái',
        alert: 'Cảnh báo SLO',
      },
      telemetry: {
        rps: 'Lưu lượng',
        p99: 'Độ trễ p99',
        error: 'Tỉ lệ lỗi',
        cost: 'Chi phí',
        goodput: 'Thông lượng đạt',
      },
      load: {
        title: 'Mức tải',
        multiplier: 'Hệ số tải',
        current: (rps) => `Hiện tại ≈ ${Math.round(rps).toLocaleString('en-US')} req/s`,
        quick: 'Chọn nhanh',
      },
      chaos: {
        title: 'Tiêm sự cố',
        kill: 'Dừng node',
        slow: 'Làm chậm node',
        partition: 'Cắt kết nối',
        expireCache: 'Xoá toàn bộ cache',
        hotKey: 'Tạo hot key',
        badDeploy: 'Triển khai bản lỗi',
        pickHint: 'Chọn node hoặc đường nối mục tiêu. Nhấn Esc để hủy.',
        pickCancel: 'Hủy chọn',
        injected: (what, target) => `Đã áp dụng "${what}" lên ${target}`,
        invalidTarget: 'Mục tiêu không áp dụng được thao tác này',
      },
      knobs: {
        title: 'Tham số',
        reset: 'Đặt lại gốc',
        changes: (used, max) => `${used}/${max} thay đổi`,
      },
      tracer: {
        title: 'Theo dõi 1 request',
        trace: 'Trace request',
        representativeNote: 'Request đại diện lấy mẫu từ phân phối độ trễ hiện tại',
        total: (ms) => `tổng ${Math.round(ms)} ms`,
        outcome: {
          ok: 'Thành công',
          timeout: 'Quá thời gian chờ',
          error: 'Lỗi xử lý',
          dropped: 'Bị loại bỏ (hàng đợi đầy)',
        },
        spans: {
          net: 'mạng',
          queue: 'chờ hàng đợi',
          service: 'xử lý',
          retryWait: 'chờ gọi lại',
          timeout: 'quá thời gian chờ',
        },
        slowest: (pct) => `chặng chậm nhất (${Math.round(pct)}%)`,
        retries: (n) => `sau ${n} lần thử`,
        close: 'Đóng bảng trace',
      },
      inspector: {
        title: 'Số liệu trực tiếp',
        whyState: 'Vì sao có trạng thái này?',
        sparkline60s: 'Xu hướng 60 giây gần nhất',
      },
      badges: {
        DOWN: 'DOWN',
        WARMING: 'ĐANG LÀM ẤM',
        COLD: 'CACHE NGUỘI',
        LAG: (ms) => `TRỄ ${Math.round(ms)} ms`,
        QUEUE: (n) => `HÀNG ĐỢI ${n}`,
        LIMIT: 'GIỚI HẠN TỐC ĐỘ',
        DEPLOY: 'ĐANG TRIỂN KHAI',
        BAD_DEPLOY: 'BẢN TRIỂN KHAI LỖI',
        HOT: 'HOT KEY',
        SLOW: 'CHẬM',
        PARTITION: 'MẤT KẾT NỐI',
      },
      disclaimer: 'Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối.',
      announce: {
        stateChanged: (node, state) => `${node} chuyển sang trạng thái ${state}`,
        sloBreached: 'Mức dịch vụ (SLO) đang bị vượt ngưỡng',
        sloRecovered: 'Mức dịch vụ (SLO) đã trở lại bình thường',
      },
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
    live: {
      packetScale: (n) => `1 dot = ${n} req/s`,
      loadWord: 'load',
      states: {
        idle: 'Idle',
        healthy: 'Healthy',
        busy: 'Busy',
        saturated: 'Saturated',
        overloaded: 'Overloaded',
        down: 'Stopped',
        recovering: 'Recovering',
      },
      down: 'DOWN',
      timeline: 'Timeline',
      speed: 'Speed',
      playbackSpeed: (x) => `Playback speed ${x}×`,
      time: (t, d) => `t = ${t.toFixed(1)} s / ${d} s`,
      backToStart: 'Back to start',
      nextMarker: 'Next marker (+10 s)',
      prevMarker: 'Previous marker (-10 s)',
      notSimulated: 'Not simulated yet',
      pastWarning: (t) =>
        `Viewing the past. Changing a setting replaces the simulation after ${t.toFixed(1)}s.`,
      seekLabel: 'Simulation timeline scrubber',
      series: {
        rps: 'RPS',
        p99: 'p99',
        errors: 'ERR',
        cost: 'Cost',
        queue: 'Queue',
      },
      slo: (name, v) => `SLO ${name} ≤ ${v}`,
      markers: {
        scenario: 'Scenario event',
        learner: 'Your action',
        milestone: 'State milestone',
        alert: 'SLO alert',
      },
      telemetry: {
        rps: 'Traffic',
        p99: 'p99 Latency',
        error: 'Error Rate',
        cost: 'Cost',
        goodput: 'Goodput',
      },
      load: {
        title: 'Traffic Load',
        multiplier: 'Load multiplier',
        current: (rps) => `Current ≈ ${Math.round(rps).toLocaleString('en-US')} req/s`,
        quick: 'Quick presets',
      },
      chaos: {
        title: 'Fault Injection',
        kill: 'Stop node',
        slow: 'Slow down node',
        partition: 'Cut link',
        expireCache: 'Expire all cache',
        hotKey: 'Inject hot key',
        badDeploy: 'Bad deploy',
        pickHint: 'Pick a target node or link. Press Esc to cancel.',
        pickCancel: 'Cancel pick',
        injected: (what, target) => `Applied "${what}" to ${target}`,
        invalidTarget: 'This action cannot target that entity',
      },
      knobs: {
        title: 'Parameters',
        reset: 'Reset default',
        changes: (used, max) => `${used}/${max} changes`,
      },
      tracer: {
        title: 'Trace 1 Request',
        trace: 'Trace request',
        representativeNote: 'Representative request sampled from current latency distribution',
        total: (ms) => `total ${Math.round(ms)} ms`,
        outcome: {
          ok: 'Succeeded',
          timeout: 'Timed out',
          error: 'Failed',
          dropped: 'Dropped (queue full)',
        },
        spans: {
          net: 'network',
          queue: 'queue wait',
          service: 'processing',
          retryWait: 'retry wait',
          timeout: 'timed out',
        },
        slowest: (pct) => `slowest hop (${Math.round(pct)}%)`,
        retries: (n) => `after ${n} attempts`,
        close: 'Close trace panel',
      },
      inspector: {
        title: 'Live metrics',
        whyState: 'Why this state?',
        sparkline60s: 'Last 60s trend',
      },
      badges: {
        DOWN: 'DOWN',
        WARMING: 'WARMING',
        COLD: 'COLD CACHE',
        LAG: (ms) => `LAG ${Math.round(ms)} ms`,
        QUEUE: (n) => `QUEUE ${n}`,
        LIMIT: 'RATE LIMITED',
        DEPLOY: 'DEPLOYING',
        BAD_DEPLOY: 'BAD DEPLOY',
        HOT: 'HOT KEY',
        SLOW: 'SLOW',
        PARTITION: 'PARTITIONED',
      },
      disclaimer:
        'The simulation shows the right trend and magnitude, not exact absolute numbers.',
      announce: {
        stateChanged: (node, state) => `${node} is now ${state}`,
        sloBreached: 'Service level objective (SLO) breached',
        sloRecovered: 'Service level objective (SLO) recovered',
      },
    },
    themes: {
      light: 'Paper Light',
      dark: 'Espresso Dark',
    },
  },
};

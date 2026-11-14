import { useStore, type AppConfig } from '@sonth87/device-layout';
import { PyMasteryApp } from './pymastery/PyMasteryApp';
import { KubeMasteryApp } from './kubemastery/KubeMasteryApp';
import { CicdMasteryApp } from './cicdmastery/CicdMasteryApp';
import { PmpMasteryApp } from './pmpmastery/PmpMasteryApp';
import { RedisMasteryApp } from './redismastery/RedisMasteryApp';
import {
  PyMasteryLogo,
  KubeMasteryLogo,
  CicdMasteryLogo,
  PmpMasteryLogo,
  RedisMasteryLogo,
} from '@/components/common/AppLogos';

export const PYMASTERY_CONFIG: AppConfig = {
  id: 'pymastery',
  name: 'Python Mastery',
  icon: PyMasteryLogo,
  rawIcon: true,
  fullBleedIcon: true,
  iconColor: ['#10B981', '#059669'],
  render: PyMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  mobileFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 320, height: 420 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'learn', label: 'Học — lộ trình, bài tập, quiz', action: 'tab:learn' },
    { key: 'playground', label: 'Sân chơi & Studio IDE', action: 'tab:playground' },
    { key: 'glossary', label: 'Từ điển Python', action: 'tab:glossary' },
    { key: 'sep2', label: '', action: '', separator: true },
    { key: 'curriculum', label: 'Giáo trình cũ (tra cứu)', action: 'tab:curriculum' },
    { key: 'samples', label: 'Dự án Mẫu (16 Projects IDE)', action: 'tab:samples' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'search', label: 'Quick Search...', shortcut: '⌘K', action: 'quickSearch' },
        { key: 'notes', label: 'Notes & Bookmarks', action: 'openNotes' },
        { key: 'settings', label: 'Preferences & Backup...', shortcut: '⌘,', action: 'openSettings' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'Edit',
      items: [
        { key: 'undo', label: 'Undo', shortcut: '⌘Z', action: 'undo' },
        { key: 'redo', label: 'Redo', shortcut: '⌘⇧Z', action: 'redo' },
        { key: 'sep1', label: '', separator: true },
        { key: 'cut', label: 'Cut', shortcut: '⌘X', action: 'cut' },
        { key: 'copy', label: 'Copy', shortcut: '⌘C', action: 'copy' },
        { key: 'paste', label: 'Paste', shortcut: '⌘V', action: 'paste' },
        { key: 'select-all', label: 'Select All', shortcut: '⌘A', action: 'selectAll' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'learn', label: 'Học — lộ trình, bài tập, quiz', shortcut: '⌘1', action: 'tab:learn' },
        { key: 'playground', label: 'Sân chơi & Studio IDE', shortcut: '⌘2', action: 'tab:playground' },
        { key: 'glossary', label: 'Từ điển Python', shortcut: '⌘3', action: 'tab:glossary' },
        { key: 'sepv', label: '', separator: true },
        { key: 'curriculum', label: 'Giáo trình cũ (7 giai đoạn)', action: 'tab:curriculum' },
        { key: 'practice', label: 'Bài thực hành cũ', action: 'tab:practice' },
        { key: 'samples', label: 'Dự án Mẫu (16 Projects IDE)', action: 'tab:samples' },
        { key: 'flashcards', label: 'Flashcards cũ', action: 'tab:flashcards' },
        { key: 'exams', label: 'Thi Sát hạch', action: 'tab:exams' },
        { key: 'reference', label: 'Chuyên đề PDF', action: 'tab:reference' },
        { key: 'sep1', label: '', separator: true },
        { key: 'jsts', label: 'Toggle JS/TS Comparison', action: 'toggleJsTs' },
        { key: 'sep2', label: '', separator: true },
        { key: 'fullscreen', label: 'Enter Full Screen', shortcut: '⌃⌘F', action: 'toggleFullscreen' },
      ],
    },
    {
      label: 'Window',
      items: [
        { key: 'minimize', label: 'Minimize', shortcut: '⌘M', action: 'minimize' },
        { key: 'zoom', label: 'Zoom', action: 'zoom' },
        { key: 'sep1', label: '', separator: true },
        { key: 'bring-all', label: 'Bring All to Front', action: 'bringAllToFront' },
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'glossary-help', label: 'Python Glossary & Stdlib', action: 'tab:glossary' },
        { key: 'about', label: 'About Python Mastery', action: 'about' },
      ],
    },
  ],
};

export const KUBEMASTERY_CONFIG: AppConfig = {
  id: 'kubemastery',
  name: 'Docker & K8s Mastery',
  icon: KubeMasteryLogo,
  rawIcon: true,
  fullBleedIcon: true,
  iconColor: ['#0EA5E9', '#2563EB'],
  render: KubeMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  mobileFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 320, height: 420 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'learn', label: 'Học — lộ trình, bài thực hành, quiz', action: 'tab:learn' },
    { key: 'cluster-sim', label: 'Mô phỏng Cụm K8s & Terminal', action: 'tab:cluster-sim' },
    { key: 'glossary', label: 'Từ điển Liên tưởng & Cheatsheet', action: 'tab:glossary' },
    { key: 'sep2', label: '', action: '', separator: true },
    { key: 'flow-studio', label: 'Sơ đồ Động (tra cứu)', action: 'tab:flow-studio' },
    { key: 'incidents', label: 'War-Room 8 Sự cố (tra cứu)', action: 'tab:incidents' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'search', label: 'Quick Search...', shortcut: '⌘K', action: 'quickSearch' },
        { key: 'settings', label: 'Preferences & Backup...', shortcut: '⌘,', action: 'openSettings' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'learn', label: 'Học — lộ trình, bài thực hành, quiz', shortcut: '⌘1', action: 'tab:learn' },
        { key: 'cluster-sim', label: 'Mô phỏng Cụm K8s & Terminal', shortcut: '⌘2', action: 'tab:cluster-sim' },
        { key: 'glossary', label: 'Từ điển Liên tưởng & Cheatsheet', shortcut: '⌘3', action: 'tab:glossary' },
        { key: 'sepv', label: '', separator: true },
        { key: 'flow-studio', label: 'Sơ đồ Động (Animated Flows)', action: 'tab:flow-studio' },
        { key: 'incidents', label: '8 Tình huống Sự cố (War-Room)', action: 'tab:incidents' },
        { key: 'curriculum', label: 'Giáo trình cũ (4 giai đoạn)', action: 'tab:curriculum' },
        { key: 'practice', label: 'Luyện tập YAML cũ', action: 'tab:practice' },
        { key: 'exams', label: 'Thi Sát hạch cũ', action: 'tab:exams' },
        { key: 'sep1', label: '', separator: true },
        { key: 'fullscreen', label: 'Enter Full Screen', shortcut: '⌃⌘F', action: 'toggleFullscreen' },
      ],
    },
    {
      label: 'Window',
      items: [
        { key: 'minimize', label: 'Minimize', shortcut: '⌘M', action: 'minimize' },
        { key: 'zoom', label: 'Zoom', action: 'zoom' },
        { key: 'sep1', label: '', separator: true },
        { key: 'bring-all', label: 'Bring All to Front', action: 'bringAllToFront' },
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'cheatsheet', label: 'Docker & K8s Command Cheatsheet', action: 'tab:glossary' },
        { key: 'warroom', label: '8 Incident Troubleshooting War-Room', action: 'tab:incidents' },
      ],
    },
  ],
};

export const CICD_MASTERY_CONFIG: AppConfig = {
  id: 'cicdmastery',
  name: 'CI/CD Architecture',
  icon: CicdMasteryLogo,
  rawIcon: true,
  fullBleedIcon: true,
  iconColor: ['#06B6D4', '#3B82F6'],
  render: CicdMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  mobileFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 320, height: 420 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'learn', label: 'Học — lộ trình, bài thực hành, quiz', action: 'tab:learn' },
    { key: 'simulator', label: 'Giả lập Pipeline, DAG & Zero-Downtime', action: 'tab:simulator' },
    { key: 'glossary', label: 'Từ điển & Ma trận Kiến trúc', action: 'tab:glossary' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'warroom', label: 'War-Room Tình huống (B1–B7)', action: 'tab:warroom' },
    { key: 'blueprints', label: '4 Bộ Full Flow Blueprints IDE', action: 'tab:blueprints' },
    { key: 'curriculum', label: 'Giáo trình gốc (tra cứu)', action: 'tab:curriculum' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'settings', label: 'Preferences & Backup...', shortcut: '⌘,', action: 'openSettings' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'learn', label: 'Học — lộ trình, bài thực hành, quiz', shortcut: '⌘1', action: 'tab:learn' },
        { key: 'simulator', label: 'Giả lập Pipeline & Traffic', shortcut: '⌘2', action: 'tab:simulator' },
        { key: 'glossary', label: 'Từ điển & Ma trận', shortcut: '⌘3', action: 'tab:glossary' },
        { key: 'sepv', label: '', separator: true },
        { key: 'warroom', label: 'Mô phỏng Tình huống (B1–B7)', action: 'tab:warroom' },
        { key: 'blueprints', label: '4 Bộ Full Flow Blueprints', action: 'tab:blueprints' },
        { key: 'curriculum', label: 'Giáo trình gốc (PDF)', action: 'tab:curriculum' },
        { key: 'practice', label: 'Thực hành cũ', action: 'tab:practice' },
        { key: 'flashcards', label: 'Flashcards cũ', action: 'tab:flashcards' },
        { key: 'exams', label: 'Thi Sát hạch cũ', action: 'tab:exams' },
        { key: 'sep1', label: '', separator: true },
        { key: 'fullscreen', label: 'Enter Full Screen', shortcut: '⌃⌘F', action: 'toggleFullscreen' },
      ],
    },
    {
      label: 'Window',
      items: [
        { key: 'minimize', label: 'Minimize', shortcut: '⌘M', action: 'minimize' },
        { key: 'zoom', label: 'Zoom', action: 'zoom' },
        { key: 'sep1', label: '', separator: true },
        { key: 'bring-all', label: 'Bring All to Front', action: 'bringAllToFront' },
      ],
    },
  ],
};

export const PMP_MASTERY_CONFIG: AppConfig = {
  id: 'pmpmastery',
  name: 'PMP Mastery',
  icon: PmpMasteryLogo,
  rawIcon: true,
  fullBleedIcon: true,
  iconColor: ['#F59E0B', '#D97706'],
  render: PmpMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  mobileFullscreen: true,
  defaultSize: { width: 1300, height: 840 },
  minSize: { width: 320, height: 420 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'learn', label: 'Học tư duy — 16 module, quiz, dẫn chứng', action: 'tab:learn' },
    { key: 'canvas', label: 'PMP Mindset Canvas (1 trang)', action: 'tab:canvas' },
    { key: 'decision', label: 'Cây quyết định tình huống', action: 'tab:decision' },
    { key: 'lookup', label: 'Bảng đối chiếu & Kho Deep Link', action: 'tab:lookup' },
    { key: 'sep2', label: '', action: '', separator: true },
    { key: 'mindmap', label: 'Mở PMP Mindmap (Tab mới ↗)', action: 'openMindmapExternal' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'search', label: 'Quick Search...', shortcut: '⌘K', action: 'quickSearch' },
        { key: 'settings', label: 'Preferences & Backup...', shortcut: '⌘,', action: 'openSettings' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'learn', label: 'Học tư duy — 16 module, quiz, SRS', shortcut: '⌘1', action: 'tab:learn' },
        { key: 'canvas', label: 'PMP Mindset Canvas (1 trang)', shortcut: '⌘2', action: 'tab:canvas' },
        { key: 'decision', label: 'Cây quyết định tình huống', shortcut: '⌘3', action: 'tab:decision' },
        { key: 'lookup', label: 'Bảng đối chiếu & Kho Deep Link', shortcut: '⌘4', action: 'tab:lookup' },
        { key: 'sepv', label: '', separator: true },
        { key: 'mindmap', label: 'Mở PMP Mindmap (Tab mới ↗)', action: 'openMindmapExternal' },
        { key: 'sep1', label: '', separator: true },
        { key: 'fullscreen', label: 'Enter Full Screen', shortcut: '⌃⌘F', action: 'toggleFullscreen' },
      ],
    },
    {
      label: 'Window',
      items: [
        { key: 'minimize', label: 'Minimize', shortcut: '⌘M', action: 'minimize' },
        { key: 'zoom', label: 'Zoom', action: 'zoom' },
        { key: 'sep1', label: '', separator: true },
        { key: 'bring-all', label: 'Bring All to Front', action: 'bringAllToFront' },
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'canvas-help', label: 'PMP Mindset Canvas (PMBOK 8 & ECO 2026)', action: 'tab:canvas' },
        { key: 'mindmap-help', label: 'PMP Mindmap Companion App ↗', action: 'openMindmapExternal' },
      ],
    },
  ],
};

export const REDIS_MASTERY_CONFIG: AppConfig = {
  id: 'redismastery',
  name: 'Redis Mastery',
  icon: RedisMasteryLogo,
  rawIcon: true,
  fullBleedIcon: true,
  iconColor: ['#E11D48', '#DC2626'],
  render: RedisMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  mobileFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 320, height: 420 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'learn', label: 'Học — 18 module, bài thực hành, quiz', action: 'tab:learn' },
    { key: 'simulator', label: 'Mô phỏng RAM Eviction & 16384 Hash Slots', action: 'tab:simulator' },
    { key: 'flow-studio', label: 'Sơ đồ Động 6 Luồng Kiến trúc', action: 'tab:flow-studio' },
    { key: 'incidents', label: 'War-Room 8 Sự cố Production', action: 'tab:incidents' },
    { key: 'glossary', label: 'Từ điển Lệnh, Big-O & Node/Python SDK', action: 'tab:glossary' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'search', label: 'Quick Search...', shortcut: '⌘K', action: 'quickSearch' },
        { key: 'settings', label: 'Preferences & Backup...', shortcut: '⌘,', action: 'openSettings' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'learn', label: 'Học — 18 module, bài thực hành, quiz', shortcut: '⌘1', action: 'tab:learn' },
        { key: 'simulator', label: 'Mô phỏng RAM Eviction & Cluster', shortcut: '⌘2', action: 'tab:simulator' },
        { key: 'flow-studio', label: 'Sơ đồ Động 6 Luồng Kiến trúc', shortcut: '⌘3', action: 'tab:flow-studio' },
        { key: 'incidents', label: 'War-Room 8 Sự cố Production', shortcut: '⌘4', action: 'tab:incidents' },
        { key: 'glossary', label: 'Từ điển Lệnh, Big-O & SDK', shortcut: '⌘5', action: 'tab:glossary' },
        { key: 'sep1', label: '', separator: true },
        { key: 'fullscreen', label: 'Enter Full Screen', shortcut: '⌃⌘F', action: 'toggleFullscreen' },
      ],
    },
    {
      label: 'Window',
      items: [
        { key: 'minimize', label: 'Minimize', shortcut: '⌘M', action: 'minimize' },
        { key: 'zoom', label: 'Zoom', action: 'zoom' },
        { key: 'sep1', label: '', separator: true },
        { key: 'bring-all', label: 'Bring All to Front', action: 'bringAllToFront' },
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'glossary-help', label: 'Redis 8 Command & Big-O Reference', action: 'tab:glossary' },
        { key: 'warroom-help', label: '8 Production Redis Incident War-Room', action: 'tab:incidents' },
      ],
    },
  ],
};

export type LearningAppId =
  | 'pymastery'
  | 'kubemastery'
  | 'cicdmastery'
  | 'pmpmastery'
  | 'redismastery';

export const ALL_LEARNING_APPS: AppConfig[] = [
  PYMASTERY_CONFIG,
  REDIS_MASTERY_CONFIG,
  KUBEMASTERY_CONFIG,
  CICD_MASTERY_CONFIG,
  PMP_MASTERY_CONFIG,
];

export const switchLearningApp = (
  targetAppId: LearningAppId
) => {
  try {
    const store = useStore.getState();
    const targetConfig =
      targetAppId === 'redismastery'
        ? REDIS_MASTERY_CONFIG
        : targetAppId === 'pmpmastery'
        ? PMP_MASTERY_CONFIG
        : targetAppId === 'cicdmastery'
        ? CICD_MASTERY_CONFIG
        : targetAppId === 'kubemastery'
        ? KUBEMASTERY_CONFIG
        : PYMASTERY_CONFIG;

    const existingWin = Object.values(store.windows).find(
      (w) => w.appId === targetAppId
    );

    if (existingWin) {
      if (existingWin.isMinimized && store.restoreWindow) {
        store.restoreWindow(existingWin.id);
      }
      if (store.focusWindow) {
        store.focusWindow(existingWin.id);
      }
      if (!existingWin.isFullScreen && store.enterFullScreen) {
        store.enterFullScreen(existingWin.id);
      }
    } else if (store.launchApp) {
      const winId = store.launchApp(targetConfig, {
        isFullScreen: false,
        isMaximized: false,
      });
      if (winId && store.enterFullScreen) {
        store.enterFullScreen(winId);
      }
    }
  } catch (err) {
    console.error('Failed to switch app:', err);
  }
};

export const closeLearningApp = (
  appId: LearningAppId,
  windowId?: string
) => {
  try {
    const store = useStore.getState();
    if (windowId && store.windows[windowId]) {
      store.closeWindow(windowId);
      return;
    }
    Object.values(store.windows)
      .filter((w) => w.appId === appId)
      .forEach((w) => store.closeWindow(w.id));
  } catch (err) {
    console.error('Failed to close app:', err);
  }
};

import { useStore, type AppConfig } from '@sonth87/device-layout';
import { PyMasteryApp } from './pymastery/PyMasteryApp';
import { KubeMasteryApp } from './kubemastery/KubeMasteryApp';
import { CicdMasteryApp } from './cicdmastery/CicdMasteryApp';

export const PYMASTERY_CONFIG: AppConfig = {
  id: 'pymastery',
  name: 'Python Mastery',
  icon: 'lucide:Terminal',
  iconColor: ['#10B981', '#059669'],
  render: PyMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 640, height: 480 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'curriculum', label: 'Lộ trình & Lý thuyết', action: 'tab:curriculum' },
    { key: 'playground', label: 'Playground & Studio IDE', action: 'tab:playground' },
    { key: 'practice', label: 'Thực hành Code', action: 'tab:practice' },
    { key: 'samples', label: 'Dự án Mẫu (16 Projects IDE)', action: 'tab:samples' },
    { key: 'glossary', label: 'Từ điển Python', action: 'tab:glossary' },
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
        { key: 'curriculum', label: 'Lộ trình & Lý thuyết', shortcut: '⌘1', action: 'tab:curriculum' },
        { key: 'playground', label: 'Playground & Studio IDE', shortcut: '⌘2', action: 'tab:playground' },
        { key: 'practice', label: 'Thực hành Code', shortcut: '⌘3', action: 'tab:practice' },
        { key: 'samples', label: 'Dự án Mẫu (16 Projects IDE)', shortcut: '⌘4', action: 'tab:samples' },
        { key: 'flashcards', label: 'Flashcards (SRS)', shortcut: '⌘5', action: 'tab:flashcards' },
        { key: 'exams', label: 'Thi Sát hạch', shortcut: '⌘6', action: 'tab:exams' },
        { key: 'glossary', label: 'Từ điển Python', shortcut: '⌘7', action: 'tab:glossary' },
        { key: 'reference', label: 'Chuyên đề PDF', shortcut: '⌘8', action: 'tab:reference' },
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
  icon: 'lucide:Container',
  iconColor: ['#0EA5E9', '#2563EB'],
  render: KubeMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 640, height: 480 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'search', label: 'Tìm kiếm nhanh (⌘K)', action: 'quickSearch' },
    { key: 'sep1', label: '', action: '', separator: true },
    { key: 'curriculum', label: 'Lộ trình & Lý thuyết', action: 'tab:curriculum' },
    { key: 'flow-studio', label: 'Sơ đồ Động (Animated Flows)', action: 'tab:flow-studio' },
    { key: 'cluster-sim', label: 'Mô phỏng Cụm K8s & Terminal', action: 'tab:cluster-sim' },
    { key: 'cicd-sim', label: 'Giả lập CI/CD & GitOps', action: 'tab:cicd-sim' },
    { key: 'incidents', label: '8 Tình huống Sự cố (War-Room)', action: 'tab:incidents' },
    { key: 'practice', label: 'Luyện tập Viết YAML/Dockerfile', action: 'tab:practice' },
    { key: 'glossary', label: 'Từ điển Liên tưởng & Cheatsheet', action: 'tab:glossary' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'search', label: 'Quick Search...', shortcut: '⌘K', action: 'quickSearch' },
        { key: 'sep1', label: '', separator: true },
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'curriculum', label: 'Lộ trình & Lý thuyết', shortcut: '⌘1', action: 'tab:curriculum' },
        { key: 'flow-studio', label: 'Sơ đồ Động (Animated Flows)', shortcut: '⌘2', action: 'tab:flow-studio' },
        { key: 'cluster-sim', label: 'Mô phỏng Cụm K8s & Terminal', shortcut: '⌘3', action: 'tab:cluster-sim' },
        { key: 'cicd-sim', label: 'Giả lập CI/CD & GitOps', shortcut: '⌘4', action: 'tab:cicd-sim' },
        { key: 'incidents', label: '8 Tình huống Sự cố (War-Room)', shortcut: '⌘5', action: 'tab:incidents' },
        { key: 'practice', label: 'Luyện tập Viết YAML/Dockerfile', shortcut: '⌘6', action: 'tab:practice' },
        { key: 'glossary', label: 'Từ điển Liên tưởng & Cheatsheet', shortcut: '⌘7', action: 'tab:glossary' },
        { key: 'exams', label: 'Flashcards & Thi Sát hạch', shortcut: '⌘8', action: 'tab:exams' },
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
  icon: 'lucide:Workflow',
  iconColor: ['#06B6D4', '#3B82F6'],
  render: CicdMasteryApp,
  defaultMaximized: false,
  defaultFullscreen: true,
  defaultSize: { width: 1280, height: 820 },
  minSize: { width: 640, height: 480 },
  hasMenuBar: true,
  launchMode: 'single',
  contextMenu: [
    { key: 'curriculum', label: 'Lộ trình & Sơ đồ Luồng (21 Trang PDF)', action: 'tab:curriculum' },
    { key: 'simulator', label: 'Giả lập Pipeline, DAG & Zero-Downtime', action: 'tab:simulator' },
    { key: 'warroom', label: 'Mô phỏng Tình huống Thực chiến (A1–B7)', action: 'tab:warroom' },
    { key: 'practice', label: 'Thực hành Viết & Sửa Cấu hình YAML/K8s', action: 'tab:practice' },
    { key: 'blueprints', label: '4 Bộ Full Flow Blueprints IDE', action: 'tab:blueprints' },
    { key: 'flashcards', label: 'Flashcards (SRS)', action: 'tab:flashcards' },
    { key: 'exams', label: 'Thi Sát hạch CI/CD', action: 'tab:exams' },
    { key: 'glossary', label: 'Từ điển & Ma trận Kiến trúc', action: 'tab:glossary' },
  ],
  menuBarMenus: [
    {
      label: 'File',
      items: [
        { key: 'close', label: 'Close Window', shortcut: '⌘W', action: 'close' },
      ],
    },
    {
      label: 'View',
      items: [
        { key: 'curriculum', label: 'Lộ trình & Sơ đồ Luồng', shortcut: '⌘1', action: 'tab:curriculum' },
        { key: 'simulator', label: 'Giả lập Pipeline & Traffic', shortcut: '⌘2', action: 'tab:simulator' },
        { key: 'warroom', label: 'Mô phỏng Tình huống (B1–B7)', shortcut: '⌘3', action: 'tab:warroom' },
        { key: 'practice', label: 'Thực hành Cấu hình YAML/K8s', shortcut: '⌘4', action: 'tab:practice' },
        { key: 'blueprints', label: '4 Bộ Full Flow Blueprints', shortcut: '⌘5', action: 'tab:blueprints' },
        { key: 'flashcards', label: 'Flashcards (SRS)', shortcut: '⌘6', action: 'tab:flashcards' },
        { key: 'exams', label: 'Thi Sát hạch', shortcut: '⌘7', action: 'tab:exams' },
        { key: 'glossary', label: 'Từ điển & Ma trận', shortcut: '⌘8', action: 'tab:glossary' },
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

export const ALL_LEARNING_APPS: AppConfig[] = [
  PYMASTERY_CONFIG,
  CICD_MASTERY_CONFIG,
  KUBEMASTERY_CONFIG,
];

export const switchLearningApp = (
  targetAppId: 'pymastery' | 'kubemastery' | 'cicdmastery'
) => {
  try {
    const store = useStore.getState();
    const targetConfig =
      targetAppId === 'cicdmastery'
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

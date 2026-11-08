import type { AppConfig } from '@sonth87/device-layout';
import { PyMasteryApp } from './pymastery/PyMasteryApp';

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
    { key: 'practice', label: 'Thực hành Code', action: 'tab:practice' },
    { key: 'samples', label: 'Dự án Mẫu (10 Projects IDE)', action: 'tab:samples' },
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
        { key: 'practice', label: 'Thực hành Code', shortcut: '⌘2', action: 'tab:practice' },
        { key: 'samples', label: 'Dự án Mẫu (10 Projects IDE)', shortcut: '⌘3', action: 'tab:samples' },
        { key: 'flashcards', label: 'Flashcards (SRS)', shortcut: '⌘4', action: 'tab:flashcards' },
        { key: 'exams', label: 'Thi Sát hạch', shortcut: '⌘5', action: 'tab:exams' },
        { key: 'glossary', label: 'Từ điển Python', shortcut: '⌘6', action: 'tab:glossary' },
        { key: 'reference', label: 'Chuyên đề PDF', shortcut: '⌘7', action: 'tab:reference' },
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

export const ALL_LEARNING_APPS: AppConfig[] = [
  PYMASTERY_CONFIG,
];

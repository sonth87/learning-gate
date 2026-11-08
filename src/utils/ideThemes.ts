import { IdeThemeId } from '@/types/user.types';

export interface IdeThemeConfig {
  id: IdeThemeId;
  name: string;
  badge: string;
  isLight: boolean;
  swatchColors: [string, string, string];
  editorBg: string;
  gutterBg: string;
  gutterBorder: string;
  gutterText: string;
  gutterActiveText: string;
  barBg: string;
  barBorder: string;
  barText: string;
  caretClass: string;
  selectionClass: string;
}

export const IDE_THEMES: IdeThemeConfig[] = [
  {
    id: 'nord',
    name: 'Nord Ice (Xanh Bắc Âu)',
    badge: 'Dịu mắt',
    isLight: false,
    swatchColors: ['#2e3440', '#88c0d0', '#a3be8c'],
    editorBg: '#242933',
    gutterBg: '#1e222a',
    gutterBorder: '#3b4252',
    gutterText: '#616e88',
    gutterActiveText: '#88c0d0',
    barBg: '#1e222a',
    barBorder: '#3b4252',
    barText: '#d8dee9',
    caretClass: 'caret-cyan-300',
    selectionClass: 'selection:bg-cyan-400/25',
  },
  {
    id: 'dracula',
    name: 'Dracula (Tím Đêm)',
    badge: 'Phổ biến',
    isLight: false,
    swatchColors: ['#282a36', '#bd93f9', '#50fa7b'],
    editorBg: '#232530',
    gutterBg: '#1d1e28',
    gutterBorder: '#44475a',
    gutterText: '#6272a4',
    gutterActiveText: '#50fa7b',
    barBg: '#191a23',
    barBorder: '#44475a',
    barText: '#f8f8f2',
    caretClass: 'caret-purple-400',
    selectionClass: 'selection:bg-purple-500/30',
  },
  {
    id: 'monokai',
    name: 'Monokai (Xám Nâu Ấm)',
    badge: 'Cổ điển',
    isLight: false,
    swatchColors: ['#272822', '#f92672', '#a6e22e'],
    editorBg: '#272822',
    gutterBg: '#1e1f1c',
    gutterBorder: '#3e3d32',
    gutterText: '#75715e',
    gutterActiveText: '#a6e22e',
    barBg: '#1e1f1c',
    barBorder: '#3e3d32',
    barText: '#f8f8f2',
    caretClass: 'caret-amber-400',
    selectionClass: 'selection:bg-amber-500/25',
  },
  {
    id: 'github-light',
    name: 'GitHub Light (Trắng Sáng)',
    badge: 'Nền sáng',
    isLight: true,
    swatchColors: ['#ffffff', '#0969da', '#cf222e'],
    editorBg: '#ffffff',
    gutterBg: '#f6f8fa',
    gutterBorder: '#d0d7de',
    gutterText: '#8c959f',
    gutterActiveText: '#0969da',
    barBg: '#f6f8fa',
    barBorder: '#d0d7de',
    barText: '#24292f',
    caretClass: 'caret-blue-600',
    selectionClass: 'selection:bg-blue-500/20',
  },
  {
    id: 'solarized-light',
    name: 'Solarized (Kem Ấm)',
    badge: 'Chống mỏi mắt',
    isLight: true,
    swatchColors: ['#fdf6e3', '#268bd2', '#859900'],
    editorBg: '#fdf6e3',
    gutterBg: '#eee8d5',
    gutterBorder: '#d8d0b8',
    gutterText: '#93a1a1',
    gutterActiveText: '#b58900',
    barBg: '#eee8d5',
    barBorder: '#d8d0b8',
    barText: '#073642',
    caretClass: 'caret-amber-700',
    selectionClass: 'selection:bg-amber-500/20',
  },
  {
    id: 'vscode-dark',
    name: 'Midnight Dark (Đen Xanh)',
    badge: 'Tương phản cao',
    isLight: false,
    swatchColors: ['#090d16', '#34d399', '#c084fc'],
    editorBg: '#090d16',
    gutterBg: '#0f172a',
    gutterBorder: '#1e293b',
    gutterText: '#475569',
    gutterActiveText: '#34d399',
    barBg: '#0f172a',
    barBorder: '#1e293b',
    barText: '#cbd5e1',
    caretClass: 'caret-emerald-400',
    selectionClass: 'selection:bg-emerald-500/25',
  },
];

export function getIdeThemeConfig(id?: IdeThemeId): IdeThemeConfig {
  return IDE_THEMES.find((t) => t.id === id) || IDE_THEMES[0];
}

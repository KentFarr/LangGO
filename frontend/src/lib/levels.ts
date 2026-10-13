import type { JlptLevel } from './words';

export interface LevelInfo {
  level: JlptLevel;
  label: string;
  description: string;
  /** A representative word from that level's list. */
  example: { word: string; reading: string; meaning: string };
  /** Tailwind classes for the level's pastel (background and a solid swatch). */
  bg: string;
  dot: string;
}

/** Easiest first, as shown in pickers and lists. Colors are the pastel tokens in index.css. */
export const LEVELS: readonly LevelInfo[] = [
  {
    level: 5,
    label: 'N5',
    description: 'Basic words for everyday situations',
    example: { word: '学校', reading: 'がっこう', meaning: 'school' },
    bg: 'bg-sage',
    dot: 'bg-[#8fb08a]',
  },
  {
    level: 4,
    label: 'N4',
    description: 'Elementary vocabulary for daily life',
    example: { word: '約束', reading: 'やくそく', meaning: 'promise' },
    bg: 'bg-sky',
    dot: 'bg-[#86a9c6]',
  },
  {
    level: 3,
    label: 'N3',
    description: 'Intermediate words for news and conversation',
    example: { word: '環境', reading: 'かんきょう', meaning: 'environment' },
    bg: 'bg-lavender',
    dot: 'bg-[#a199c9]',
  },
  {
    level: 2,
    label: 'N2',
    description: 'Upper-intermediate words from articles and work',
    example: { word: '構造', reading: 'こうぞう', meaning: 'structure' },
    bg: 'bg-peach',
    dot: 'bg-[#d6a47c]',
  },
  {
    level: 1,
    label: 'N1',
    description: 'Advanced vocabulary for literature and essays',
    example: { word: '把握', reading: 'はあく', meaning: 'grasp, understanding' },
    bg: 'bg-sakura',
    dot: 'bg-[#d68c9a]',
  },
];

export function levelInfo(level: number | null | undefined): LevelInfo | undefined {
  return LEVELS.find((info) => info.level === level);
}

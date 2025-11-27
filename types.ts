export interface DreamFragment {
  id: string;
  text: string;
  characters: string[];
  locations: string[];
  emotions: string[];
  colors: string[];
  actions: string[];
  energy_score: number; // 0-100
  interpretation: string;
}

export interface Dream {
  id: string;
  rawText: string;
  context?: string; // Recent events/mood
  reentryRecord?: string; // Advanced spiritual dialogue/rewrite
  date: string; // ISO String
  fragments: DreamFragment[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  condition: (dreams: Dream[]) => boolean;
  unlocked: boolean;
}

export interface StatData {
  name: string;
  value: number;
  fill?: string;
}

export type View = 'home' | 'journal' | 'dashboard' | 'graph';
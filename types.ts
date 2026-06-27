export interface ImportantDate {
  id: string;
  title: string;
  date: string;
  icon: string;
  description: string;
}

export interface Config {
  startDate: string;
  user: string;
  partner: string;
  importantDates: ImportantDate[];
}

export interface Note {
  id: string;
  content: string;
  date: string;
  color: string;
  author: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  photoUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  likes: number;
}

export interface FullData {
  config: Config;
  notes: Note[];
  memories: Memory[];
}

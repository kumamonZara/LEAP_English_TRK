export interface Word {
  id: number;
  en: string;
  ja: string;
}

export enum AppMode {
  START = 'START',
  LIST_VIEW = 'LIST_VIEW', // 1. Word List
  RANDOM_CHOICE = 'RANDOM_CHOICE', // 2. Random Choice (Eng -> Jap)
  TYPING = 'TYPING', // 3. Typing (Jap -> Eng)
  SEQUENTIAL_CHOICE = 'SEQUENTIAL_CHOICE', // 4. Sequential Choice (Eng -> Jap)
  MIXED = 'MIXED', // 5. Mixed (Typing + Sequential)
  REVIEW = 'REVIEW', // 6. Review Mistakes
}

export interface QuizState {
  currentIndex: number;
  correctCount: number;
  mistakes: number[]; // Array of Word IDs
  complete: boolean;
  shuffledQueue: number[]; // Array of Word IDs for random modes
}

export type Range = {
  start: number;
  end: number;
};
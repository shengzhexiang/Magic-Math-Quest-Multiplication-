export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  FEEDBACK = 'FEEDBACK',
  END = 'END',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
}

export interface Question {
  num1: number;
  num2: number;
  answer: number;
  type: QuestionType;
  options?: number[]; // Only for multiple choice
}

export interface GameStats {
  score: number;
  totalAnswered: number;
  streak: number;
}
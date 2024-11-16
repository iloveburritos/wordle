// lib/types.ts

export enum LetterState {
  CORRECT = '🟩',
  PRESENT = '🟨',
  ABSENT = '⬜',
  INITIAL = ''
}

export type GameTile = {
  letter: string;
  state: LetterState;
};

export type GameBoard = GameTile[][]; // 6 rows of 5 tiles each

export type EncryptedGameResult = string; // Represents the 30-character encrypted string

export interface GameResult {
  board: GameBoard;
  encryptedString: EncryptedGameResult;
  isSuccessful: boolean;
  score: number;
}
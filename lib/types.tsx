// lib/types.tsx

export const enum LetterState {
    INITIAL = 0,
    CORRECT = 'correct',
    PRESENT = 'present',
    ABSENT = 'absent'
  }
 export const icons = {
    [LetterState.CORRECT]: '🟩',
    [LetterState.PRESENT]: '🟨',
    [LetterState.ABSENT]: '⬜',
    [LetterState.INITIAL]: null
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
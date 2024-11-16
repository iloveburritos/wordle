// lib/types.tsx

// Define interface for ciphertext and dataToEncryptHash
export interface EncryptedResult {
  ciphertext: string;
  dataToEncryptHash: string;
}

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
  
  export type EncryptedGameResult = EncryptedResult; // Represents the 30-character encrypted string
  
  export interface GameResult {
    board: GameBoard;
    encryptedString: EncryptedGameResult;
    isSuccessful: boolean;
    score: number;
  }
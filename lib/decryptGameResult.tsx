// components/decryptGameResult.tsx

import { LetterState, GameBoard, EncryptedGameResult } from '../lib/types';

export function decryptGameResult(encryptedString: EncryptedGameResult): GameBoard {
  // Map each character back to the corresponding LetterState
  const decryptionMap: { [key: string]: LetterState } = {
    G: LetterState.CORRECT,
    Y: LetterState.PRESENT,
    X: LetterState.ABSENT,
  };

  // Split the string into 5-character rows to recreate the GameBoard structure
  const rows = encryptedString.match(/.{1,5}/g) || [];

  const gameBoard: GameBoard = rows.map(row =>
    row.split('').map(char => ({
      letter: '', // We don't store letters, so this is empty
      state: decryptionMap[char] || LetterState.INITIAL,
    }))
  );

  return gameBoard;
}
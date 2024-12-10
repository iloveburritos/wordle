// components/decryptGameResult.tsx

import { LetterState, GameBoard, EncryptedGameResult } from '../lib/types';

export function decryptGameResult(encryptedResult: EncryptedGameResult): GameBoard {
  // Map each character back to the corresponding LetterState
  const decryptionMap: { [key: string]: LetterState } = {
    G: LetterState.CORRECT,
    Y: LetterState.PRESENT,
    X: LetterState.ABSENT,
  };

  // Split the decrypted string into 5-character rows
  const rows = encryptedResult.ciphertext.match(/.{1,5}/g) || [];

  const gameBoard: GameBoard = rows.map((row: string) =>
    row.split('').map((char: string) => ({
      letter: '', // We don't store letters, so this is empty
      state: decryptionMap[char] || LetterState.INITIAL,
    }))
  );

  return gameBoard;
}
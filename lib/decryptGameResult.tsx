// components/decryptGameResult.tsx

import { LetterState, GameBoard, EncryptedGameResult } from '../lib/types';

export function decryptGameResult(encryptedResult: EncryptedGameResult): GameBoard {
  // Map each character back to the corresponding LetterState
  const decryptionMap: { [key: string]: LetterState } = {
    G: LetterState.CORRECT,
    Y: LetterState.PRESENT,
    X: LetterState.ABSENT,
  };

  // Ensure we have a valid string of GYX characters
  if (!encryptedResult.ciphertext.match(/^[GYX]+$/)) {
    console.error('Invalid decrypted string format:', encryptedResult.ciphertext);
    // Return an empty board if the format is invalid
    return Array(6).fill(null).map(() => 
      Array(5).fill(null).map(() => ({ letter: '', state: LetterState.INITIAL }))
    );
  }

  // Split the decrypted string into 5-character rows
  const rows = encryptedResult.ciphertext.match(/.{1,5}/g) || [];
  console.log('Decrypted rows:', rows);

  const gameBoard: GameBoard = rows.map((row: string) => {
    console.log('Processing row:', row);
    return row.split('').map((char: string) => {
      const state = decryptionMap[char] || LetterState.INITIAL;
      console.log(`Character ${char} maps to state ${state}`);
      return {
        letter: '', // We don't store letters, so this is empty
        state: state,
      };
    });
  });

  // Fill remaining rows with INITIAL state if needed
  while (gameBoard.length < 6) {
    gameBoard.push(Array(5).fill(null).map(() => ({ 
      letter: '', 
      state: LetterState.INITIAL 
    })));
  }

  console.log('Final game board:', gameBoard);
  return gameBoard;
}
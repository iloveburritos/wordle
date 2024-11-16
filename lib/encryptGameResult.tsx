// components/encryptGameResult.tsx

import { LetterState, GameBoard } from '../lib/types';

export function encryptGameResult(board: GameBoard): string {
  // Map each LetterState to its corresponding character
  const encryptionMap: { [key in LetterState]: string } = {
    [LetterState.CORRECT]: 'G',
    [LetterState.PRESENT]: 'Y',
    [LetterState.ABSENT]: 'X',
    [LetterState.INITIAL]: 'X' // Treat INITIAL as ABSENT for unfilled tiles
  };

  // Flatten the board up to the number of guesses used and map to the encrypted characters
  let encryptedString = board
    .slice(0, board.findIndex(row => row.some(tile => tile.state === LetterState.INITIAL)) + 1 || board.length) // Only include rows that were guessed
    .flat() // Flatten to a single array of GameTiles
    .map(tile => encryptionMap[tile.state]) // Map each tile to 'G', 'Y', or 'X'
    .join('');

  return encryptedString; // No padding, return as-is
}
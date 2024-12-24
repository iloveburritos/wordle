//lib/stringToGameBoard.ts

import { LetterState, GameBoard } from './types';

export function stringToGameBoard(decryptedString: string): GameBoard {
  // Map each state character back to the corresponding LetterState
  const stateMap: { [key: string]: LetterState } = {
    'G': LetterState.CORRECT,
    'Y': LetterState.PRESENT,
    'X': LetterState.ABSENT
  };

  // Split the string into 5-character chunks to create rows
  const rows = decryptedString.match(/.{1,5}/g) || [];

  // Convert each chunk into a row of GameTiles
  const gameBoard: GameBoard = rows.map(row =>
    row.split('').map(stateChar => ({
      letter: '', // We don't store letters, so this remains empty
      state: stateMap[stateChar] || LetterState.INITIAL,
    }))
  );

  return gameBoard;
} 
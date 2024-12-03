// components/encryptGameResult.tsx

import { LetterState, GameBoard } from '../lib/types';
import { encryptStringWithContractConditions } from './litUtils';

// Define interface that is encrypted string and hash
export interface EncryptedResult {
  ciphertext: string;
  dataToEncryptHash: string;
}

export async function encryptGameResult(board: GameBoard): Promise<EncryptedResult> {
  const encryptionMap: { [key in LetterState]: string } = {
    [LetterState.CORRECT]: 'G',
    [LetterState.PRESENT]: 'Y',
    [LetterState.ABSENT]: 'X',
    [LetterState.INITIAL]: 'X'
  };

  // Find the last completed row (where all tiles have a non-INITIAL state)
  const lastCompletedRowIndex = board.findIndex(row => row.some(tile => tile.state === LetterState.INITIAL));
  const completedRows = lastCompletedRowIndex === -1 ? board : board.slice(0, lastCompletedRowIndex);

  // Flatten only the completed rows and map to encrypted characters
  const encryptedString = completedRows
    .flat()
    .map(tile => encryptionMap[tile.state])
    .join('');

  console.log('Encrypting game result:', encryptedString);
  const encryptedResult = await encryptStringWithContractConditions(encryptedString);
  if (!encryptedResult) {
    throw new Error('Encryption failed');
  }
  return encryptedResult;
}
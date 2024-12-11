// components/encryptGameResult.tsx

import { LetterState, GameBoard } from '../lib/types';
import { encryptStringWithContractConditions } from './litUtils';

// Define interface that is encrypted string and hash
export interface EncryptedResult {
  ciphertext: string;
  dataToEncryptHash: string;
}

export async function encryptGameResult(board: GameBoard): Promise<EncryptedResult> {
  console.log('Original game board:', board);
  
  const encryptionMap: { [key in LetterState]: string } = {
    [LetterState.CORRECT]: 'G',
    [LetterState.PRESENT]: 'Y',
    [LetterState.ABSENT]: 'X',
    [LetterState.INITIAL]: 'X'
  };

  // Find the last completed row (where all tiles have a non-INITIAL state)
  const lastCompletedRowIndex = board.findIndex(row => row.some(tile => tile.state === LetterState.INITIAL));
  const completedRows = lastCompletedRowIndex === -1 ? board : board.slice(0, lastCompletedRowIndex);

  console.log('Completed rows before encryption:', completedRows);

  // Flatten only the completed rows and map to encrypted characters
  const encryptedString = completedRows
    .flat()
    .map(tile => {
      const mappedChar = encryptionMap[tile.state];
      if (!mappedChar) {
        console.error('Invalid state encountered:', tile.state);
        return 'X'; // fallback
      }
      return mappedChar;
    })
    .join('');

  console.log('String to be encrypted:', encryptedString);
  console.log('String length:', encryptedString.length);
  console.log('Character breakdown:', encryptedString.split('').map(char => `'${char}'`).join(', '));

  const encryptedResult = await encryptStringWithContractConditions(encryptedString);
  if (!encryptedResult) {
    throw new Error('Encryption failed');
  }
  
  console.log('Encrypted result:', {
    ciphertext: encryptedResult.ciphertext.substring(0, 20) + '...',
    dataToEncryptHash: encryptedResult.dataToEncryptHash
  });
  
  return encryptedResult;
}
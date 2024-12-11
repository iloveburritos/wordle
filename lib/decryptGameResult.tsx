// components/decryptGameResult.tsx

import { LetterState, GameBoard, EncryptedGameResult } from '../lib/types';

export function decryptGameResult(encryptedString: EncryptedGameResult): string {
  // Map each character back to the corresponding LetterState
  const decryptionMap: { [key: string]: string } = {
    G: 'correct',
    Y: 'present',
    X: 'absent',
  };

  // Simply map each character to its decrypted state and return the full string
  return encryptedString.ciphertext
    .split('')
    .map(char => decryptionMap[char] || 'initial')
    .join('');
}
// components/Game.tsx

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getWordOfTheDay, allWords } from '../lib/words';
import Keyboard from './Keyboard';
import { LetterState, icons, GameBoard, GameResult } from '../lib/types';
import { encryptGameResult } from '../lib/encryptGameResult'; // Assuming you have this encryption function
import styles from '../styles/Game.module.css';
import GameOverModal from './GameOverModal';

// Define interface for ciphertext and dataToEncryptHash
export interface EncryptedResult {
  ciphertext: string;
  dataToEncryptHash: string;
}

export default function Game() {
  const answer = useMemo(() => getWordOfTheDay(), []);
  const [board, setBoard] = useState<GameBoard>(
    Array.from({ length: 6 }, () =>
      Array.from({ length: 5 }, () => ({
        letter: '',
        state: LetterState.INITIAL,
      }))
    )
  );

  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [grid, setGrid] = useState('');
  const [shakeRowIndex, setShakeRowIndex] = useState(-1);
  const [success, setSuccess] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});
  const [allowInput, setAllowInput] = useState(true);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [encryptedResult, setEncryptedResult] = useState<EncryptedResult | null>(null);
  
  // Construct the current row based on the current row index
  const currentRow = useMemo(() => board[currentRowIndex], [board, currentRowIndex]);

  // Key handling
  const onKey = useCallback(
    (key: string) => {
      if (!allowInput) return;
      if (/^[a-zA-Z]$/.test(key)) {
        fillTile(key.toLowerCase());
      } else if (key === 'Backspace') {
        clearTile();
      } else if (key === 'Enter') {
        completeRow();
      }
    },
    [allowInput, currentRowIndex, board]
  );

  useEffect(() => {
    const handleKeyup = (e: KeyboardEvent) => onKey(e.key);
    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [onKey]);

  // Function to handle sending result to API
  
  /*const sendResultToAPI = async (encryptedResult: string, isSuccessful: boolean, score: number) => {
    try {
      const response = await fetch('/api/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedResult,
          isSuccessful,
          score,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send result:', response.statusText);
      } else {
        console.log('Result sent successfully');
      }
    } catch (error) {
      console.error('Error sending result:', error);
    }
  };*/

  // Functions to handle tile filling, clearing, and row completion
  const fillTile = (letter: string) => {
    setBoard((prevBoard) => {
      const newBoard = [...prevBoard];
      const currentRow = [...newBoard[currentRowIndex]];
      const emptyTileIndex = currentRow.findIndex((tile) => !tile.letter);
      if (emptyTileIndex !== -1) {
        currentRow[emptyTileIndex] = { ...currentRow[emptyTileIndex], letter };
        newBoard[currentRowIndex] = currentRow;
      }
      return newBoard;
    });
  };

  const clearTile = () => {
    setBoard((prevBoard) => {
      const newBoard = [...prevBoard];
      const currentRow = [...newBoard[currentRowIndex]];
      const lastFilledTileIndex = currentRow.findIndex((tile) => !tile.letter) - 1;
      if (lastFilledTileIndex >= 0) {
        currentRow[lastFilledTileIndex] = { ...currentRow[lastFilledTileIndex], letter: '' };
      } else if (currentRow[4].letter) {
        currentRow[4] = { ...currentRow[4], letter: '' };
      }
      newBoard[currentRowIndex] = currentRow;
      return newBoard;
    });
  };

  const completeRow = () => {
    if (currentRow.every((tile) => tile.letter)) {
      const guess = currentRow.map((tile) => tile.letter).join('');
      if (!allWords.includes(guess) && guess !== answer) {
        shake();
        showMessage('Not in word list');
        return;
      }

      const answerLetters: (string | null)[] = answer.split('');
      const newRow = [...currentRow];

      // Mark tiles with the appropriate state
      newRow.forEach((tile, i) => {
        if (answerLetters[i] === tile.letter) {
          tile.state = LetterState.CORRECT;
          answerLetters[i] = null;
        }
      });

      newRow.forEach((tile) => {
        if (!tile.state && answerLetters.includes(tile.letter)) {
          tile.state = LetterState.PRESENT;
          answerLetters[answerLetters.indexOf(tile.letter)] = null;
        }
      });

      newRow.forEach((tile) => {
        if (!tile.state) {
          tile.state = LetterState.ABSENT;
        }
      });

      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        newBoard[currentRowIndex] = newRow;
        return newBoard;
      });

      setLetterStates((prevStates) => {
        const newStates = { ...prevStates };
        newRow.forEach((tile) => {
          if (
            tile.state === LetterState.CORRECT ||
            (tile.state === LetterState.PRESENT && newStates[tile.letter] !== LetterState.CORRECT) ||
            (!newStates[tile.letter] && tile.state === LetterState.ABSENT)
          ) {
            newStates[tile.letter] = tile.state;
          }
        });
        return newStates;
      });

      setAllowInput(false);

      if (newRow.every((tile) => tile.state === LetterState.CORRECT) || currentRowIndex === board.length - 1) {
        const finalSuccess = newRow.every((tile) => tile.state === LetterState.CORRECT);
        setTimeout(async () => {
          const message = finalSuccess ? ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'][currentRowIndex] : `The answer was ${answer.toUpperCase()}`;
          setGameOverMessage(message);
          setGrid(genResultGrid());
          setSuccess(finalSuccess);
          setIsGameOverModalOpen(true);

          // Encrypt and send the game result to the API endpoint
          const encryptedResult = await encryptGameResult(board);
          console.log('Encrypted result:', encryptedResult);
          setEncryptedResult(encryptedResult);
          //await sendResultToAPI(encryptedResult, finalSuccess, currentRowIndex + 1);
        }, 1600);
      } else if (currentRowIndex < board.length - 1) {
        setCurrentRowIndex((prevIndex) => prevIndex + 1);
        setTimeout(() => setAllowInput(true), 1600);
      }
    } else {
      shake();
      showMessage('Not enough letters');
    }
  };

  const showMessage = (msg: string, time = 1000) => {
    setMessage(msg);
    if (time > 0) {
      setTimeout(() => setMessage(''), time);
    }
  };

  const shake = () => {
    setShakeRowIndex(currentRowIndex);
    setTimeout(() => setShakeRowIndex(-1), 1000);
  };

  const genResultGrid = () => {
    return board
      .slice(0, currentRowIndex + 1)
      .map((row) => row.map((tile) => icons[tile.state]).join(''))
      .join('\n');
  };

  const handleShare = () => {
    console.log('Share functionality to be implemented');
  };

  const handleSeeResults = () => {
    console.log('See results functionality to be implemented');
  };

  return (
    <div className="pt-4">
      {message && <div className={styles.message}>{message}</div>}
      <div id="board" className={styles.board}>
        {board.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`${styles.row} ${shakeRowIndex === rowIndex ? styles.shake : ''} ${
              success && currentRowIndex === rowIndex ? styles.jump : ''
            }`}
          >
            {row.map((tile, tileIndex) => (
              <div
                key={tileIndex}
                className={`${styles.tile} ${tile.letter && styles.filled} ${tile.state && styles.revealed}`}
              >
                <div className={styles.front} style={{ transitionDelay: `${tileIndex * 300}ms` }}>
                  {tile.letter}
                </div>
                <div
                  className={`${styles.back} ${styles[tile.state]}`}
                  style={{
                    transitionDelay: `${tileIndex * 300}ms`,
                    animationDelay: `${tileIndex * 100}ms`,
                  }}
                >
                  {tile.letter}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Keyboard onKey={onKey} letterStates={letterStates} />
      {encryptedResult && (
        <GameOverModal
          isOpen={isGameOverModalOpen}
          onClose={() => setIsGameOverModalOpen(false)}
          onShare={handleShare}
          onSeeResults={handleSeeResults}
          gameResult={{
            board,
            encryptedString: encryptedResult, // Assuming encryption logic is handled elsewhere
            isSuccessful: success,
            score: currentRowIndex + 1,
          }}
          message={gameOverMessage}
        />
      )}
    </div>
  );
}
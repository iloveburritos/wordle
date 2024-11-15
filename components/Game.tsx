'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getWordOfTheDay, allWords } from '../lib/words'
import Keyboard from './Keyboard'
import { LetterState } from '../lib/types'
import styles from '../styles/Game.module.css'

const icons = {
  [LetterState.CORRECT]: '🟩',
  [LetterState.PRESENT]: '🟨',
  [LetterState.ABSENT]: '⬜',
  [LetterState.INITIAL]: null
}

export default function Game() {
  const answer = useMemo(() => getWordOfTheDay(), [])
  const [board, setBoard] = useState(
    Array.from({ length: 6 }, () =>
      Array.from({ length: 5 }, () => ({
        letter: '',
        state: LetterState.INITIAL
      }))
    )
  )
  const [currentRowIndex, setCurrentRowIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [grid, setGrid] = useState('')
  const [shakeRowIndex, setShakeRowIndex] = useState(-1)
  const [success, setSuccess] = useState(false)
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({})
  const [allowInput, setAllowInput] = useState(true)

  const currentRow = useMemo(() => board[currentRowIndex], [board, currentRowIndex])

  const onKey = useCallback((key: string) => {
    if (!allowInput) return
    if (/^[a-zA-Z]$/.test(key)) {
      fillTile(key.toLowerCase())
    } else if (key === 'Backspace') {
      clearTile()
    } else if (key === 'Enter') {
      completeRow()
    }
  }, [allowInput, currentRowIndex, board])

  useEffect(() => {
    const handleKeyup = (e: KeyboardEvent) => onKey(e.key)
    window.addEventListener('keyup', handleKeyup)
    return () => window.removeEventListener('keyup', handleKeyup)
  }, [onKey])

  const fillTile = (letter: string) => {
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      const row = newBoard[currentRowIndex];
      const emptyTileIndex = row.findIndex(tile => !tile.letter);
      if (emptyTileIndex !== -1) {
        row[emptyTileIndex] = { ...row[emptyTileIndex], letter: letter };
      }
      return newBoard;
    });
  }

  const clearTile = () => {
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      const row = newBoard[currentRowIndex];
      const lastFilledTileIndex = row.map(tile => tile.letter).lastIndexOf('');
      if (lastFilledTileIndex !== 5) {
        row[lastFilledTileIndex - 1] = { ...row[lastFilledTileIndex - 1], letter: '' };
      }
      return newBoard;
    });
  }

  const completeRow = () => {
    if (currentRow.every((tile) => tile.letter)) {
      const guess = currentRow.map((tile) => tile.letter).join('')
      if (!allWords.includes(guess) && guess !== answer) {
        shake()
        showMessage('Not in word list')
        return
      }

      const answerLetters: (string | null)[] = answer.split('')
      const newRow = [...currentRow]
      // first pass: mark correct ones
      newRow.forEach((tile, i) => {
        if (answerLetters[i] === tile.letter) {
          tile.state = LetterState.CORRECT
          answerLetters[i] = null
        }
      })
      // second pass: mark the present
      newRow.forEach((tile) => {
        if (!tile.state && answerLetters.includes(tile.letter)) {
          tile.state = LetterState.PRESENT
          answerLetters[answerLetters.indexOf(tile.letter)] = null
        }
      })
      // 3rd pass: mark absent
      newRow.forEach((tile) => {
        if (!tile.state) {
          tile.state = LetterState.ABSENT
        }
      })

      setBoard(prevBoard => {
        const newBoard = [...prevBoard]
        newBoard[currentRowIndex] = newRow
        return newBoard
      })

      setLetterStates(prevStates => {
        const newStates = { ...prevStates }
        newRow.forEach(tile => {
          if (tile.state === LetterState.CORRECT || 
              (tile.state === LetterState.PRESENT && newStates[tile.letter] !== LetterState.CORRECT) ||
              (!newStates[tile.letter] && tile.state === LetterState.ABSENT)) {
            newStates[tile.letter] = tile.state
          }
        })
        return newStates
      })

      setAllowInput(false)
      if (newRow.every((tile) => tile.state === LetterState.CORRECT)) {
        setTimeout(() => {
          setGrid(genResultGrid())
          showMessage(['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'][currentRowIndex], -1)
          setSuccess(true)
        }, 1600)
      } else if (currentRowIndex < board.length - 1) {
        setCurrentRowIndex(prevIndex => prevIndex + 1)
        setTimeout(() => {
          setAllowInput(true)
        }, 1600)
      } else {
        setTimeout(() => {
          showMessage(answer.toUpperCase(), -1)
        }, 1600)
      }
    } else {
      shake()
      showMessage('Not enough letters')
    }
  }

  const showMessage = (msg: string, time = 1000) => {
    setMessage(msg)
    if (time > 0) {
      setTimeout(() => {
        setMessage('')
      }, time)
    }
  }

  const shake = () => {
    setShakeRowIndex(currentRowIndex)
    setTimeout(() => {
      setShakeRowIndex(-1)
    }, 1000)
  }

  const genResultGrid = () => {
    return board
      .slice(0, currentRowIndex + 1)
      .map((row) => {
        return row.map((tile) => icons[tile.state]).join('')
      })
      .join('\n')
  }

  return (
    <div>
      {message && (
        <div className={styles.message}>
          {message}
          {grid && <pre>{grid}</pre>}
        </div>
      )}
      <header>
        <h1>VVORDLE</h1>
        <a
          id="source-link"
          href="https://github.com/yyx990803/vue-wordle"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
      </header>
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
                className={`${styles.tile} ${tile.letter && styles.filled} ${
                  tile.state && styles.revealed
                }`}
              >
                <div
                  className={styles.front}
                  style={{ transitionDelay: `${tileIndex * 300}ms` }}
                >
                  {tile.letter}
                </div>
                <div
                  className={`${styles.back} ${styles[tile.state]}`}
                  style={{
                    transitionDelay: `${tileIndex * 300}ms`,
                    animationDelay: `${tileIndex * 100}ms`
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
    </div>
  )
}
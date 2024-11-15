import React from 'react'
import { LetterState } from '../lib/types'
import styles from '../styles/Keyboard.module.css'

interface KeyboardProps {
  letterStates: Record<string, LetterState>
  onKey: (key: string) => void
}

const rows = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  ['Enter', ...'zxcvbnm'.split(''), 'Backspace']
]

export default function Keyboard({ letterStates, onKey }: KeyboardProps) {
  return (
    <div id="keyboard" className={styles.keyboard}>
      {rows.map((row, i) => (
        <div key={i} className={styles.row}>
          {i === 1 && <div className={styles.spacer}></div>}
          {row.map((key) => (
            <button
              key={key}
              className={`${styles.key} ${key.length > 1 ? styles.big : ''} ${
                styles[letterStates[key] || '']
              }`}
              onClick={() => onKey(key)}
            >
              {key !== 'Backspace' ? (
                key
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path
                    fill="currentColor"
                    d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"
                  ></path>
                </svg>
              )}
            </button>
          ))}
          {i === 1 && <div className={styles.spacer}></div>}
        </div>
      ))}
    </div>
  )
}
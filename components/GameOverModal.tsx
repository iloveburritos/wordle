'use client'

import React, { useState } from 'react';
import { EncryptedResult, GameBoard, GameResult } from '../lib/types';
import SubmitScoreModal from './SubmitScoreModal';
import StatsModal from './StatsModal';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeeResults: () => void;
  gameResult: {
    board: GameBoard;
    encryptedString: EncryptedResult;
    isSuccessful: boolean;
    score: number;
  };
  message: string;
}

export default function GameOverModal({
  isOpen,
  onClose,
  onSeeResults,
  gameResult,
  message
}: GameOverModalProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleScoreSubmitted = () => {
    setShowSubmitModal(false);
    setShowStatsModal(true);
  };

  const handleClose = () => {
    setShowSubmitModal(false);
    setShowStatsModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <SubmitScoreModal
        isOpen={showSubmitModal}
        onClose={handleClose}
        onScoreSubmitted={handleScoreSubmitted}
        gameResult={gameResult}
        message={message}
      />
      <StatsModal
        isOpen={showStatsModal}
        onClose={handleClose}
      />
    </>
  );
}
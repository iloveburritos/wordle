'use client'

import React, { useState } from 'react';
import { EncryptedResult, GameBoard } from '@/lib/types';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreSubmitted = () => {
    console.log("Score submitted successfully, showing stats modal");
    setShowSubmitModal(false);
    setShowStatsModal(true);
    setIsSubmitting(false);
  };

  const handleSubmitStart = () => {
    console.log("Starting score submission");
    setIsSubmitting(true);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      console.log("Closing modals");
      setShowSubmitModal(false);
      setShowStatsModal(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showSubmitModal && (
        <SubmitScoreModal
          isOpen={true}
          onClose={handleClose}
          onScoreSubmitted={handleScoreSubmitted}
          onSubmitStart={handleSubmitStart}
          gameResult={gameResult}
          message={message}
          isSubmitting={isSubmitting}
        />
      )}
      {showStatsModal && (
        <StatsModal
          isOpen={true}
          onClose={handleClose}
        />
      )}
    </>
  );
}
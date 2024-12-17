'use client'

import React, { useState } from 'react';
import { EncryptedResult, GameBoard } from '@/lib/types';
import SubmitScoreModal from './SubmitScoreModal';
import ViewScoresButton from '@/components/ViewScoresButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  gameResult,
  message
}: GameOverModalProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);

  const handleScoreSubmitted = () => {
    setShowSubmitModal(false);
    setIsSubmitting(false);
  };

  const handleSubmitStart = () => {
    setIsSubmitting(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {showSubmitModal ? (
        <SubmitScoreModal
          isOpen={true}
          onClose={onClose}
          onScoreSubmitted={handleScoreSubmitted}
          onSubmitStart={handleSubmitStart}
          gameResult={gameResult}
          message={message}
          isSubmitting={isSubmitting}
        />
      ) : (
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className="bg-black opacity-80">
            <DialogHeader>
              <DialogTitle>View Results</DialogTitle>
              <DialogDescription>
                {isSubmitting 
                  ? `Decrypting scores... ${decryptionProgress}%`
                  : "Ready to see how everyone performed?"
                }
              </DialogDescription>
            </DialogHeader>
            <ViewScoresButton
              variant="outline"
              label="See Results"
              onLoadingChange={setIsSubmitting}
              onProgressChange={setDecryptionProgress}
              onSuccess={onClose}
              onError={(error) => alert(error)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
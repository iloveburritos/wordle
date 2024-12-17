'use client'

import React, { useState, useEffect } from 'react';
import { EncryptedResult, GameBoard } from '@/lib/types';
import SubmitScoreButton from '@/components/SubmitScoreButton'; 
import ViewScoresButton from '@/components/ViewScoresButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import GameResultGrid from '@/components/GameResultGrid';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [isPrivySignatureVisible, setIsPrivySignatureVisible] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    const checkForPrivyModal = () => {
      const privyModal = document.querySelector('[data-privy-dialog]');
      setIsPrivySignatureVisible(!!privyModal);
    };

    checkForPrivyModal();
    const observer = new MutationObserver(() => {
      setTimeout(checkForPrivyModal, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => observer.disconnect();
  }, []);

  const handleScoreSubmitted = () => {
    setSubmissionComplete(true);
    setSubmissionError(null);
  };

  const handleSubmitError = (error: string) => {
    setSubmissionError(error);
    setIsSubmitting(false);
  };

  const handleSubmitStart = () => {
    setIsSubmitting(true);
    setSubmissionError(null);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {submissionError ? submissionError : 
             isSubmitting ? 'Submitting your score...' :
             submissionComplete ? 'Ready to see how everyone performed?' :
             message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <GameResultGrid board={gameResult.board} />
        </div>

        <DialogFooter className="sm:justify-start">
          {!submissionComplete ? (
            <SubmitScoreButton
              gameResult={gameResult}
              onSubmitStart={handleSubmitStart}
              onSubmitComplete={handleScoreSubmitted}
              onSubmitError={handleSubmitError}
              disabled={isSubmitting || isPrivySignatureVisible}
            />
          ) : (
            <ViewScoresButton
              variant="outline"
              label="See Results"
              onLoadingChange={setIsSubmitting}
              onProgressChange={setDecryptionProgress}
              onSuccess={onClose}
              onError={(error) => {
                setSubmissionError(error);
                setSubmissionComplete(false);
              }}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
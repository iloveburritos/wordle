'use client'

import React, { useState, useEffect } from 'react';
import { EncryptedResult, GameBoard } from '@/lib/types';
import SubmitScoreButton from '@/components/SubmitScoreButton'; 
import ViewScoresButton from '@/components/ViewScoresButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [modalMessage, setModalMessage] = useState(message);
  const [isViewingScores, setIsViewingScores] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting && !isPrivySignatureVisible) {
      onClose();
    }
  };

  useEffect(() => {
    const checkForPrivyModal = () => {
      const privyModal = document.querySelector('[data-privy-dialog]');
      const isVisible = !!privyModal;
      setIsPrivySignatureVisible(isVisible);
      
      if (isVisible && isSubmitting) {
        setModalMessage('Please sign the message to submit your score...');
      } else if (isSubmitting) {
        setModalMessage('Sending request to the ethernet...');
      }
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
  }, [isSubmitting]);

  useEffect(() => {
    if (!isSubmitting && !submissionComplete) {
      setModalMessage(message);
    }
  }, [isSubmitting, submissionComplete, message]);

  const handleScoreSubmitted = () => {
    setSubmissionComplete(true);
    setSubmissionError(null);
    setModalMessage('Your score was sent! See who else made it...');
    setIsSubmitting(false);
  };

  const handleSubmitError = (error: string) => {
    setSubmissionError(error);
    setIsSubmitting(false);
    setModalMessage(error);
  };

  const handleSubmitStart = () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setModalMessage('Ready to see how you performed?');
  };

  const handleViewScoresStart = () => {
    setIsViewingScores(true);
    setModalMessage('Decrypting group scores...');
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {submissionError || (isViewingScores ? `${modalMessage} ${decryptionProgress}% complete` : modalMessage)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="ml-3">
          <GameResultGrid board={gameResult.board} />
        </div>

        <DialogFooter className="sm:justify-start">
          {!submissionComplete ? (
            <SubmitScoreButton
              gameResult={gameResult}
              onSubmitStart={handleSubmitStart}
              onSubmitComplete={handleScoreSubmitted}
              onSubmitError={handleSubmitError}
              disabled={isSubmitting}
            />
          ) : (
            <ViewScoresButton
              variant="outline"
              label="See Results"
              onLoadingChange={(loading) => {
                setIsSubmitting(loading);
                if (loading) handleViewScoresStart();
              }}
              onProgressChange={setDecryptionProgress}
              onSuccess={onClose}
              onError={(error) => {
                setSubmissionError(error);
                setSubmissionComplete(false);
                setIsViewingScores(false);
              }}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
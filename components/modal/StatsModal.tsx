// components/StatsModal.tsx

'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ViewScoresButton from '@/components/ViewScoresButton';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>View Current Game Stats</DialogTitle>
          <DialogDescription>
            {isProcessing 
              ? `Decrypting group scores... ${decryptionProgress}% complete`
              : "Ready to see how your groups performed in the current game?"
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <ViewScoresButton
            variant="outline"
            label="See Group Stats"
            onLoadingChange={setIsProcessing}
            onProgressChange={setDecryptionProgress}
            onSuccess={onClose}
            onError={(error) => alert(error)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
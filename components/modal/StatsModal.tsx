// components/StatsModal.tsx

'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ViewScoresButton from '@/components/ViewScoresButton';

interface StatsModalProps {
  onClose: () => void;
}

export default function StatsModal({ onClose }: StatsModalProps) {
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <Dialog onOpenChange={onClose}>
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
            onError={(error) => alert(error)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ViewScoresButton from '@/components/ViewScoresButton';

interface AlreadyPlayedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlreadyPlayedModal({ isOpen, onClose }: AlreadyPlayedModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Already Played Today</DialogTitle>
          <DialogDescription>
            {isProcessing 
              ? `Decrypting group scores... ${decryptionProgress}% complete`
              : "You've already played today's game. Come back tomorrow for a new challenge!"
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <ViewScoresButton
            variant="outline"
            label="See Results"
            onLoadingChange={setIsProcessing}
            onProgressChange={setDecryptionProgress}
            onSuccess={onClose}
            onError={(error) => alert(error)}
          />
          <Button 
            onClick={onClose}
            variant="ghost"
            disabled={isProcessing}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
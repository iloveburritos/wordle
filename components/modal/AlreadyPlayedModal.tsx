import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatsModal from '@/components/modal/StatsModal';

interface AlreadyPlayedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlreadyPlayedModal({ isOpen, onClose }: AlreadyPlayedModalProps) {
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const handleSeeResults = () => {
    setIsStatsModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black opacity-80">
          <DialogHeader>
            <DialogTitle>Already Played Today</DialogTitle>
            <DialogDescription>
              You've already played today's game. Come back tomorrow for a new challenge!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button 
              onClick={handleSeeResults} 
              variant="outline"
            >
              See Results
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          onClose(); // Close the AlreadyPlayedModal when StatsModal is closed
        }}
      />
    </>
  );
} 
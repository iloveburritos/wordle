'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const router = useRouter();

  const handleSeeStats = () => {
    router.push('/results');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Statistics</DialogTitle>
          <DialogDescription>
            Ready to see how you compare?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSeeStats} 
            variant="outline"
          >
            See Stats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
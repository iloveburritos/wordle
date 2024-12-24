import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrorModal({ isOpen, onClose }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Log in to play the game and/or invite friends.
          </DialogDescription>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 
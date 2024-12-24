'use client'

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from 'lucide-react';

interface PlayGameErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export default function PlayGameErrorModal({ isOpen, onClose, error }: PlayGameErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle className="text-red-500">Error Loading Game</DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogDescription className="text-white">
            {error}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button
            onClick={onClose}
            variant="destructive"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
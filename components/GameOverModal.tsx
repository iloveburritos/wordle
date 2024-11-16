'use client'

import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameResult, icons } from '../lib/types';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  onSeeResults: () => void;
  gameResult: GameResult; // Using GameResult type for encapsulated game details
  message: string;
}

// Convert the board to a string grid representation
const renderGrid = (board: GameResult['board']): string => {
  return board
    .map((row) => row.map((tile) => icons[tile.state]).join(''))
    .join('\n');
};

export default function GameOverModal({
  isOpen,
  onClose,
  onShare,
  onSeeResults,
  gameResult,
  message
}: GameOverModalProps) {
  const { score, board } = gameResult;
  const grid = renderGrid(board);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black opacity-80">
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <pre>{grid}</pre>
        <DialogFooter className="sm:justify-start">
          <Button onClick={onShare}>Share</Button>
          <Button onClick={onSeeResults} variant="outline">See Stats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
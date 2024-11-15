// app/game/page.tsx

import React from 'react';
import Game from '../../components/Game';

const GamePage: React.FC = () => {
  return (
    <div className="game-page">
      <Game />
    </div>
  );
};

export default GamePage;
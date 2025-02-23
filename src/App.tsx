import React, { useState } from 'react';
import { GameMenu, GameType } from './components/GameMenu';
import { PacmanGame } from './components/PacmanGame';
import { SnakeGame } from './components/SnakeGame';
import { SnakeLadders } from './components/SnakeLadders';
import { MarioGame } from './components/MarioGame';

function App() {
  const [currentGame, setCurrentGame] = useState<GameType>('menu');

  const handleGameSelect = (game: GameType) => {
    setCurrentGame(game);
  };

  const handleReturnToMenu = () => {
    setCurrentGame('menu');
  };

  return (
    <>
      {currentGame === 'menu' && <GameMenu onSelectGame={handleGameSelect} />}
      {currentGame === 'pacman' && <PacmanGame onReturnToMenu={handleReturnToMenu} />}
      {currentGame === 'snake' && <SnakeGame onReturnToMenu={handleReturnToMenu} />}
      {currentGame === 'snakeladders' && <SnakeLadders onReturnToMenu={handleReturnToMenu} />}
      {currentGame === 'mario' && <MarioGame onReturnToMenu={handleReturnToMenu} />}
    </>
  );
}

export default App;

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { soundManager } from '../sounds';
import { OptionsMenu } from './OptionsMenu';

// Game constants
const GRID_SIZE = 28;
const CELL_SIZE = 20;
const INITIAL_LIVES = 3;
const INITIAL_LEVEL = 1;
const MAX_LEVEL = 5;

// Speed increases with each level
const getGameSpeed = (level: number) => Math.max(150 - (level - 1) * 20, 80);
const getGhostSpeed = (level: number) => Math.max(180 - (level - 1) * 25, 100);

const VULNERABLE_TIME = 10000; // 10 seconds

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type CellType = 'empty' | 'wall' | 'dot' | 'power' | 'pacman' | 'ghost' | 'vulnerable-ghost';

const chomp = keyframes`
  0% { clip-path: circle(50% at 50% 50%); }
  50% { clip-path: polygon(100% 0, 100% 100%, 50% 50%, 0 100%, 0 0); }
  100% { clip-path: circle(50% at 50% 50%); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const GameContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
  gap: 1px;
  background-color: #111;
  border: 2px solid #00f;
  padding: 5px;
`;

const Cell = styled.div<{ type: CellType; direction?: Direction }>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  border-radius: ${props => props.type === 'pacman' || props.type.includes('ghost') ? '50%' : '0'};
  background-color: ${props => {
    switch (props.type) {
      case 'wall': return '#00f';
      case 'dot': return 'transparent';
      case 'power': return 'transparent';
      case 'pacman': return '#ff0';
      case 'ghost': return '#f00';
      case 'vulnerable-ghost': return '#00f';
      default: return '#000';
    }
  }};
  ${props => props.type === 'pacman' && css`
    animation: ${chomp} 0.3s linear infinite;
    transform: rotate(${
      props.direction === 'UP' ? '270deg' :
      props.direction === 'DOWN' ? '90deg' :
      props.direction === 'LEFT' ? '180deg' : '0deg'
    });
  `}
  ${props => props.type === 'dot' && css`
    &::after {
      content: '';
      display: block;
      width: 4px;
      height: 4px;
      background: #fff;
      border-radius: 50%;
      margin: 8px;
    }
  `}
  ${props => props.type === 'power' && css`
    &::after {
      content: '';
      display: block;
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
      margin: 4px;
      animation: ${pulse} 0.8s infinite;
    }
  `}
`;

const GameTitle = styled.h1`
  font-family: 'Press Start 2P', monospace;
  color: #ff0;
  text-align: center;
  margin-bottom: 20px;
  font-size: 32px;
  text-shadow: 2px 2px #00f;
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: ${GRID_SIZE * CELL_SIZE}px;
  margin-bottom: 20px;
`;

const ScoreBoard = styled.div`
  font-size: 24px;
  margin-bottom: 20px;
  font-family: 'Press Start 2P', monospace;
`;

const LivesDisplay = styled.div`
  font-size: 24px;
`;

const LevelDisplay = styled.div`
  font-size: 24px;
  font-family: 'Press Start 2P', monospace;
`;

const MuteButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  &:hover {
    opacity: 0.8;
  }
`;

const GameOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  color: white;
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;

  button {
    margin-top: 20px;
    padding: 10px 20px;
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    background: #4CAF50;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;

    &:hover {
      background: #45a049;
    }
  }
`;

// Classic Pac-Man maze layout
const MAZE_LAYOUT = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W............WW............W",
  "W.WWWW.WWWWW.WW.WWWWW.WWWW.W",
  "WP.WW...WWWW.WW.WWWW...WW.PW",
  "W.WWWW.WWWWW.WW.WWWWW.WWWW.W",
  "W..........................W",
  "W.WWWW.WW.WWWWWWWW.WW.WWWW.W",
  "W.WWWW.WW.WWWWWWWW.WW.WWWW.W",
  "W......WW....WW....WW......W",
  "WWWWWW.WWWWW WW WWWWW.WWWWWW",
  "     W.WWWWW WW WWWWW.W     ",
  "     W.WW          WW.W     ",
  "     W.WW WWW--WWW WW.W     ",
  "WWWWWW.WW W      W WW.WWWWWW",
  "      .   W      W   .      ",
  "WWWWWW.WW W      W WW.WWWWWW",
  "     W.WW WWWWWWWW WW.W     ",
  "     W.WW          WW.W     ",
  "     W.WW WWWWWWWW WW.W     ",
  "WWWWWW.WW WWWWWWWW WW.WWWWWW",
  "W............WW............W",
  "W.WWWW.WWWWW.WW.WWWWW.WWWW.W",
  "W.WWWW.WWWWW.WW.WWWWW.WWWW.W",
  "WP..WW................WW..PW",
  "WWW.WW.WW.WWWWWWWW.WW.WW.WWW",
  "W......WW....WW....WW......W",
  "W.WWWWWWWWWW.WW.WWWWWWWWWW.W",
  "W..........................W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"
];

const initialBoard: CellType[][] = MAZE_LAYOUT.map(row => 
  row.split('').map(cell => {
    switch(cell) {
      case 'W': return 'wall';
      case 'P': return 'power';
      case '.': return 'dot';
      default: return 'empty';
    }
  })
);

type GameState = 'playing' | 'paused' | 'game-over' | 'level-complete';

const canMove = (board: CellType[][], position: Position, direction: Direction): boolean => {
  let newX = position.x;
  let newY = position.y;

  switch (direction) {
    case 'UP': newY -= 1; break;
    case 'DOWN': newY += 1; break;
    case 'LEFT': newX -= 1; break;
    case 'RIGHT': newX += 1; break;
  }

  // Check bounds
  if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
    return false;
  }

  // Check wall collision
  return board[newY][newX] !== 'wall';
};

const moveGhosts = (ghosts: Position[], pacman: Position, board: CellType[][]): Position[] => {
  return ghosts.map(ghost => {
    // Simple ghost AI: Move towards Pacman
    const dx = pacman.x - ghost.x;
    const dy = pacman.y - ghost.y;
    
    let newX = ghost.x;
    let newY = ghost.y;

    // Try horizontal movement
    if (Math.abs(dx) > Math.abs(dy)) {
      newX = ghost.x + Math.sign(dx);
      if (newX >= 0 && newX < GRID_SIZE && board[ghost.y][newX] !== 'wall') {
        return { x: newX, y: ghost.y };
      }
    }
    
    // Try vertical movement
    newY = ghost.y + Math.sign(dy);
    if (newY >= 0 && newY < GRID_SIZE && board[newY][ghost.x] !== 'wall') {
      return { x: ghost.x, y: newY };
    }

    return ghost;
  });
};

export const PacmanGame: React.FC<{ onReturnToMenu: () => void }> = ({ onReturnToMenu }) => {
  const [board, setBoard] = useState<CellType[][]>(initialBoard);
  const [pacman, setPacman] = useState<Position>({ x: 14, y: 23 });
  const [ghosts, setGhosts] = useState<Position[]>([
    { x: 13, y: 14 }, // Red ghost
    { x: 14, y: 14 }, // Pink ghost
    { x: 13, y: 15 }, // Blue ghost
    { x: 14, y: 15 }  // Orange ghost
  ]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [ghostsVulnerable, setGhostsVulnerable] = useState(false);
  const [dotsRemaining, setDotsRemaining] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Initialize level
  const initializeLevel = useCallback(() => {
    setBoard(initialBoard);
    setPacman({ x: 14, y: 23 });
    setGhosts([
      { x: 13, y: 14 },
      { x: 14, y: 14 },
      { x: 13, y: 15 },
      { x: 14, y: 15 }
    ]);
    setDirection('RIGHT');
    setGhostsVulnerable(false);
    
    let dots = 0;
    initialBoard.forEach(row => {
      row.forEach(cell => {
        if (cell === 'dot' || cell === 'power') dots++;
      });
    });
    setDotsRemaining(dots);
  }, []);

  useEffect(() => {
    initializeLevel();
  }, [level, initializeLevel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'playing') {
        switch (event.key) {
          case 'Enter':
          case '5':
            if (gameState === 'game-over') {
              setLives(INITIAL_LIVES);
              setLevel(INITIAL_LEVEL);
              setScore(0);
              setGameState('playing');
              initializeLevel();
            }
            break;
          case '9':
          case 'Escape':
            onReturnToMenu();
            break;
        }
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case '8':
          setDirection('UP');
          break;
        case 'ArrowDown':
        case '2':
          setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case '4':
          setDirection('LEFT');
          break;
        case 'ArrowRight':
        case '6':
          setDirection('RIGHT');
          break;
        case 'p':
        case 'P':
        case '5':
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
          break;
        case '0':
          setIsOptionsOpen(prev => !prev);
          if (gameState === 'playing') setGameState('paused');
          break;
        case '1':
          setIsMuted(soundManager.toggleMute());
          break;
        case '9':
        case 'Escape':
          onReturnToMenu();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, onReturnToMenu, initializeLevel]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move Pacman
      if (canMove(board, pacman, direction)) {
        const newPosition = { ...pacman };
        switch (direction) {
          case 'UP': newPosition.y -= 1; break;
          case 'DOWN': newPosition.y += 1; break;
          case 'LEFT': newPosition.x -= 1; break;
          case 'RIGHT': newPosition.x += 1; break;
        }

        // Update board and score
        const cell = board[newPosition.y][newPosition.x];
        if (cell === 'dot') {
          setScore(prev => prev + 10);
          setDotsRemaining(prev => prev - 1);
          soundManager.play('chomp');
          setBoard(prev => {
            const newBoard = [...prev];
            newBoard[newPosition.y][newPosition.x] = 'empty';
            return newBoard;
          });
        } else if (cell === 'power') {
          setScore(prev => prev + 50);
          setDotsRemaining(prev => prev - 1);
          setGhostsVulnerable(true);
          soundManager.play('powerPellet');
          setBoard(prev => {
            const newBoard = [...prev];
            newBoard[newPosition.y][newPosition.x] = 'empty';
            return newBoard;
          });
          
          // Reset ghost vulnerability after time
          setTimeout(() => {
            setGhostsVulnerable(false);
          }, VULNERABLE_TIME);
        }

        setPacman(newPosition);
      }

      // Move ghosts
      const newGhosts = moveGhosts(ghosts, pacman, board);
      setGhosts(newGhosts);

      // Check ghost collisions
      const ghostCollision = newGhosts.some(ghost => 
        ghost.x === pacman.x && ghost.y === pacman.y
      );

      if (ghostCollision) {
        if (ghostsVulnerable) {
          setScore(prev => prev + 200);
          soundManager.play('ghost');
          setGhosts(prev => prev.map(ghost => 
            ghost.x === pacman.x && ghost.y === pacman.y
              ? { x: 13, y: 14 } // Reset ghost position
              : ghost
          ));
        } else {
          soundManager.play('death');
          setLives(prev => prev - 1);
          if (lives <= 1) {
            setGameState('game-over');
          } else {
            // Reset positions
            setPacman({ x: 14, y: 23 });
            setGhosts([
              { x: 13, y: 14 },
              { x: 14, y: 14 },
              { x: 13, y: 15 },
              { x: 14, y: 15 }
            ]);
          }
        }
      }

      // Check level completion
      if (dotsRemaining === 0) {
        if (level < MAX_LEVEL) {
          setLevel(prev => prev + 1);
          setGameState('level-complete');
          setTimeout(() => {
            initializeLevel();
            setGameState('playing');
          }, 2000);
        } else {
          setGameState('game-over');
        }
      }
    }, getGameSpeed(level));

    return () => clearInterval(gameLoop);
  }, [gameState, board, pacman, direction, ghosts, ghostsVulnerable, lives, level, dotsRemaining, initializeLevel]);

  return (
    <GameContainer>
      <GameTitle>Louie-Sam-Pacman</GameTitle>
      <InfoBar>
        <ScoreBoard>SCORE: {score}</ScoreBoard>
        <LivesDisplay>{'❤️'.repeat(lives)}</LivesDisplay>
        <LevelDisplay>LEVEL: {level}</LevelDisplay>
        <MuteButton onClick={() => setIsMuted(soundManager.toggleMute())}>
          {isMuted ? '🔇' : '🔊'}
        </MuteButton>
      </InfoBar>
      <GameBoard>
        {board.map((row, y) => 
          row.map((cell, x) => {
            let cellType: CellType = cell;
            
            if (pacman.x === x && pacman.y === y) {
              cellType = 'pacman';
            } else if (ghosts.some(ghost => ghost.x === x && ghost.y === y)) {
              cellType = ghostsVulnerable ? 'vulnerable-ghost' : 'ghost';
            }

            return (
              <Cell 
                key={`${x}-${y}`} 
                type={cellType}
                direction={cellType === 'pacman' ? direction : undefined}
              />
            );
          })
        )}
      </GameBoard>
      <OptionsMenu
        isOpen={isOptionsOpen}
        onClose={() => {
          setIsOptionsOpen(false);
          if (gameState === 'paused') setGameState('playing');
        }}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />
      {gameState === 'game-over' && (
        <GameOverlay>
          <div>GAME OVER!</div>
          <button onClick={() => {
            setLives(INITIAL_LIVES);
            setLevel(INITIAL_LEVEL);
            setScore(0);
            setGameState('playing');
            initializeLevel();
          }}>Play Again</button>
        </GameOverlay>
      )}
      {gameState === 'level-complete' && (
        <GameOverlay>
          <div>LEVEL {level} COMPLETE!</div>
          <div>Get Ready for Level {level + 1}</div>
        </GameOverlay>
      )}
      {gameState === 'paused' && (
        <GameOverlay>
          <div>PAUSED</div>
          <div>Press P to Resume</div>
        </GameOverlay>
      )}
    </GameContainer>
  );
}; 
import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { soundManager } from '../sounds';
import { OptionsMenu } from './OptionsMenu';

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 200;
const SPEED_INCREASE = 10;
const INITIAL_SNAKE_LENGTH = 3;

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type CellType = 'empty' | 'snake' | 'food' | 'head';
type GameState = 'playing' | 'paused' | 'game-over';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
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

const Cell = styled.div<{ type: CellType }>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  border-radius: ${props => props.type === 'food' ? '50%' : '3px'};
  background-color: ${props => {
    switch (props.type) {
      case 'snake': return '#0f0';
      case 'head': return '#0f0';
      case 'food': return '#f00';
      default: return '#000';
    }
  }};
  ${props => props.type === 'food' && css`
    animation: ${pulse} 0.8s infinite;
  `}
  ${props => props.type === 'head' && css`
    border: 2px solid #0a0;
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
`;

const OverlayButton = styled.button<{ focused?: boolean }>`
  margin-top: 20px;
  padding: 10px 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  background: ${props => props.focused ? '#45a049' : '#4CAF50'};
  border: 2px solid ${props => props.focused ? '#fff' : 'transparent'};
  border-radius: 5px;
  color: white;
  cursor: pointer;

  &:hover {
    background: #45a049;
  }
`;

export const SnakeGame: React.FC<{ onReturnToMenu: () => void }> = ({ onReturnToMenu }) => {
  const [snake, setSnake] = useState<Position[]>([]);
  const [food, setFood] = useState<Position>({ x: 0, y: 0 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(true);

  const initializeGame = useCallback(() => {
    const initialSnake = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: Math.floor(GRID_SIZE / 2) - i, y: Math.floor(GRID_SIZE / 2) });
    }
    setSnake(initialSnake);
    setDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    spawnFood(initialSnake);
  }, []);

  const spawnFood = (currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  };

  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y = (newHead.y - 1 + GRID_SIZE) % GRID_SIZE; break;
        case 'DOWN': newHead.y = (newHead.y + 1) % GRID_SIZE; break;
        case 'LEFT': newHead.x = (newHead.x - 1 + GRID_SIZE) % GRID_SIZE; break;
        case 'RIGHT': newHead.x = (newHead.x + 1) % GRID_SIZE; break;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState('game-over');
        soundManager.play('death');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake.slice(0, -1)];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        soundManager.play('chomp');
        setScore(prev => prev + 10);
        spawnFood(newSnake);
        setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50));
        return [newHead, ...prevSnake];
      }

      return newSnake;
    });
  }, [direction, food, gameState]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState === 'game-over') {
        switch (event.key) {
          case 'Enter':
          case '5':
          case 'OK':
            if (buttonFocused) {
              initializeGame();
              setGameState('playing');
            }
            break;
          case '9':
          case 'Escape':
          case 'Return':
            onReturnToMenu();
            break;
          default:
            break;
        }
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case '8':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case '2':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case '4':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case '6':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case 'Enter':
        case '5':
          if (gameState === 'playing') setGameState('paused');
          else if (gameState === 'paused') setGameState('playing');
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
  }, [direction, gameState, onReturnToMenu, buttonFocused, initializeGame]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  return (
    <GameContainer>
      <GameTitle>Louie-Sam Snake</GameTitle>
      <InfoBar>
        <ScoreBoard>SCORE: {score}</ScoreBoard>
        <MuteButton onClick={() => setIsMuted(soundManager.toggleMute())}>
          {isMuted ? '🔇' : '🔊'}
        </MuteButton>
      </InfoBar>
      <GameBoard>
        {Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            let cellType: CellType = 'empty';
            if (x === food.x && y === food.y) {
              cellType = 'food';
            } else if (x === snake[0]?.x && y === snake[0]?.y) {
              cellType = 'head';
            } else if (snake.slice(1).some(segment => segment.x === x && segment.y === y)) {
              cellType = 'snake';
            }
            return <Cell key={`${x}-${y}`} type={cellType} />;
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
          <div>Score: {score}</div>
          <OverlayButton 
            focused={buttonFocused}
            onClick={() => {
              initializeGame();
              setGameState('playing');
            }}
          >
            Play Again (Press 5)
          </OverlayButton>
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            Press 9 to Return to Menu
          </div>
        </GameOverlay>
      )}
      {gameState === 'paused' && (
        <GameOverlay>
          <div>PAUSED</div>
          <div>Press 5 to Resume</div>
        </GameOverlay>
      )}
    </GameContainer>
  );
}; 
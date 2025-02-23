import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { OptionsMenu } from './OptionsMenu';

// Game constants
const BOARD_SIZE = 10;
const CELL_SIZE = 60;

// Define types for snakes and ladders
type SnakesAndLadders = Record<number, number>;

// Define snakes and ladders
const SNAKES: SnakesAndLadders = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78
};

const LADDERS: SnakesAndLadders = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100
};

type GameState = 'rolling' | 'moving' | 'waiting' | 'game-over';

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

const GameTitle = styled.h1`
  font-family: 'Press Start 2P', monospace;
  color: #ff0;
  text-align: center;
  margin-bottom: 20px;
  font-size: 32px;
  text-shadow: 2px 2px #00f;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(${BOARD_SIZE}, ${CELL_SIZE}px);
  grid-template-rows: repeat(${BOARD_SIZE}, ${CELL_SIZE}px);
  gap: 1px;
  background-color: #111;
  border: 2px solid #00f;
  padding: 5px;
`;

interface CellProps {
  number: number;
  hasPlayer: boolean;
  isSnakeStart?: boolean;
  isSnakeEnd?: boolean;
  isLadderStart?: boolean;
  isLadderEnd?: boolean;
}

const PlayerToken = styled.div`
  width: 30px;
  height: 30px;
  background-color: #ff0;
  border-radius: 50%;
  border: 3px solid #f90;
  box-shadow: 0 0 10px #ff0;
  animation: pulse 1s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const slither = keyframes`
  0% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  100% { transform: translateX(-2px); }
`;

const climb = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const SnakeLine = styled.div<{ to: { x: number; y: number } }>`
  position: absolute;
  width: 100px;
  height: ${props => Math.abs(props.to.y)}px;
  top: ${props => props.to.y > 0 ? '0' : '100%'};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;

  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.5));
  }

  .snake-body {
    fill: none;
    stroke: url(#snake-gradient);
    stroke-width: 20;
    stroke-linecap: round;
    animation: ${slither} 2s ease-in-out infinite;
  }

  .snake-pattern {
    fill: none;
    stroke: #900;
    stroke-width: 22;
    stroke-dasharray: 5 15;
    opacity: 0.5;
    stroke-linecap: round;
    animation: ${slither} 2s ease-in-out infinite;
  }

  .snake-outline {
    fill: none;
    stroke: #600;
    stroke-width: 24;
    stroke-linecap: round;
    animation: ${slither} 2s ease-in-out infinite;
  }

  /* Snake head emoji with glow */
  &::after {
    content: '🐍';
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 30px;
    filter: drop-shadow(0 0 8px #f00);
    z-index: 2;
  }
`;

const LadderLine = styled.div<{ to: { x: number; y: number } }>`
  position: absolute;
  width: 80px;
  height: ${props => Math.abs(props.to.y)}px;
  top: ${props => props.to.y > 0 ? '0' : '100%'};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;

  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 5px rgba(0, 255, 0, 0.5));
  }

  .ladder-rail {
    fill: none;
    stroke: #0f0;
    stroke-width: 8;
    stroke-linecap: round;
    filter: url(#glow);
  }

  .ladder-rung {
    fill: none;
    stroke: #0f0;
    stroke-width: 6;
    stroke-linecap: round;
    filter: url(#glow);
  }

  .ladder-highlight {
    fill: none;
    stroke: rgba(255, 255, 255, 0.5);
    stroke-width: 2;
    stroke-linecap: round;
  }
`;

const Cell = styled.div<CellProps>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  background-color: ${props => props.hasPlayer ? 'transparent' : '#000'};
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: ${props => props.hasPlayer ? '#000' : '#fff'};
  position: relative;
  overflow: visible;

  ${props => props.isSnakeStart && css`
    background-color: #400;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #f00 0%, transparent 70%);
      opacity: 0.3;
    }
  `}

  ${props => props.isSnakeEnd && css`
    background-color: #200;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #900 0%, transparent 70%);
      opacity: 0.3;
    }
  `}

  ${props => props.isLadderStart && css`
    background-color: #040;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #0f0 0%, transparent 70%);
      opacity: 0.3;
    }
  `}

  ${props => props.isLadderEnd && css`
    background-color: #020;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #0a0 0%, transparent 70%);
      opacity: 0.3;
    }
  `}
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: ${BOARD_SIZE * CELL_SIZE}px;
  margin: 20px 0;
  font-family: 'Press Start 2P', monospace;
`;

const DiceDisplay = styled.div`
  font-size: 24px;
  padding: 10px 20px;
  background-color: #333;
  border-radius: 5px;
  margin: 0 10px;
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

interface OverlayButtonProps {
  focused?: boolean;
}

const OverlayButton = styled.button<OverlayButtonProps>`
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

const getSnakePath = (height: number) => {
  const segments = Math.floor(height / 100);
  const amplitude = 30; // How wide the snake curves
  let path = `M50,0`;
  
  for (let i = 0; i < segments; i++) {
    const y1 = (i * 100) + 50;
    const y2 = ((i + 1) * 100);
    path += ` C${50 - amplitude},${y1} ${50 + amplitude},${y2 - 50} 50,${y2}`;
  }
  
  return path;
};

const getConnectionPosition = (start: number, end: number) => {
  const startRow = Math.floor((start - 1) / BOARD_SIZE);
  const endRow = Math.floor((end - 1) / BOARD_SIZE);
  const startCol = (start - 1) % BOARD_SIZE;
  const endCol = (end - 1) % BOARD_SIZE;
  
  // Calculate exact positions
  const startX = startCol * CELL_SIZE + (CELL_SIZE / 2);
  const endX = endCol * CELL_SIZE + (CELL_SIZE / 2);
  const distance = (endRow - startRow) * CELL_SIZE;
  
  return {
    x: endX - startX, // Difference in x positions
    y: distance,
    startX: startX,
    endX: endX
  };
};

const getLadderPath = (height: number, xOffset: number) => {
  const angle = 15; // Angle of the ladder in degrees
  const width = 40; // Width between rails
  const rungSpacing = 40; // Space between rungs
  const numRungs = Math.floor(height / rungSpacing);
  
  // Calculate the total x-distance the ladder needs to cover
  const totalXOffset = xOffset;
  
  // Calculate rail positions with perspective and x-offset
  const leftRail = `M${40 - width/2},0 L${40 - width/2 + totalXOffset},${height}`;
  const rightRail = `M${40 + width/2},0 L${40 + width/2 + totalXOffset},${height}`;
  
  // Generate rungs that follow the angle of the ladder
  let rungs = '';
  for (let i = 0; i <= numRungs; i++) {
    const y = (i * rungSpacing);
    const progress = y / height; // Progress from 0 to 1
    const currentXOffset = totalXOffset * progress; // Interpolate x-offset
    const x1 = 40 - width/2 + currentXOffset;
    const x2 = 40 + width/2 + currentXOffset;
    rungs += `M${x1},${y} L${x2},${y} `;
  }

  return {
    rails: leftRail + ' ' + rightRail,
    rungs: rungs
  };
};

export const SnakeLadders: React.FC<{ onReturnToMenu: () => void }> = ({ onReturnToMenu }) => {
  const [position, setPosition] = useState(1);
  const [dice, setDice] = useState(0);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);

  const rollDice = () => {
    if (gameState !== 'waiting') return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    setGameState('moving');

    // Calculate new position
    let newPos = position + roll;
    
    // Check if won
    if (newPos >= 100) {
      newPos = 100;
      setPosition(newPos);
      setGameState('game-over');
      return;
    }

    // Check for snakes
    if (SNAKES[newPos]) {
      setTimeout(() => {
        setPosition(SNAKES[newPos]);
        setGameState('waiting');
      }, 1000);
    }
    // Check for ladders
    else if (LADDERS[newPos]) {
      setTimeout(() => {
        setPosition(LADDERS[newPos]);
        setGameState('waiting');
      }, 1000);
    }
    else {
      setTimeout(() => {
        setPosition(newPos);
        setGameState('waiting');
      }, 500);
    }
  };

  const initializeGame = () => {
    setPosition(1);
    setDice(0);
    setGameState('waiting');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState === 'game-over') {
        switch (event.key) {
          case 'Enter':
          case '5':
          case 'OK':
            if (buttonFocused) {
              initializeGame();
            }
            break;
          case '9':
          case 'Escape':
          case 'Return':
            onReturnToMenu();
            break;
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
        case '5':
          if (gameState === 'waiting') {
            rollDice();
          }
          break;
        case '0':
          setIsOptionsOpen(prev => !prev);
          break;
        case '1':
          setIsMuted(false);
          break;
        case '9':
        case 'Escape':
          onReturnToMenu();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, onReturnToMenu, buttonFocused]);

  const renderBoard = () => {
    const cells = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      for (let col = row % 2 === 0 ? 0 : BOARD_SIZE - 1; 
           row % 2 === 0 ? col < BOARD_SIZE : col >= 0; 
           row % 2 === 0 ? col++ : col--) {
        const number = row * BOARD_SIZE + (row % 2 === 0 ? col + 1 : BOARD_SIZE - col);
        cells.push(
          <Cell
            key={number}
            number={number}
            hasPlayer={position === number}
            isSnakeStart={SNAKES[number] !== undefined}
            isSnakeEnd={Object.values(SNAKES).includes(number)}
            isLadderStart={LADDERS[number] !== undefined}
            isLadderEnd={Object.values(LADDERS).includes(number)}
          >
            {position === number ? (
              <PlayerToken />
            ) : (
              number
            )}
            {SNAKES[number] && (
              <SnakeLine to={getConnectionPosition(number, SNAKES[number])}>
                <svg>
                  <defs>
                    <linearGradient id="snake-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#f00' }} />
                      <stop offset="50%" style={{ stopColor: '#d00' }} />
                      <stop offset="100%" style={{ stopColor: '#f00' }} />
                    </linearGradient>
                  </defs>
                  <path 
                    className="snake-outline"
                    d={getSnakePath(Math.abs(getConnectionPosition(number, SNAKES[number]).y))}
                  />
                  <path 
                    className="snake-body"
                    d={getSnakePath(Math.abs(getConnectionPosition(number, SNAKES[number]).y))}
                  />
                  <path 
                    className="snake-pattern"
                    d={getSnakePath(Math.abs(getConnectionPosition(number, SNAKES[number]).y))}
                  />
                </svg>
              </SnakeLine>
            )}
            {LADDERS[number] && (
              <LadderLine to={getConnectionPosition(number, LADDERS[number])}>
                <svg>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <g>
                    {/* Draw rails */}
                    <path 
                      className="ladder-rail"
                      d={getLadderPath(
                        Math.abs(getConnectionPosition(number, LADDERS[number]).y),
                        getConnectionPosition(number, LADDERS[number]).x
                      ).rails}
                    />
                    {/* Draw rungs */}
                    <path 
                      className="ladder-rung"
                      d={getLadderPath(
                        Math.abs(getConnectionPosition(number, LADDERS[number]).y),
                        getConnectionPosition(number, LADDERS[number]).x
                      ).rungs}
                    />
                    {/* Add highlights */}
                    <path 
                      className="ladder-highlight"
                      d={getLadderPath(
                        Math.abs(getConnectionPosition(number, LADDERS[number]).y),
                        getConnectionPosition(number, LADDERS[number]).x
                      ).rails}
                    />
                    <path 
                      className="ladder-highlight"
                      d={getLadderPath(
                        Math.abs(getConnectionPosition(number, LADDERS[number]).y),
                        getConnectionPosition(number, LADDERS[number]).x
                      ).rungs}
                    />
                  </g>
                </svg>
              </LadderLine>
            )}
          </Cell>
        );
      }
    }
    return cells;
  };

  return (
    <GameContainer>
      <GameTitle>Snake & Ladders</GameTitle>
      <InfoBar>
        <div>Position: {position}</div>
        <DiceDisplay>Dice: {dice || '?'}</DiceDisplay>
      </InfoBar>
      <Board>
        {renderBoard()}
      </Board>
      <InfoBar>
        <div>Press 5 to Roll</div>
        <div>Press 9 to Exit</div>
      </InfoBar>
      <OptionsMenu
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />
      {gameState === 'game-over' && (
        <GameOverlay>
          <div>YOU WIN!</div>
          <OverlayButton 
            focused={buttonFocused}
            onClick={initializeGame}
          >
            Play Again (Press 5)
          </OverlayButton>
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            Press 9 to Return to Menu
          </div>
        </GameOverlay>
      )}
    </GameContainer>
  );
};
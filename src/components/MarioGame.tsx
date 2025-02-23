import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { OptionsMenu } from './OptionsMenu';

// Game constants
const GRAVITY = 1.2;
const JUMP_FORCE = 15;
const MOVE_SPEED = 6;
const MAX_JUMP_FORCE = 20;
const MIN_JUMP_FORCE = 15;
const JUMP_HOLD_TIME = 250;
const JUMP_CANCEL_FORCE = -3;
const GROUND_HEIGHT = 80;
const PLATFORM_HEIGHT = 40;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const MARIO_WIDTH = 32;
const MARIO_HEIGHT = 32;
const SPRITE_SIZE = 32;
const GOOMBA_WIDTH = 32;
const GOOMBA_HEIGHT = 32;
const GOOMBA_SPEED = 2;
const SPAWN_INTERVAL = 3000;
const WORLD_WIDTH = 3200;
const CAMERA_BUFFER = 400;
const COIN_SIZE = 20;
const POINTS_PER_COIN = 100;
const POINTS_TO_NEXT_LEVEL = 500;
const ANALOG_DEADZONE = 0.15;
const ANALOG_MOVE_MULTIPLIER = 20;
const MAX_MOVE_SPEED = 20;
const ACCELERATION = 1.5;
const DECELERATION = 0.85;

// Base64 encoded sprite for Mario (simple red rectangle for now)
const MARIO_SPRITE = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEqSURBVHic7d0xTsNAFEbhN4htwAZoKGhoKWmQKJDYAhULyBayg3QUkVJQJAUVUkrBBigosUUuRjQpkGz5vZn5/k+yUjhX1tXVlQEAAAAAAAAAAAAAAADQ1ZH7AFqc2eC6mD4+Tx7uv93n0ODFB/O74vlyVlw9zB/d59HgLOhvtYQgaADWEoKwAVhDCEIHYOohhA/AlEMQCGCaIYgEMLUQxAKYUgiCAUwnBNEAphGCcADyIYgHIB2CgQUgG4KRBSAZgqEFIBeCsQUgFYLBBSATgtEFIBGC4QUgD4ILAHkQXADIg+ACwNQhGF8AoiEYXwCiIRhfAKIhGF8AoiEYXwCiIRhfAKIhGF8AoiEYXwCiIRhfAKIhGF8AoiEYXwCiIQAAAAAAAAAAAAAAAECvX5qsI5Pzc+0jAAAAAElFTkSuQmCC`;

type GameState = 'playing' | 'paused' | 'game-over';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
}

interface CollisionResult {
  collided: boolean;
  y: number;
}

interface Enemy {
  x: number;
  y: number;
  active: boolean;
}

interface Collectable {
  x: number;
  y: number;
  active: boolean;
  type: 'coin';
}

interface Level {
  platforms: Platform[];
  collectables: Collectable[];
  enemySpawnInterval: number;
  enemySpeed: number;
  backgroundColor: string;
  groundColor: string;
}

const LEVELS: Level[] = [
  // Level 1 - Basic introduction
  {
    platforms: [
      { x: 200, y: 200, width: 100 },
      { x: 400, y: 300, width: 100 },
      { x: 600, y: 250, width: 100 },
      { x: 900, y: 200, width: 150 },
    ],
    collectables: [
      // Platform coins
      { x: 200, y: 250, active: true, type: 'coin' },
      { x: 400, y: 350, active: true, type: 'coin' },
      { x: 600, y: 300, active: true, type: 'coin' },
      { x: 900, y: 250, active: true, type: 'coin' },
      // Ground coins
      { x: 300, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
      { x: 700, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
    ],
    enemySpawnInterval: 4000,
    enemySpeed: 2,
    backgroundColor: '#5c94fc',
    groundColor: '#c84c0c',
  },
  // Level 2 - More challenging platforms
  {
    platforms: [
      { x: 200, y: 250, width: 80 },
      { x: 400, y: 350, width: 80 },
      { x: 600, y: 450, width: 80 },
      { x: 800, y: 350, width: 80 },
      { x: 1000, y: 250, width: 80 },
      { x: 1200, y: 400, width: 100 },
    ],
    collectables: [
      // Platform coins
      { x: 200, y: 300, active: true, type: 'coin' },
      { x: 400, y: 400, active: true, type: 'coin' },
      { x: 600, y: 500, active: true, type: 'coin' },
      { x: 800, y: 400, active: true, type: 'coin' },
      { x: 1000, y: 300, active: true, type: 'coin' },
      { x: 1200, y: 450, active: true, type: 'coin' },
      // Ground coins
      { x: 300, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
      { x: 900, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
    ],
    enemySpawnInterval: 3000,
    enemySpeed: 3,
    backgroundColor: '#4169e1',
    groundColor: '#8b4513',
  },
  // Level 3 - Expert level
  {
    platforms: [
      { x: 200, y: 200, width: 60 },
      { x: 400, y: 300, width: 60 },
      { x: 600, y: 400, width: 60 },
      { x: 800, y: 500, width: 60 },
      { x: 1000, y: 400, width: 60 },
      { x: 1200, y: 300, width: 60 },
      { x: 1400, y: 200, width: 60 },
      { x: 1600, y: 350, width: 100 },
    ],
    collectables: [
      // Platform coins
      { x: 200, y: 250, active: true, type: 'coin' },
      { x: 400, y: 350, active: true, type: 'coin' },
      { x: 600, y: 450, active: true, type: 'coin' },
      { x: 800, y: 550, active: true, type: 'coin' },
      { x: 1000, y: 450, active: true, type: 'coin' },
      { x: 1200, y: 350, active: true, type: 'coin' },
      { x: 1400, y: 250, active: true, type: 'coin' },
      { x: 1600, y: 400, active: true, type: 'coin' },
      // Ground coins
      { x: 300, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
      { x: 700, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
      { x: 1100, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
      { x: 1500, y: GROUND_HEIGHT + 50, active: true, type: 'coin' },
    ],
    enemySpawnInterval: 2000,
    enemySpeed: 4,
    backgroundColor: '#483d8b',
    groundColor: '#8b0000',
  },
];

const run = keyframes`
  0% { background-position: 0 0; }
  25% { background-position: -${SPRITE_SIZE}px 0; }
  50% { background-position: -${SPRITE_SIZE * 2}px 0; }
  75% { background-position: -${SPRITE_SIZE * 3}px 0; }
  100% { background-position: 0 0; }
`;

const GameContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #5c94fc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const GameTitle = styled.h1`
  font-family: 'Press Start 2P', monospace;
  color: #ff0;
  text-align: center;
  margin-bottom: 20px;
  font-size: 32px;
  text-shadow: 2px 2px #00f;
`;

const GameArea = styled.div<{ backgroundColor: string }>`
  width: ${GAME_WIDTH}px;
  height: ${GAME_HEIGHT}px;
  background: linear-gradient(${props => props.backgroundColor} 0%, ${props => props.backgroundColor} 60%, #00b800 60%, #00b800 100%);
  position: relative;
  border: 4px solid #000;
  overflow: hidden;
`;

const GameWorld = styled.div<{ cameraX: number }>`
  width: ${WORLD_WIDTH}px;
  height: 100%;
  position: absolute;
  left: ${props => -props.cameraX}px;
  transition: left 0.1s ease-out;
`;

const Mario = styled.div<{ jumping: boolean; direction: 'left' | 'right'; moving: boolean }>`
  width: ${MARIO_WIDTH}px;
  height: ${MARIO_HEIGHT}px;
  position: absolute;
  background-color: red;
  background-image: url('${MARIO_SPRITE}');
  background-size: contain;
  background-repeat: no-repeat;
  transform: scaleX(${props => props.direction === 'left' ? -1 : 1});
  
  ${props => {
    if (props.jumping) {
      return css`
        background-position: -${SPRITE_SIZE * 2}px 0;
        animation: none;
      `;
    }
    if (props.moving) {
      return css`
        animation: ${run} 0.4s steps(4) infinite;
      `;
    }
    return css`
      background-position: 0 0;
    `;
  }}
  
  left: ${props => props.style?.left};
  bottom: ${props => props.style?.bottom};
  z-index: 10;
  image-rendering: pixelated;
  border: 1px solid black;
`;

const Ground = styled.div<{ groundColor: string }>`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: ${GROUND_HEIGHT}px;
  background: ${props => props.groundColor};
  border-top: 4px solid #000;
`;

const PlatformBlock = styled.div<{ x: number; y: number; width: number }>`
  position: absolute;
  left: ${props => props.x}px;
  bottom: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${PLATFORM_HEIGHT}px;
  background: #c84c0c;
  border: 4px solid #000;
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 800px;
  margin: 20px 0;
  font-family: 'Press Start 2P', monospace;
  color: white;
`;

const ScoreDisplay = styled.div`
  font-size: 24px;
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
  display: block;
  width: 100%;
  margin-bottom: 10px;

  &:hover {
    background: #45a049;
  }
`;

const Goomba = styled.div`
  width: ${GOOMBA_WIDTH}px;
  height: ${GOOMBA_HEIGHT}px;
  position: absolute;
  background-color: #8B4513;
  border-radius: 50%;
  left: ${props => props.style?.left};
  bottom: ${props => props.style?.bottom};
  z-index: 5;
`;

const Coin = styled.div`
  width: ${COIN_SIZE}px;
  height: ${COIN_SIZE}px;
  position: absolute;
  background-color: #ffd700;
  border-radius: 50%;
  border: 2px solid #b8860b;
  box-shadow: 0 0 5px #ffd700;
  animation: float 1s ease-in-out infinite alternate;
  left: ${props => props.style?.left};
  bottom: ${props => props.style?.bottom};
  z-index: 5;

  @keyframes float {
    from { transform: translateY(0); }
    to { transform: translateY(-5px); }
  }
`;

export const MarioGame: React.FC<{ onReturnToMenu: () => void }> = ({ onReturnToMenu }) => {
  const [position, setPosition] = useState<Position>({ x: 100, y: GROUND_HEIGHT });
  const [velocity, setVelocity] = useState<Velocity>({ x: 0, y: 0 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isJumping, setIsJumping] = useState(false);
  const [jumpStartTime, setJumpStartTime] = useState(0);
  const [isJumpHeld, setIsJumpHeld] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(true);
  const [cameraX, setCameraX] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [platforms, setPlatforms] = useState(LEVELS[0].platforms);
  const [collectables, setCollectables] = useState(LEVELS[0].collectables);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  const [selectedOption, setSelectedOption] = useState<'play-again' | 'menu'>('play-again');

  const checkCollision = useCallback((pos: Position): CollisionResult => {
    // Check ground collision
    if (pos.y <= GROUND_HEIGHT) {
      return { collided: true, y: GROUND_HEIGHT };
    }

    // Check platform collisions
    for (const platform of platforms) {
      if (
        pos.x + 32 > platform.x &&
        pos.x < platform.x + platform.width &&
        pos.y <= platform.y + PLATFORM_HEIGHT &&
        pos.y > platform.y
      ) {
        return { collided: true, y: platform.y + PLATFORM_HEIGHT };
      }
    }

    return { collided: false, y: pos.y };
  }, [platforms]);

  const checkEnemyCollision = useCallback((pos: Position): boolean => {
    return enemies.some(enemy => {
      if (!enemy.active) return false;
      
      const horizontalCollision = 
        pos.x < enemy.x + GOOMBA_WIDTH &&
        pos.x + MARIO_WIDTH > enemy.x;
      
      const verticalCollision =
        pos.y < enemy.y + GOOMBA_HEIGHT &&
        pos.y + MARIO_HEIGHT > enemy.y;

      return horizontalCollision && verticalCollision;
    });
  }, [enemies]);

  const checkCollectableCollision = useCallback((pos: Position) => {
    setCollectables(prev => prev.map(collectable => {
      if (!collectable.active) return collectable;

      const horizontalCollision = 
        pos.x < collectable.x + COIN_SIZE &&
        pos.x + MARIO_WIDTH > collectable.x;
      
      const verticalCollision =
        pos.y < collectable.y + COIN_SIZE &&
        pos.y + MARIO_HEIGHT > collectable.y;

      if (horizontalCollision && verticalCollision) {
        setScore(s => s + POINTS_PER_COIN);
        return { ...collectable, active: false };
      }
      return collectable;
    }));
  }, []);

  // Function to load next level
  const loadNextLevel = useCallback(() => {
    const nextLevel = currentLevel + 1;
    if (nextLevel < LEVELS.length) {
      setCurrentLevel(nextLevel);
      setPlatforms(LEVELS[nextLevel].platforms);
      setCollectables(LEVELS[nextLevel].collectables);
      setPosition({ x: 100, y: GROUND_HEIGHT });
      setVelocity({ x: 0, y: 0 });
      setEnemies([]);
      setCameraX(0);
    } else {
      // Game completed!
      setGameState('game-over');
    }
  }, [currentLevel]);

  // Check for level completion
  useEffect(() => {
    if (score > 0 && score % POINTS_TO_NEXT_LEVEL === 0) {
      loadNextLevel();
    }
  }, [score, loadNextLevel]);

  // Update enemy spawn interval based on level
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnEnemy = () => {
      setEnemies(prev => [...prev, {
        x: cameraX + GAME_WIDTH + GOOMBA_WIDTH,
        y: GROUND_HEIGHT,
        active: true
      }]);
    };

    const spawnInterval = setInterval(spawnEnemy, LEVELS[currentLevel].enemySpawnInterval);
    return () => clearInterval(spawnInterval);
  }, [gameState, cameraX, currentLevel]);

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update enemy positions with level-specific speed
    setEnemies(prev => prev
      .map(enemy => ({
        ...enemy,
        x: enemy.x - LEVELS[currentLevel].enemySpeed
      }))
      .filter(enemy => enemy.x > -GOOMBA_WIDTH)
    );

    setPosition(pos => {
      const newPos = {
        x: pos.x + velocity.x,
        y: pos.y + velocity.y,
      };

      // Keep Mario within horizontal bounds of the entire world
      newPos.x = Math.max(0, Math.min(newPos.x, WORLD_WIDTH - MARIO_WIDTH));

      // Update camera position when Mario moves past the buffer point
      if (newPos.x > CAMERA_BUFFER && newPos.x < WORLD_WIDTH - GAME_WIDTH + CAMERA_BUFFER) {
        setCameraX(newPos.x - CAMERA_BUFFER);
      }

      // Apply gravity with variable jump height and smoother fall
      const jumpDuration = Date.now() - jumpStartTime;
      const shouldApplyStrongGravity = !isJumpHeld || jumpDuration > JUMP_HOLD_TIME;
      const gravityForce = shouldApplyStrongGravity ? GRAVITY * 1.5 : GRAVITY;
      
      setVelocity(v => ({ ...v, y: v.y - gravityForce }));

      // Keep Mario within vertical bounds
      newPos.y = Math.max(GROUND_HEIGHT, Math.min(newPos.y, GAME_HEIGHT - MARIO_HEIGHT));

      const collision = checkCollision(newPos);
      if (collision.collided) {
        newPos.y = collision.y;
        setVelocity(v => ({ ...v, y: 0 }));
        setIsJumping(false);
      }

      // Check collisions
      checkCollectableCollision(newPos);
      if (checkEnemyCollision(newPos)) {
        setGameState('game-over');
      }

      return newPos;
    });
  }, [velocity, gameState, checkCollision, checkEnemyCollision, checkCollectableCollision, isJumpHeld, jumpStartTime, currentLevel]);

  useEffect(() => {
    const gameLoop = setInterval(update, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [update]);

  // Handle gamepad connection/disconnection
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad);
      setGamepad(e.gamepad);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad);
      setGamepad(null);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, []);

  // Handle gamepad input
  useEffect(() => {
    let animationFrameId: number;

    const handleGamepadInput = () => {
      const gamepads = navigator.getGamepads();
      const currentGamepad = gamepads[0];

      if (currentGamepad) {
        if (gameState === 'game-over') {
          // Navigate menu with D-pad or left stick
          const verticalAxis = currentGamepad.axes[1];
          if (Math.abs(verticalAxis) > ANALOG_DEADZONE) {
            setSelectedOption(prev => prev === 'play-again' ? 'menu' : 'play-again');
          }

          // Select option with A button
          if (currentGamepad.buttons[0].pressed) {
            if (selectedOption === 'play-again') {
              setPosition({ x: 100, y: GROUND_HEIGHT });
              setVelocity({ x: 0, y: 0 });
              setScore(0);
              setGameState('playing');
              setIsMoving(false);
            } else {
              onReturnToMenu();
            }
          }
          return;
        }

        // Analog stick movement with better control curve
        const horizontalAxis = currentGamepad.axes[0];
        if (Math.abs(horizontalAxis) > ANALOG_DEADZONE) {
          const movement = Math.sign(horizontalAxis) * 
            Math.min(Math.pow(Math.abs(horizontalAxis), 1.8) * ANALOG_MOVE_MULTIPLIER, MAX_MOVE_SPEED);
          
          setVelocity(v => ({ ...v, x: movement }));
          setDirection(horizontalAxis > 0 ? 'right' : 'left');
          setIsMoving(true);
        } else {
          setVelocity(v => ({ ...v, x: 0 }));
          setIsMoving(false);
        }

        // A button (jump)
        if (currentGamepad.buttons[0].pressed && !isJumping && !isJumpHeld) {
          setVelocity(v => ({ ...v, y: MAX_JUMP_FORCE }));
          setIsJumping(true);
          setIsJumpHeld(true);
          setJumpStartTime(Date.now());
        } else if (!currentGamepad.buttons[0].pressed && isJumpHeld) {
          setIsJumpHeld(false);
          if (isJumping) {
            const jumpDuration = Date.now() - jumpStartTime;
            if (jumpDuration < JUMP_HOLD_TIME) {
              setVelocity(v => ({ ...v, y: Math.max(v.y + JUMP_CANCEL_FORCE, MIN_JUMP_FORCE) }));
            }
          }
        }

        // Start button (pause)
        if (currentGamepad.buttons[9].pressed) {
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
        }

        // B button (back to menu)
        if (currentGamepad.buttons[1].pressed) {
          onReturnToMenu();
        }
      }

      animationFrameId = requestAnimationFrame(handleGamepadInput);
    };

    handleGamepadInput();
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isJumping, isJumpHeld, jumpStartTime, gameState, selectedOption]);

  // Simple keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gamepad) return;

      if (gameState === 'game-over') {
        switch (event.key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case '8':
          case '2':
            setSelectedOption(prev => prev === 'play-again' ? 'menu' : 'play-again');
            break;
          case 'Enter':
          case '5':
            if (selectedOption === 'play-again') {
              setPosition({ x: 100, y: GROUND_HEIGHT });
              setVelocity({ x: 0, y: 0 });
              setScore(0);
              setGameState('playing');
              setIsMoving(false);
            } else {
              onReturnToMenu();
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
        case 'ArrowLeft':
        case '4':
          setVelocity(v => ({ ...v, x: -MOVE_SPEED }));
          setDirection('left');
          setIsMoving(true);
          break;
        case 'ArrowRight':
        case '6':
          setVelocity(v => ({ ...v, x: MOVE_SPEED }));
          setDirection('right');
          setIsMoving(true);
          break;
        case 'ArrowUp':
        case '8':
          if (!isJumping && !isJumpHeld) {
            setVelocity(v => ({ ...v, y: MAX_JUMP_FORCE }));
            setIsJumping(true);
            setIsJumpHeld(true);
            setJumpStartTime(Date.now());
          }
          break;
        case '5':
          setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
          break;
        case '0':
          setIsOptionsOpen(prev => !prev);
          break;
        case '9':
        case 'Escape':
          onReturnToMenu();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (gamepad) return;

      switch (event.key) {
        case 'ArrowLeft':
        case '4':
          if (velocity.x < 0) {
            setVelocity(v => ({ ...v, x: 0 }));
            setIsMoving(false);
          }
          break;
        case 'ArrowRight':
        case '6':
          if (velocity.x > 0) {
            setVelocity(v => ({ ...v, x: 0 }));
            setIsMoving(false);
          }
          break;
        case 'ArrowUp':
        case '8':
          setIsJumpHeld(false);
          if (isJumping) {
            const jumpDuration = Date.now() - jumpStartTime;
            if (jumpDuration < JUMP_HOLD_TIME) {
              setVelocity(v => ({ ...v, y: Math.max(v.y + JUMP_CANCEL_FORCE, MIN_JUMP_FORCE) }));
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [velocity, isJumping, gameState, onReturnToMenu, selectedOption, isJumpHeld, jumpStartTime, gamepad]);

  return (
    <GameContainer>
      <GameTitle>Super Mario</GameTitle>
      <InfoBar>
        <ScoreDisplay>Score: {score}</ScoreDisplay>
        <div>Level: {currentLevel + 1}</div>
      </InfoBar>
      <GameArea backgroundColor={LEVELS[currentLevel].backgroundColor}>
        <GameWorld cameraX={cameraX}>
          <Mario
            style={{
              bottom: `${position.y}px`,
              left: `${position.x}px`,
            }}
            jumping={isJumping}
            direction={direction}
            moving={isMoving}
          />
          {collectables.map((collectable, index) => 
            collectable.active && (
              <Coin
                key={`coin-${index}`}
                style={{
                  bottom: `${collectable.y}px`,
                  left: `${collectable.x}px`,
                }}
              />
            )
          )}
          {enemies.map((enemy, index) => (
            <Goomba
              key={index}
              style={{
                bottom: `${enemy.y}px`,
                left: `${enemy.x}px`,
              }}
            />
          ))}
          {platforms.map((platform, index) => (
            <PlatformBlock
              key={index}
              x={platform.x}
              y={platform.y}
              width={platform.width}
            />
          ))}
          <Ground groundColor={LEVELS[currentLevel].groundColor} />
        </GameWorld>
      </GameArea>
      <InfoBar>
        <div>{gamepad ? 'Xbox Controller: A=Jump, Start=Pause, B=Exit' : 'Arrow Keys/Numpad to Move'}</div>
        <div>{gamepad ? 'Use Left Stick to Move' : 'Press 9 to Exit'}</div>
      </InfoBar>
      <OptionsMenu
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        volume={0.3}
        setVolume={() => {}}
        isMuted={false}
        setIsMuted={() => {}}
      />
      {gameState === 'game-over' && (
        <GameOverlay>
          <div>GAME OVER!</div>
          <div>Score: {score}</div>
          <div style={{ marginTop: '20px' }}>
            <OverlayButton 
              focused={selectedOption === 'play-again'}
              onClick={() => {
                setPosition({ x: 100, y: GROUND_HEIGHT });
                setVelocity({ x: 0, y: 0 });
                setScore(0);
                setGameState('playing');
              }}
            >
              Play Again
            </OverlayButton>
            <OverlayButton 
              focused={selectedOption === 'menu'}
              onClick={onReturnToMenu}
            >
              Return to Menu
            </OverlayButton>
          </div>
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            Use Arrow Keys to Select
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
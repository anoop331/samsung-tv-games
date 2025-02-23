import React from 'react';
import styled from 'styled-components';

export type GameType = 'pacman' | 'snake' | 'snakeladders' | 'mario' | 'menu';

interface GameMenuProps {
  onSelectGame: (game: GameType) => void;
}

const MenuContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

const MenuTitle = styled.h1`
  font-family: 'Press Start 2P', monospace;
  color: #ff0;
  text-align: center;
  margin-bottom: 50px;
  font-size: 48px;
  text-shadow: 3px 3px #00f;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const GameList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const GameButton = styled.button<{ selected?: boolean }>`
  background: ${props => props.selected ? '#00f' : 'transparent'};
  border: 2px solid #00f;
  padding: 20px 40px;
  min-width: 300px;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover {
    background: #00f;
    transform: scale(1.05);
    
    &:before {
      left: 100%;
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 255, 0.5);
  }
`;

const ComingSoon = styled.span`
  font-size: 12px;
  color: #888;
  margin-left: 10px;
`;

export const GameMenu: React.FC<GameMenuProps> = ({ onSelectGame }) => {
  const [selectedGame, setSelectedGame] = React.useState<GameType>('menu');

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case '5':
        if (selectedGame !== 'menu') {
          onSelectGame(selectedGame);
        }
        break;
      case 'ArrowUp':
      case '8':
        setSelectedGame(prev => {
          if (prev === 'pacman') return 'mario';
          if (prev === 'snake') return 'pacman';
          if (prev === 'snakeladders') return 'snake';
          return 'snakeladders';
        });
        break;
      case 'ArrowDown':
      case '2':
        setSelectedGame(prev => {
          if (prev === 'snake') return 'snakeladders';
          if (prev === 'snakeladders') return 'mario';
          if (prev === 'mario') return 'pacman';
          return 'snake';
        });
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGame]);

  return (
    <MenuContainer>
      <MenuTitle>Louie-Sam Arcade</MenuTitle>
      <GameList>
        <GameButton 
          selected={selectedGame === 'pacman'}
          onClick={() => {
            setSelectedGame('pacman');
            onSelectGame('pacman');
          }}
        >
          Pac-Man
        </GameButton>
        <GameButton 
          selected={selectedGame === 'snake'}
          onClick={() => {
            setSelectedGame('snake');
            onSelectGame('snake');
          }}
        >
          Snake
        </GameButton>
        <GameButton 
          selected={selectedGame === 'snakeladders'}
          onClick={() => {
            setSelectedGame('snakeladders');
            onSelectGame('snakeladders');
          }}
        >
          Snake & Ladders
        </GameButton>
        <GameButton 
          selected={selectedGame === 'mario'}
          onClick={() => {
            setSelectedGame('mario');
            onSelectGame('mario');
          }}
        >
          Super Mario
        </GameButton>
      </GameList>
    </MenuContainer>
  );
}; 
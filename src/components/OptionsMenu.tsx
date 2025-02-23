import React from 'react';
import styled from 'styled-components';
import { soundManager } from '../sounds';

interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const OptionsOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const OptionsPanel = styled.div`
  background: #000;
  border: 2px solid #00f;
  padding: 20px;
  border-radius: 10px;
  min-width: 300px;
  color: white;
  font-family: 'Press Start 2P', monospace;
`;

const OptionRow = styled.div`
  margin: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.button`
  background: #00f;
  color: white;
  border: none;
  padding: 10px 20px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  margin: 5px;
  
  &:hover {
    background: #00a;
  }
`;

const VolumeSlider = styled.input`
  width: 150px;
  margin-left: 10px;
`;

const Title = styled.h2`
  text-align: center;
  color: #ff0;
  margin-bottom: 20px;
`;

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  isOpen,
  onClose,
  volume,
  setVolume,
  isMuted,
  setIsMuted
}) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    // Update all audio objects in the sound pools
    Object.values(soundManager['soundPools']).forEach(pool => {
      pool.forEach(audio => {
        audio.volume = newVolume;
      });
    });
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.toggleMute();
  };

  return (
    <OptionsOverlay isOpen={isOpen} onClick={onClose}>
      <OptionsPanel onClick={e => e.stopPropagation()}>
        <Title>OPTIONS</Title>
        
        <OptionRow>
          <span>Sound:</span>
          <Button onClick={handleMuteToggle}>
            {isMuted ? '🔇 UNMUTE' : '🔊 MUTE'}
          </Button>
        </OptionRow>

        <OptionRow>
          <span>Volume:</span>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={isMuted}
          />
        </OptionRow>

        <OptionRow>
          <span>Controls:</span>
          <div style={{ fontSize: '0.8em', textAlign: 'right' }}>
            Number Pad:<br />
            8 - Move Up<br />
            2 - Move Down<br />
            4 - Move Left<br />
            6 - Move Right<br />
            5/OK - Pause<br />
            0/Menu - Options<br />
            1 - Mute
          </div>
        </OptionRow>

        <OptionRow style={{ justifyContent: 'center' }}>
          <Button onClick={onClose}>CLOSE</Button>
        </OptionRow>
      </OptionsPanel>
    </OptionsOverlay>
  );
}; 
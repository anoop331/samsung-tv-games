// Import the sound file
import soundFile from './sound.mp3';

// Use the imported sound file for all sound effects
const SOUNDS = {
  chomp: soundFile,
  death: soundFile,
  ghost: soundFile,
  powerPellet: soundFile
};

class SoundManager {
  private soundPools: { [key: string]: HTMLAudioElement[] } = {};
  private muted: boolean = false;
  private readonly poolSize = 3; // Number of audio objects per sound type

  constructor() {
    // Initialize pools of audio objects for each sound
    Object.entries(SOUNDS).forEach(([key, value]) => {
      this.soundPools[key] = Array.from({ length: this.poolSize }, () => {
        const audio = new Audio(value);
        audio.volume = 0.3;
        return audio;
      });
    });
  }

  play(sound: keyof typeof SOUNDS) {
    if (this.muted) return;
    
    // Find an audio object that's not playing or the one that's furthest along
    const audioPool = this.soundPools[sound];
    const availableAudio = audioPool.find(audio => audio.paused) || 
                          audioPool.reduce((prev, curr) => 
                            (curr.currentTime > prev.currentTime) ? curr : prev
                          );

    // Reset and play the sound
    availableAudio.currentTime = 0;
    availableAudio.play().catch(() => {}); // Ignore autoplay restrictions
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundManager = new SoundManager(); 
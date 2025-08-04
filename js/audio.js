// Audio system for Balloon Catcher game
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.4;
        this.muted = false;
        
        this.initAudioContext();
        this.backgroundMusic = null;
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Resume audio context (required for mobile)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Play balloon catch sound - cheerful and bouncy
    playCatchSound() {
        if (this.muted || !this.audioContext) return;
        
        this.resumeAudioContext();
        
        // Create a happy, bouncy sound for catching balloons
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Happy chord progression
        oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator1.frequency.exponentialRampToValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator1.frequency.exponentialRampToValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
        
        oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime); // E5
        oscillator2.frequency.exponentialRampToValueAtTime(784, this.audioContext.currentTime + 0.1); // G5
        oscillator2.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.2); // C6
        
        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }

    // Play game over sound - sad but not too harsh
    playGameOverSound() {
        if (this.muted || !this.audioContext) return;
        
        this.resumeAudioContext();
        
        // Create a descending, sad sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.5); // A3
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1.0); // A2
        
        oscillator.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 1.0);
        
        gainNode.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }

    // Play balloon pop sound when balloon hits ground
    playBalloonPopSound() {
        if (this.muted || !this.audioContext) return;
        
        this.resumeAudioContext();
        
        // Create a quick pop sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // Start cheerful background music
    startBackgroundMusic() {
        if (this.muted || !this.audioContext || this.backgroundMusic) return;
        
        this.resumeAudioContext();
        
        this.backgroundMusic = {
            oscillator1: this.audioContext.createOscillator(),
            oscillator2: this.audioContext.createOscillator(),
            gainNode: this.audioContext.createGain(),
            filter: this.audioContext.createBiquadFilter()
        };
        
        const { oscillator1, oscillator2, gainNode, filter } = this.backgroundMusic;
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a happy, upbeat melody
        oscillator1.frequency.setValueAtTime(262, this.audioContext.currentTime); // C4
        oscillator2.frequency.setValueAtTime(330, this.audioContext.currentTime); // E4
        
        oscillator1.type = 'sine';
        oscillator2.type = 'triangle';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.15 * this.musicVolume * this.masterVolume, this.audioContext.currentTime);
        
        oscillator1.start();
        oscillator2.start();
        
        // Create melody pattern
        this.createMelodyPattern();
    }

    createMelodyPattern() {
        if (!this.backgroundMusic) return;
        
        // Happy melody notes (C major scale)
        const melody1 = [262, 294, 330, 349, 392, 440, 494, 523]; // C4 to C5
        const melody2 = [330, 349, 392, 415, 440, 494, 523, 587]; // E4 to D5
        
        let noteIndex = 0;
        
        const playNextNote = () => {
            if (!this.backgroundMusic) return;
            
            try {
                const freq1 = melody1[noteIndex % melody1.length];
                const freq2 = melody2[noteIndex % melody2.length];
                
                this.backgroundMusic.oscillator1.frequency.setValueAtTime(freq1, this.audioContext.currentTime);
                this.backgroundMusic.oscillator2.frequency.setValueAtTime(freq2, this.audioContext.currentTime);
                
                noteIndex++;
                setTimeout(playNextNote, 800); // Change note every 800ms
            } catch (e) {
                // Oscillator might have been stopped
            }
        };
        
        playNextNote();
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try {
                this.backgroundMusic.oscillator1.stop();
                this.backgroundMusic.oscillator2.stop();
            } catch (e) {
                // Oscillators might already be stopped
            }
            this.backgroundMusic = null;
        }
    }

    // Play bonus sound for special balloons
    playBonusSound() {
        if (this.muted || !this.audioContext) return;
        
        this.resumeAudioContext();
        
        // Create a magical, sparkly sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        oscillator3.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Magical chord
        oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime); // E5
        oscillator3.frequency.setValueAtTime(784, this.audioContext.currentTime); // G5
        
        oscillator1.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.4); // C6
        oscillator2.frequency.exponentialRampToValueAtTime(1319, this.audioContext.currentTime + 0.4); // E6
        oscillator3.frequency.exponentialRampToValueAtTime(1568, this.audioContext.currentTime + 0.4); // G6
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator3.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator1.start();
        oscillator2.start();
        oscillator3.start();
        oscillator1.stop(this.audioContext.currentTime + 0.5);
        oscillator2.stop(this.audioContext.currentTime + 0.5);
        oscillator3.stop(this.audioContext.currentTime + 0.5);
    }

    // Toggle mute
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
        return this.muted;
    }

    // Set volume levels
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.gainNode.gain.setValueAtTime(
                0.15 * this.musicVolume * this.masterVolume, 
                this.audioContext.currentTime
            );
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();

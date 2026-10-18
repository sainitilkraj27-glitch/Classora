// High-Fidelity Modern Smartphone Melodic Ringtone Synthesizer (Web Audio API)
// Provides a rich, beautiful, premium marimba/chime call melody ("Mast Phone Tune")
// Works reliably across mobile and desktop browsers with auto-resume and vibration.

class RingtoneManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isRinging: boolean = false;
  private isMuted: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext init error:', e);
      return null;
    }
  }

  // Play a single musical chime note with warm harmonic marimba overtone & gentle wood decay
  private playChimeNote(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number = 0.16,
    hasOvertone: boolean = true
  ) {
    if (this.isMuted) return;

    try {
      // 1. Fundamental warm wave (triangle wave for wooden chime/marimba body)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      // 2. Harmonic overtone (pure sine wave 2x or 3x frequency for bright crystalline chime)
      let osc2: OscillatorNode | null = null;
      let overtoneGain: GainNode | null = null;
      if (hasOvertone) {
        osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0.35, startTime);
      }

      // 3. Low-pass filter to give rich acoustic warmth (not harsh digital beep)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, startTime);
      filter.Q.setValueAtTime(2, startTime);

      // 4. Amplitude Envelope: Snappy percussive attack + smooth exponential decay
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Connect graph
      osc1.connect(filter);
      if (osc2 && overtoneGain) {
        osc2.connect(overtoneGain);
        overtoneGain.connect(filter);
      }
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(startTime);
      if (osc2) osc2.start(startTime);

      const stopTime = startTime + duration + 0.05;
      osc1.stop(stopTime);
      if (osc2) osc2.stop(stopTime);
    } catch (e) {
      // Ignore audio scheduling exceptions
    }
  }

  // Play a full melodious smartphone ringtone phrase
  private playMelodyPhrase() {
    const ctx = this.initContext();
    if (!ctx || ctx.state === 'closed' || this.isMuted) return;

    const now = ctx.currentTime;

    // "Mast" Smartphone Marimba Chime Melody (E Major / C# minor pentatonic sparkle)
    // Upbeat, modern, clear, rhythmic ring sequence
    const notes = [
      // Phrase 1 (Bright Ascending Call)
      { freq: 659.25, time: 0.00, dur: 0.22, vol: 0.18, overtone: true },  // E5
      { freq: 830.61, time: 0.14, dur: 0.22, vol: 0.15, overtone: true },  // G#5
      { freq: 987.77, time: 0.28, dur: 0.22, vol: 0.16, overtone: true },  // B5
      { freq: 1318.51, time: 0.42, dur: 0.32, vol: 0.22, overtone: true }, // E6 (High Accent)
      { freq: 1244.51, time: 0.62, dur: 0.22, vol: 0.16, overtone: true }, // D#6
      { freq: 987.77, time: 0.76, dur: 0.22, vol: 0.15, overtone: true },  // B5
      { freq: 1108.73, time: 0.90, dur: 0.26, vol: 0.18, overtone: true }, // C#6
      { freq: 830.61, time: 1.08, dur: 0.28, vol: 0.14, overtone: true },  // G#5

      // Phrase 2 (Catchy Melodic Hook)
      { freq: 880.00, time: 1.30, dur: 0.22, vol: 0.16, overtone: true },  // A5
      { freq: 1108.73, time: 1.44, dur: 0.22, vol: 0.18, overtone: true }, // C#6
      { freq: 1318.51, time: 1.58, dur: 0.34, vol: 0.22, overtone: true }, // E6
      { freq: 987.77, time: 1.78, dur: 0.42, vol: 0.20, overtone: true },  // B5
      { freq: 659.25, time: 1.78, dur: 0.42, vol: 0.12, overtone: false }, // E5 bass root
    ];

    notes.forEach((n) => {
      this.playChimeNote(ctx, n.freq, now + n.time, n.dur, n.vol, n.overtone);
    });

    // Mobile vibration pattern matching the ring melody
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 200, 700]);
      }
    } catch (e) {}
  }

  // Start continuous rhythmic ringing
  public start() {
    if (this.isRinging) return;
    this.isRinging = true;

    // Immediately play the first ring
    this.playMelodyPhrase();

    // Loop every 2.7 seconds
    this.intervalId = setInterval(() => {
      if (!this.isRinging) return;
      this.playMelodyPhrase();
    }, 2700);
  }

  // Stop ringtone completely
  public stop() {
    this.isRinging = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.suspend().catch(() => {});
      } catch (e) {}
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    } else if (this.isRinging) {
      this.start();
    }
  }

  public getIsRinging() {
    return this.isRinging;
  }
}

export const ringtoneService = new RingtoneManager();

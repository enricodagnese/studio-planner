class SoundUtility {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Fanfare / Celebration chime for exams completed
  public static playExamCompleted() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const playTone = (time: number, freq: number, duration: number, volume = 0.1) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle'; // warmer sound
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      // Triumphant progression: C5 -> E5 -> G5 -> C6
      playTone(now, 523.25, 0.4);        // C5
      playTone(now + 0.1, 659.25, 0.4);  // E5
      playTone(now + 0.2, 783.99, 0.4);  // G5
      playTone(now + 0.3, 1046.50, 0.8, 0.12); // C6 (long and slightly louder)
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Bouncy, playful bubble/pop sound for leisure/fun activities completed
  public static playLeisureCompleted() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const playBubble = (time: number, freqStart: number, freqEnd: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqStart, time);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, time + duration);
        gainNode.gain.setValueAtTime(0.08, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      // Play two quick upward bubbles
      playBubble(now, 400, 800, 0.12);
      playBubble(now + 0.08, 600, 1200, 0.15);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Classic dual-frequency resonant bell sound for lectures/lessons completed
  public static playLectureCompleted() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const playBellNode = (freq: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      };

      // Ringing dual frequency (A5 + C#6)
      playBellNode(880, 0.08);    // A5
      playBellNode(1109.73, 0.06); // C#6
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Chime for task completed: double pleasant ping, or custom sounds for events
  public static playTaskCompleted(eventType?: 'esame' | 'svago' | 'lezione' | 'altro' | string) {
    if (eventType === 'esame') {
      this.playExamCompleted();
      return;
    }
    if (eventType === 'svago') {
      this.playLeisureCompleted();
      return;
    }
    if (eventType === 'lezione') {
      this.playLectureCompleted();
      return;
    }

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Soft descending pop/whoosh for task deleted
  public static playTaskDeleted() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Clean, optimistic synth chime for Pomodoro/Break Start
  public static playTimerStart() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Quiet, low chime for Timer Pause
  public static playTimerPause() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(370, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Digital chime for Pomodoro Completion (major third progression)
  public static playTimerComplete() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0.12, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(now, 523.25, 0.45);       // C5
      playTone(now + 0.12, 659.25, 0.45);  // E5
      playTone(now + 0.24, 783.99, 0.55);   // G5
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }

  // Gentle, extremely short click/tick sound for tab transitions and buttons
  public static playNavClick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn("Audio play blocked", e);
    }
  }
}

export default SoundUtility;

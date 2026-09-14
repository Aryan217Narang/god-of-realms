/**
 * Web Audio API Sound Generator for God of Realms
 * Uses synthetic oscillators to play pleasant retro chimes and alarms
 * with 100% reliability (0 external asset dependencies).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private currentAlarmInterval: number | null = null;
  private alarmStopTimeout: number | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play a single pleasant fantasy chime note
   */
  public playNote(freq: number, durationSec: number = 0.25, type: OscillatorType = 'sine', gainVal: number = 0.15) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio context might be restricted before first user interaction
    }
  }

  /**
   * Play the Timer Alarm:
   * Rings a multi-tone royal fantasy fanfare chime every 800ms for exactly 5 seconds, then stops automatically!
   * Returns a stop function so the user can dismiss it early if desired.
   */
  public playTimerCompletionAlarm(durationMs: number = 5000, onStop?: () => void): () => void {
    this.stopAlarm();

    const ringChime = () => {
      // Pleasant melodic 3-tone chime sequence (E5 -> G#5 -> B5 -> E6)
      this.playNote(659.25, 0.22, 'triangle', 0.22); // E5
      setTimeout(() => this.playNote(830.61, 0.22, 'triangle', 0.22), 120); // G#5
      setTimeout(() => this.playNote(987.77, 0.25, 'triangle', 0.25), 240); // B5
      setTimeout(() => this.playNote(1318.51, 0.45, 'sine', 0.3), 360); // E6
    };

    // First ring immediately
    ringChime();

    // Repeat chime every 900ms
    this.currentAlarmInterval = window.setInterval(ringChime, 900);

    // Auto-stop after specified duration (5 seconds)
    this.alarmStopTimeout = window.setTimeout(() => {
      this.stopAlarm();
      if (onStop) onStop();
    }, durationMs);

    return () => {
      this.stopAlarm();
      if (onStop) onStop();
    };
  }

  public stopAlarm() {
    if (this.currentAlarmInterval !== null) {
      clearInterval(this.currentAlarmInterval);
      this.currentAlarmInterval = null;
    }
    if (this.alarmStopTimeout !== null) {
      clearTimeout(this.alarmStopTimeout);
      this.alarmStopTimeout = null;
    }
  }

  /**
   * Quick click / UI feedback sound
   */
  public playClick() {
    this.playNote(880, 0.06, 'sine', 0.08);
  }
}

export const soundManager = new SoundManager();

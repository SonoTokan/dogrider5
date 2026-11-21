class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.08
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playJump() {
    this.playTone(230, 460, 0.14, 'sine', 0.07);
  }

  playBone(kind: 'normal' | 'green' | 'purple') {
    if (kind === 'normal') {
      this.playTone(540, 740, 0.11, 'triangle', 0.06);
    } else if (kind === 'green') {
      this.playTone(587, 880, 0.16, 'sine', 0.075);
      setTimeout(() => this.playTone(880, 1174, 0.14, 'triangle', 0.06), 60);
    } else {
      this.playTone(523, 784, 0.14, 'sine', 0.08);
      setTimeout(() => this.playTone(784, 1046, 0.16, 'sine', 0.08), 65);
      setTimeout(() => this.playTone(1046, 1568, 0.22, 'triangle', 0.07), 130);
    }
  }

  playHeal(isMedkit: boolean) {
    this.playTone(440, 587, 0.16, 'sine', 0.07);
    if (isMedkit) {
      setTimeout(() => this.playTone(587, 880, 0.22, 'sine', 0.08), 90);
    }
  }

  playShoot(style: 'twin_mg' | 'piercing_carbine' | 'flak_mortar' | 'scatter_carbine') {
    if (style === 'twin_mg') {
      this.playTone(280, 95, 0.065, 'sawtooth', 0.045);
    } else if (style === 'piercing_carbine') {
      this.playTone(620, 140, 0.11, 'square', 0.05);
    } else if (style === 'flak_mortar') {
      this.playTone(165, 55, 0.19, 'triangle', 0.08);
    } else {
      this.playTone(340, 85, 0.09, 'sawtooth', 0.06);
    }
  }

  playSkill() {
    this.playTone(380, 760, 0.18, 'triangle', 0.075);
    setTimeout(() => this.playTone(760, 980, 0.14, 'sine', 0.06), 70);
  }

  playHit() {
    this.playTone(145, 48, 0.18, 'sawtooth', 0.09);
    this.playHurtYelp(1.0);
  }

  playHurtYelp(pitchScale = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520 * pitchScale, now);
    osc.frequency.exponentialRampToValueAtTime(280 * pitchScale, now + 0.18);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.2, now);
    filter.frequency.setValueAtTime(1100 * pitchScale, now);
    filter.frequency.exponentialRampToValueAtTime(520 * pitchScale, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playDeathYelp(pitchScale = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Expressive dog/rider yelp ("嗷呜——!") via dual-oscillator + vocal bandpass sweep
    const mainOsc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const formant = ctx.createBiquadFilter();
    const yelpGain = ctx.createGain();

    mainOsc.type = 'sawtooth';
    subOsc.type = 'triangle';

    // Sharp startled spike then falling wail
    mainOsc.frequency.setValueAtTime(590 * pitchScale, now);
    mainOsc.frequency.linearRampToValueAtTime(840 * pitchScale, now + 0.06);
    mainOsc.frequency.exponentialRampToValueAtTime(215 * pitchScale, now + 0.54);

    subOsc.frequency.setValueAtTime(295 * pitchScale, now);
    subOsc.frequency.linearRampToValueAtTime(420 * pitchScale, now + 0.06);
    subOsc.frequency.exponentialRampToValueAtTime(110 * pitchScale, now + 0.54);

    // Subtle vocal tremor
    lfo.frequency.setValueAtTime(19, now);
    lfoGain.gain.setValueAtTime(22 * pitchScale, now);
    lfo.connect(lfoGain);
    lfoGain.connect(mainOsc.frequency);

    formant.type = 'bandpass';
    formant.Q.setValueAtTime(2.6, now);
    formant.frequency.setValueAtTime(1480 * pitchScale, now);
    formant.frequency.exponentialRampToValueAtTime(420 * pitchScale, now + 0.54);

    yelpGain.gain.setValueAtTime(0.001, now);
    yelpGain.gain.linearRampToValueAtTime(0.13, now + 0.035);
    yelpGain.gain.setValueAtTime(0.11, now + 0.14);
    yelpGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.56);

    mainOsc.connect(formant);
    subOsc.connect(formant);
    formant.connect(yelpGain);
    yelpGain.connect(ctx.destination);

    lfo.start(now);
    mainOsc.start(now);
    subOsc.start(now);
    lfo.stop(now + 0.58);
    mainOsc.stop(now + 0.58);
    subOsc.stop(now + 0.58);

    // 2. Tire skid & asphalt crash noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.42);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.14));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(920, now);
    noiseFilter.Q.setValueAtTime(1.1, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 3. Secondary frame bounce thud when hitting tarmac
    setTimeout(() => {
      this.playTone(135, 42, 0.16, 'triangle', 0.09);
    }, 170);
  }

  playBlackoutShift(enteringDark: boolean) {
    if (enteringDark) {
      this.playTone(240, 110, 0.45, 'sine', 0.06);
    } else {
      this.playTone(220, 390, 0.35, 'sine', 0.05);
    }
  }

  playAchievement() {
    this.playTone(523.25, 659.25, 0.15, 'triangle', 0.07);
    setTimeout(() => this.playTone(659.25, 783.99, 0.16, 'triangle', 0.07), 90);
    setTimeout(() => this.playTone(783.99, 1046.5, 0.26, 'sine', 0.08), 180);
  }

  private lastSparkAt = 0;

  playSpark() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastSparkAt < 0.055) return;
    this.lastSparkAt = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 1850 + Math.random() * 1400;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(520 + Math.random() * 240, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.032, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playExplosion() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Sub-bass concussive thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(115, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.42);
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.22, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.46);

    // 2. Low-pass filtered blast roar + debris crackle
    const bufferSize = Math.floor(ctx.sampleRate * 0.52);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.16));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.5);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.2, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  playFinishVictory() {
    this.playTone(523.25, 523.25, 0.14, 'triangle', 0.08);
    setTimeout(() => this.playTone(659.25, 659.25, 0.14, 'triangle', 0.08), 110);
    setTimeout(() => this.playTone(783.99, 783.99, 0.14, 'triangle', 0.08), 220);
    setTimeout(() => this.playTone(1046.5, 1046.5, 0.38, 'sine', 0.095), 330);
  }
}

export const soundEngine = new SoundEngine();

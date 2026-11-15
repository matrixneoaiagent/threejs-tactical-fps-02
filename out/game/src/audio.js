let ctx = null;
let humOsc = null;
let humGain = null;

function getContext() {
  return ctx;
}

function createNoiseBuffer(duration = 0.2) {
  if (!ctx) return null;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const audio = {
  init() {
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        ctx = new AudioContextClass();
      } catch {
        ctx = null;
      }
    }
  },

  playGunshot(pitch = 1.0) {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Noise crack
      const noise = createNoiseBuffer(0.12);
      if (noise) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 * pitch, now);
        filter.Q.setValueAtTime(1.2, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noiseSrc.start(now);
      }

      // Punchy sub-thud
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(35 * pitch, now + 0.08);

      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio fallback safe
    }
  },

  playExplosion() {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Heavy noise burst
      const noise = createNoiseBuffer(0.8);
      if (noise) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.8);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noiseSrc.start(now);
      }

      // Sub-bass shockwave
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.7);

      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch {
      // Safe fallback
    }
  },

  playBombBeep() {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Safe fallback
    }
  },

  playReload() {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // First click
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // Second click (magazine seating)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(450, now + 0.16);
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.22);
      gain2.gain.setValueAtTime(0.35, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.22);
    } catch {
      // Safe fallback
    }
  },

  playHitSound(headshot = false) {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (headshot) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (headshot ? 0.14 : 0.08));
    } catch {
      // Safe fallback
    }
  },

  playDefuseHum(active) {
    if (!ctx) return;
    try {
      if (active) {
        if (!humOsc) {
          humOsc = ctx.createOscillator();
          humOsc.type = 'sawtooth';
          humOsc.frequency.setValueAtTime(130, ctx.currentTime);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, ctx.currentTime);

          humGain = ctx.createGain();
          humGain.gain.setValueAtTime(0.08, ctx.currentTime);

          humOsc.connect(filter);
          filter.connect(humGain);
          humGain.connect(ctx.destination);
          humOsc.start();
        }
      } else if (humOsc) {
        humOsc.stop();
        humOsc.disconnect();
        humOsc = null;
        humGain = null;
      }
    } catch {
      humOsc = null;
      humGain = null;
    }
  },
};

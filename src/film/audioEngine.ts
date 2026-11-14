import { DIGIT_CUES } from './choreography';
import { FILM_DURATION } from './types';

function createImpulseResponse(ctx: BaseAudioContext, seconds = 2.4, decay = 2.8): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const env = Math.pow(1 - i / length, decay);
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[i] = last * env * 0.36;
    }
  }
  return impulse;
}

function createNoiseBuffer(ctx: BaseAudioContext, seconds = 0.6): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }
  return buf;
}

interface SchedulerTarget {
  ctx: BaseAudioContext;
  master: AudioNode;
  reverbSend: AudioNode;
  noiseBuffer: AudioBuffer;
  offset: number;
  minFilmTime: number;
  trackNode: (node: AudioScheduledSourceNode) => void;
}

function scheduleFeltPianoNote(
  target: SchedulerTarget,
  filmTime: number,
  freq: number,
  duration: number,
  velocity = 0.18,
  pan = 0,
) {
  if (filmTime < target.minFilmTime - 0.05) return;
  const start = target.offset + Math.max(0, filmTime);
  const { ctx } = target;

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(pan, start);

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(Math.min(3000, freq * 4.8), start);
  lpf.frequency.exponentialRampToValueAtTime(Math.max(260, freq * 1.5), start + duration * 0.75);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(velocity, start + 0.015);
  env.gain.exponentialRampToValueAtTime(velocity * 0.42, start + 0.32);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, start);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, start);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.12, start);

  osc1.connect(lpf);
  osc2.connect(g2);
  g2.connect(lpf);

  lpf.connect(env);
  env.connect(panner);
  panner.connect(target.master);
  panner.connect(target.reverbSend);

  osc1.start(start);
  osc2.start(start);
  osc1.stop(start + duration + 0.05);
  osc2.stop(start + duration + 0.05);
  target.trackNode(osc1);
  target.trackNode(osc2);
}

function scheduleAmbientPad(
  target: SchedulerTarget,
  filmTime: number,
  freqs: number[],
  duration: number,
  gainLevel = 0.048,
) {
  if (filmTime + duration < target.minFilmTime) return;
  const start = target.offset + Math.max(0, filmTime);
  const end = target.offset + filmTime + duration;
  const { ctx } = target;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(480, start);
  filter.frequency.linearRampToValueAtTime(900, start + duration * 0.45);
  filter.frequency.linearRampToValueAtTime(380, end);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gainLevel, start + Math.min(1.4, duration * 0.35));
  env.gain.linearRampToValueAtTime(gainLevel * 0.85, end - Math.min(1.6, duration * 0.3));
  env.gain.exponentialRampToValueAtTime(0.0001, end);

  filter.connect(env);
  env.connect(target.master);
  env.connect(target.reverbSend);

  for (const f of freqs) {
    for (const detune of [-4, 4]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, start);
      osc.detune.setValueAtTime(detune, start);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(1 / (freqs.length * 2), start);
      osc.connect(subGain);
      subGain.connect(filter);
      osc.start(start);
      osc.stop(end + 0.05);
      target.trackNode(osc);
    }
  }
}

function scheduleKeystroke(target: SchedulerTarget, filmTime: number, pitchJitter = 0) {
  if (filmTime < target.minFilmTime) return;
  const start = target.offset + filmTime;
  const { ctx } = target;

  const src = ctx.createBufferSource();
  src.buffer = target.noiseBuffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(2200 + pitchJitter * 160, start);
  bp.Q.setValueAtTime(3.2, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(0.24, start + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);

  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(170 + pitchJitter * 12, start);
  thud.frequency.exponentialRampToValueAtTime(70, start + 0.022);

  const thudEnv = ctx.createGain();
  thudEnv.gain.setValueAtTime(0.07, start);
  thudEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.025);

  src.connect(bp);
  bp.connect(env);
  env.connect(target.master);

  thud.connect(thudEnv);
  thudEnv.connect(target.master);

  src.start(start);
  src.stop(start + 0.04);
  thud.start(start);
  thud.stop(start + 0.035);
  target.trackNode(src);
  target.trackNode(thud);
}

function scheduleSearchInteract(target: SchedulerTarget, filmTime: number) {
  if (filmTime < target.minFilmTime) return;
  const start = target.offset + filmTime;
  const { ctx } = target;

  scheduleKeystroke(target, filmTime, -1.5);

  for (const [freq, amp] of [
    [880, 0.05],
    [1318.5, 0.024],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start + 0.03);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start + 0.03);
    env.gain.linearRampToValueAtTime(amp, start + 0.045);
    env.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);

    osc.connect(env);
    env.connect(target.master);
    env.connect(target.reverbSend);
    osc.start(start + 0.03);
    osc.stop(start + 0.9);
    target.trackNode(osc);
  }
}

function schedulePaperMovement(target: SchedulerTarget, filmTime: number, duration = 0.42, level = 0.13) {
  if (filmTime < target.minFilmTime) return;
  const start = target.offset + filmTime;
  const { ctx } = target;

  const src = ctx.createBufferSource();
  src.buffer = target.noiseBuffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(700, start);
  bp.frequency.exponentialRampToValueAtTime(2100, start + duration * 0.45);
  bp.frequency.exponentialRampToValueAtTime(900, start + duration);
  bp.Q.setValueAtTime(1.1, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(level, start + duration * 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(bp);
  bp.connect(env);
  env.connect(target.master);
  env.connect(target.reverbSend);

  src.start(start);
  src.stop(start + duration + 0.02);
  target.trackNode(src);
}

function scheduleCinematicImpact(target: SchedulerTarget, filmTime: number, pitch = 73.42, gain = 0.18) {
  if (filmTime < target.minFilmTime) return;
  const start = target.offset + filmTime;
  const { ctx } = target;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitch * 1.35, start);
  osc.frequency.exponentialRampToValueAtTime(pitch, start + 0.12);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);

  osc.connect(env);
  env.connect(target.master);
  env.connect(target.reverbSend);

  osc.start(start);
  osc.stop(start + 1.9);
  target.trackNode(osc);
}

function scheduleFullFilmScore(target: SchedulerTarget) {
  // 1. Typing SFX (0.75s – 2.08s)
  DIGIT_CUES.forEach((cue, i) => {
    scheduleKeystroke(target, cue, (i % 3) - 1);
  });

  // 2. Search Interaction (2.44s)
  scheduleSearchInteract(target, 2.44);

  // 3. Scene Transitions
  schedulePaperMovement(target, 3.52, 0.42, 0.12);
  schedulePaperMovement(target, 13.54, 0.45, 0.14);
  schedulePaperMovement(target, 24.02, 0.48, 0.14);

  // 4. Restrained Low Impacts (Failed entry reveal, dramatic close-up, certificate reveal, full view)
  scheduleCinematicImpact(target, 14.55, 73.42, 0.17);
  scheduleCinematicImpact(target, 20.44, 65.41, 0.19);
  scheduleCinematicImpact(target, 24.02, 73.42, 0.18);
  scheduleCinematicImpact(target, 29.65, 73.42, 0.16);

  // 5. Felt Piano Score
  scheduleFeltPianoNote(target, 0.15, 293.66, 2.8, 0.12, -0.14);
  scheduleFeltPianoNote(target, 1.35, 440.0, 2.4, 0.10, 0.12);

  // Student list
  scheduleFeltPianoNote(target, 3.65, 246.94, 3.4, 0.12, -0.12);
  scheduleFeltPianoNote(target, 5.5, 369.99, 3.2, 0.11, 0.12);
  scheduleFeltPianoNote(target, 7.6, 440.0, 3.2, 0.12, -0.06);
  scheduleFeltPianoNote(target, 9.8, 329.63, 3.0, 0.11, 0.10);
  scheduleFeltPianoNote(target, 11.8, 293.66, 2.8, 0.11, -0.1);

  // Page 10 Failed Students & Dramatic Tension
  scheduleFeltPianoNote(target, 13.7, 246.94, 3.0, 0.13, -0.1);
  scheduleFeltPianoNote(target, 14.6, 123.47, 3.4, 0.18, 0.0);
  scheduleFeltPianoNote(target, 16.4, 329.63, 2.8, 0.11, 0.14);
  scheduleFeltPianoNote(target, 18.2, 246.94, 2.6, 0.12, -0.12);

  scheduleFeltPianoNote(target, 20.48, 123.47, 3.4, 0.19, 0.0);
  scheduleFeltPianoNote(target, 21.25, 293.66, 2.8, 0.14, -0.12);
  scheduleFeltPianoNote(target, 22.35, 349.23, 2.4, 0.12, 0.12);

  // Certificate reveal resolution (D Major)
  scheduleFeltPianoNote(target, 24.08, 146.83, 4.8, 0.18, 0.0);
  scheduleFeltPianoNote(target, 24.95, 293.66, 3.8, 0.13, -0.14);
  scheduleFeltPianoNote(target, 26.1, 369.99, 3.6, 0.13, 0.12);
  scheduleFeltPianoNote(target, 27.35, 440.0, 3.8, 0.14, -0.08);
  scheduleFeltPianoNote(target, 28.55, 587.33, 3.6, 0.15, 0.14);
  scheduleFeltPianoNote(target, 29.7, 146.83, 2.3, 0.16, 0.0);
  scheduleFeltPianoNote(target, 29.74, 293.66, 2.25, 0.12, -0.14);
  scheduleFeltPianoNote(target, 29.78, 369.99, 2.2, 0.12, 0.14);
  scheduleFeltPianoNote(target, 29.82, 440.0, 2.15, 0.11, -0.06);

  // 6. Ambient String Pad
  scheduleAmbientPad(target, 0.2, [146.83, 220.0, 369.99], 3.2, 0.026);
  scheduleAmbientPad(target, 3.6, [196.0, 293.66, 440.0], 9.4, 0.036);
  scheduleAmbientPad(target, 13.5, [123.47, 185.0, 293.66], 10.2, 0.044);
  scheduleAmbientPad(target, 23.9, [146.83, 220.0, 369.99, 440.0], 7.9, 0.054);
}

export class LiveFilmAudioPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeNodes: AudioScheduledSourceNode[] = [];
  private muted = false;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = createImpulseResponse(this.ctx, 2.4, 2.8);
      const revGain = this.ctx.createGain();
      revGain.gain.value = 0.32;
      this.reverbNode.connect(revGain);
      revGain.connect(this.masterGain);

      this.noiseBuffer = createNoiseBuffer(this.ctx, 0.7);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.03);
    }
  }

  public stopAll() {
    for (const node of this.activeNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeNodes = [];
  }

  public playFromFilmTime(filmTime: number) {
    if (filmTime >= FILM_DURATION) return;
    this.ensureContext();
    this.stopAll();
    if (!this.ctx || !this.masterGain || !this.reverbNode || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const offset = now - filmTime;

    scheduleFullFilmScore({
      ctx: this.ctx,
      master: this.masterGain,
      reverbSend: this.reverbNode,
      noiseBuffer: this.noiseBuffer,
      offset,
      minFilmTime: filmTime,
      trackNode: (node) => this.activeNodes.push(node),
    });
  }
}

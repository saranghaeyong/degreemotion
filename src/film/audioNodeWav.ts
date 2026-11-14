import { DIGIT_CUES } from './choreography';
import { FILM_DURATION } from './types';

// Pure-Node 48 kHz Stereo PCM WAV synthesizer matching the exact 5-scene film cue sheet

const SAMPLE_RATE = 48000;

function addFeltPiano(
  left: Float32Array,
  right: Float32Array,
  startSec: number,
  freq: number,
  durationSec: number,
  velocity: number,
  pan: number,
) {
  const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const endIdx = Math.min(left.length, Math.floor((startSec + durationSec) * SAMPLE_RATE));
  const panL = Math.cos(((pan + 1) * Math.PI) / 4);
  const panR = Math.sin(((pan + 1) * Math.PI) / 4);
  const omega = (2 * Math.PI * freq) / SAMPLE_RATE;

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const attack = t < 0.015 ? t / 0.015 : 1;
    const decay = Math.exp(-t * (2.6 / Math.max(0.8, durationSec)));
    const env = attack * decay * velocity;
    const fundamental = Math.sin(omega * (i - startIdx));
    const harm2 = 0.22 * Math.sin(omega * 2 * (i - startIdx)) * Math.exp(-t * 4.2);
    const harm3 = 0.06 * Math.sin(omega * 3 * (i - startIdx)) * Math.exp(-t * 7.5);
    const sample = (fundamental + harm2 + harm3) * env;
    left[i] += sample * panL;
    right[i] += sample * panR;
  }
}

function addAmbientPad(
  left: Float32Array,
  right: Float32Array,
  startSec: number,
  freqs: number[],
  durationSec: number,
  gainLevel: number,
) {
  const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const endIdx = Math.min(left.length, Math.floor((startSec + durationSec) * SAMPLE_RATE));
  const fadeIn = Math.min(1.4, durationSec * 0.35);
  const fadeOut = Math.min(1.6, durationSec * 0.3);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    let env = gainLevel;
    if (t < fadeIn) env *= t / fadeIn;
    if (durationSec - t < fadeOut) env *= Math.max(0, (durationSec - t) / fadeOut);

    let sumL = 0;
    let sumR = 0;
    for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
      const f = freqs[fIdx];
      const w1 = 2 * Math.PI * (f * 0.9975) * t;
      const w2 = 2 * Math.PI * (f * 1.0025) * t;
      const vL = Math.sin(w1) + 0.28 * Math.sin(w1 * 2) + 0.08 * Math.sin(w1 * 3);
      const vR = Math.sin(w2) + 0.28 * Math.sin(w2 * 2) + 0.08 * Math.sin(w2 * 3);
      sumL += vL;
      sumR += vR;
    }
    const norm = env / (freqs.length * 1.3);
    left[i] += sumL * norm;
    right[i] += sumR * norm;
  }
}

function addKeystroke(
  left: Float32Array,
  right: Float32Array,
  startSec: number,
  pitchOffset = 0,
) {
  const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const len = Math.floor(0.036 * SAMPLE_RATE);
  const endIdx = Math.min(left.length, startIdx + len);
  const freq = 180 + pitchOffset * 14;

  let seed = (Math.floor(startSec * 1000) + 17) >>> 0;
  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed / 4294967296) * 2 - 1;
    const click = noise * Math.exp(-t * 140) * 0.14;
    const thud = Math.sin(2 * Math.PI * (freq - t * 1800) * t) * Math.exp(-t * 110) * 0.09;
    const s = click + thud;
    left[i] += s;
    right[i] += s;
  }
}

function addSearchChime(left: Float32Array, right: Float32Array, startSec: number) {
  addKeystroke(left, right, startSec, -1);
  addFeltPiano(left, right, startSec + 0.03, 880, 0.85, 0.055, -0.05);
  addFeltPiano(left, right, startSec + 0.03, 1318.5, 0.85, 0.025, 0.05);
}

function addPaperTransition(
  left: Float32Array,
  right: Float32Array,
  startSec: number,
  durationSec = 0.42,
  level = 0.06,
) {
  const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const endIdx = Math.min(left.length, Math.floor((startSec + durationSec) * SAMPLE_RATE));
  let seed = 918273;
  let lp = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const normT = t / durationSec;
    const env = Math.sin(Math.PI * normT) * level;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 4294967296) * 2 - 1;
    lp = lp * 0.84 + white * 0.16;
    left[i] += lp * env;
    right[i] += lp * env * 0.96;
  }
}

function addLowImpact(
  left: Float32Array,
  right: Float32Array,
  startSec: number,
  pitch = 73.42,
  gain = 0.16,
) {
  const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const endIdx = Math.min(left.length, Math.floor((startSec + 1.8) * SAMPLE_RATE));
  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const attack = t < 0.02 ? t / 0.02 : 1;
    const env = attack * Math.exp(-t * 2.5) * gain;
    const f = pitch + pitch * 0.35 * Math.exp(-t * 18);
    const s = Math.sin(2 * Math.PI * f * t) * env;
    left[i] += s;
    right[i] += s;
  }
}

function applySimpleStereoReverb(left: Float32Array, right: Float32Array) {
  const delays = [1481, 2111, 2903, 3917];
  const gains = [0.22, 0.17, 0.13, 0.09];
  const wetL = new Float32Array(left.length);
  const wetR = new Float32Array(right.length);

  for (let d = 0; d < delays.length; d++) {
    const tap = delays[d];
    const g = gains[d];
    for (let i = tap; i < left.length; i++) {
      wetL[i] += right[i - tap] * g;
      wetR[i] += left[i - tap] * g;
    }
  }

  for (let i = 0; i < left.length; i++) {
    left[i] = Math.tanh((left[i] + wetL[i] * 0.55) * 0.9);
    right[i] = Math.tanh((right[i] + wetR[i] * 0.55) * 0.9);
  }
}

export function synthesizeFilmAudioWavBuffer(): Buffer {
  const numFrames = SAMPLE_RATE * FILM_DURATION;
  const left = new Float32Array(numFrames);
  const right = new Float32Array(numFrames);

  DIGIT_CUES.forEach((cue, i) => addKeystroke(left, right, cue, (i % 3) - 1));
  addSearchChime(left, right, 2.44);

  addPaperTransition(left, right, 3.52, 0.42, 0.05);
  addPaperTransition(left, right, 13.54, 0.45, 0.06);
  addPaperTransition(left, right, 24.02, 0.48, 0.06);

  addLowImpact(left, right, 14.55, 73.42, 0.16);
  addLowImpact(left, right, 20.44, 65.41, 0.18);
  addLowImpact(left, right, 24.02, 73.42, 0.17);
  addLowImpact(left, right, 29.65, 73.42, 0.15);

  // Felt Piano
  addFeltPiano(left, right, 0.15, 293.66, 2.8, 0.13, -0.14);
  addFeltPiano(left, right, 1.35, 440.0, 2.4, 0.10, 0.12);

  addFeltPiano(left, right, 3.65, 246.94, 3.4, 0.12, -0.12);
  addFeltPiano(left, right, 5.5, 369.99, 3.2, 0.11, 0.12);
  addFeltPiano(left, right, 7.6, 440.0, 3.2, 0.12, -0.06);
  addFeltPiano(left, right, 9.8, 329.63, 3.0, 0.11, 0.10);
  addFeltPiano(left, right, 11.8, 293.66, 2.8, 0.11, -0.1);

  addFeltPiano(left, right, 13.7, 246.94, 3.0, 0.13, -0.1);
  addFeltPiano(left, right, 14.6, 123.47, 3.4, 0.18, 0.0);
  addFeltPiano(left, right, 16.4, 329.63, 2.8, 0.11, 0.14);
  addFeltPiano(left, right, 18.2, 246.94, 2.6, 0.12, -0.12);

  addFeltPiano(left, right, 20.48, 123.47, 3.4, 0.19, 0.0);
  addFeltPiano(left, right, 21.25, 293.66, 2.8, 0.14, -0.12);
  addFeltPiano(left, right, 22.35, 349.23, 2.4, 0.12, 0.12);

  addFeltPiano(left, right, 24.08, 146.83, 4.8, 0.18, 0.0);
  addFeltPiano(left, right, 24.95, 293.66, 3.8, 0.13, -0.14);
  addFeltPiano(left, right, 26.1, 369.99, 3.6, 0.13, 0.12);
  addFeltPiano(left, right, 27.35, 440.0, 3.8, 0.14, -0.08);
  addFeltPiano(left, right, 28.55, 587.33, 3.6, 0.15, 0.14);
  addFeltPiano(left, right, 29.7, 146.83, 2.3, 0.16, 0.0);
  addFeltPiano(left, right, 29.74, 293.66, 2.25, 0.12, -0.14);
  addFeltPiano(left, right, 29.78, 369.99, 2.2, 0.12, 0.14);
  addFeltPiano(left, right, 29.82, 440.0, 2.15, 0.11, -0.06);

  // Ambient Strings
  addAmbientPad(targetLeft(left), targetRight(right), 0.2, [146.83, 220.0, 369.99], 3.2, 0.028);
  addAmbientPad(left, right, 3.6, [196.0, 293.66, 440.0], 9.4, 0.038);
  addAmbientPad(left, right, 13.5, [123.47, 185.0, 293.66], 10.2, 0.045);
  addAmbientPad(left, right, 23.9, [146.83, 220.0, 369.99, 440.0], 7.9, 0.056);

  applySimpleStereoReverb(left, right);

  const dataSize = numFrames * 4;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    wav.writeInt16LE(sL < 0 ? Math.round(sL * 0x8000) : Math.round(sL * 0x7fff), offset);
    wav.writeInt16LE(sR < 0 ? Math.round(sR * 0x8000) : Math.round(sR * 0x7fff), offset + 2);
    offset += 4;
  }

  return wav;
}

function targetLeft(buf: Float32Array): Float32Array {
  return buf;
}
function targetRight(buf: Float32Array): Float32Array {
  return buf;
}


import { Preset } from './types';

export const DEFAULT_PRESET: Preset = {
  seed: { value: 790 },
  cnv: {
    frame: 238,
    wrap: "MIRROR",
    scale: { x: 1, y: 1 }
  },
  refract: {
    type: "grid",
    level: { x: 0.25, y: 0.25 },
    grid: { x: 16, y: 16 }
  },
  displace: {
    type: "box",
    box: { amp: { x: 80, y: 20 }, freq: { x: 8.5, y: 20 }, speed: { x: 10, y: 10 } },
    flow: { octaves: 1, freq: 21.6, amp: { x: 20.7, y: 14.1 }, speed: { x: 23, y: 15 } },
    sine: { amp: { x: 30, y: 30 }, freq: { x: 25, y: 25 }, cycle: { x: 0, y: 1 } },
    whirl: { radius: 0.5, angle: 5.0, speed: 1.0 },
    pinch: { radius: 0.5, amount: 0.5, speed: 1.0 },
    glitch: { frequency: 10.0, amount: 0.05, split: 0.02 },
    voronoi: { scale: 5.0, jitter: 1.0, speed: 1.0 }
  },
  rec: {
    length: { value: 7 },
    highResScale: 2
  }
};

export const EXAMPLE_PRESETS: Record<string, Preset> = {
  "Cyber Prism": {
    ...DEFAULT_PRESET,
    refract: { type: "hex", level: { x: 0.3, y: 0.3 }, grid: { x: 12, y: 12 } },
    displace: { ...DEFAULT_PRESET.displace, type: "glitch", glitch: { frequency: 15, amount: 0.1, split: 0.05 } }
  },
  "Obsidian Flow": {
    ...DEFAULT_PRESET,
    refract: { type: "radial", level: { x: 0.2, y: 0.2 }, grid: { x: 8, y: 8 } },
    displace: { ...DEFAULT_PRESET.displace, type: "flow", flow: { octaves: 4, freq: 15, amp: { x: 40, y: 40 }, speed: { x: 5, y: 5 } } }
  },
  "Voronoi Glass": {
    ...DEFAULT_PRESET,
    refract: { type: "grid", level: { x: 0.1, y: 0.1 }, grid: { x: 24, y: 24 } },
    displace: { ...DEFAULT_PRESET.displace, type: "voronoi", voronoi: { scale: 12, jitter: 1, speed: 2 } }
  },
  "Black Hole": {
    ...DEFAULT_PRESET,
    refract: { type: "none", level: { x: 0, y: 0 }, grid: { x: 1, y: 1 } },
    displace: { ...DEFAULT_PRESET.displace, type: "whirl", whirl: { radius: 0.8, angle: 12.0, speed: 2.0 } }
  }
};

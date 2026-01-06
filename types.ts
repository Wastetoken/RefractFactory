
export type WrapMode = 'MIRROR' | 'REPEAT' | 'CLAMP' | 'TILE' | 'BORDER';
export type RefractType = 'none' | 'grid' | 'hex' | 'radial' | 'diamond';
export type DisplaceType = 'box' | 'flow' | 'sine' | 'whirl' | 'pinch' | 'glitch' | 'voronoi' | 'liquid';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Preset {
  seed: { value: number };
  cnv: {
    frame: number;
    wrap: WrapMode;
    scale: Vector2;
  };
  refract: {
    type: RefractType;
    level: Vector2;
    grid: Vector2;
  };
  displace: {
    type: DisplaceType;
    box: { amp: Vector2; freq: Vector2; speed: Vector2 };
    flow: { octaves: number; freq: number; amp: Vector2; speed: Vector2 };
    sine: { amp: Vector2; freq: Vector2; cycle: Vector2 };
    whirl: { radius: number; angle: number; speed: number };
    pinch: { radius: number; amount: number; speed: number };
    glitch: { frequency: number; amount: number; split: number };
    voronoi: { scale: number; jitter: number; speed: number };
  };
  rec: {
    length: { value: number };
    highResScale: number;
  };
}

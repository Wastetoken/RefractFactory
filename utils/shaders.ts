
export const VERTEX_SHADER = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uSeed;

// Refraction
uniform int uRefractType; // 0: none, 1: grid, 2: hex, 3: radial, 4: diamond
uniform vec2 uRefractLevel;
uniform vec2 uRefractGrid;

// Displacement
uniform int uDisplaceType; // 0: box, 1: flow, 2: sine, 3: whirl, 4: pinch, 5: glitch, 6: voronoi, 7: liquid
uniform vec2 uBoxAmp; uniform vec2 uBoxFreq; uniform vec2 uBoxSpeed;
uniform int uFlowOctaves; uniform float uFlowFreq; uniform vec2 uFlowAmp; uniform vec2 uFlowSpeed;
uniform vec2 uSineAmp; uniform vec2 uSineFreq; uniform vec2 uSineCycle;
uniform float uWhirlRadius; uniform float uWhirlAngle; uniform float uWhirlSpeed;
uniform float uPinchRadius; uniform float uPinchAmount; uniform float uPinchSpeed;
uniform float uGlitchFreq; uniform float uGlitchAmount; uniform float uGlitchSplit;
uniform float uVoronoiScale; uniform float uVoronoiJitter; uniform float uVoronoiSpeed;

// --- UTILS ---
float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = rand(i);
	float b = rand(i + vec2(1.0, 0.0));
	float c = rand(i + vec2(0.0, 1.0));
	float d = rand(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
	float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
	for (int i = 0; i < 8; i++) {
    if(i >= octaves) break;
		v += a * noise(p);
		p = p * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

// Hex tiling math
vec4 hexCoords(vec2 uv) {
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = length(a) < length(b) ? a : b;
  vec2 id = uv - gv;
  return vec4(gv.x, gv.y, id.x, id.y);
}

// Voronoi
vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float minDist = 1.0;
  vec2 mCell;
  for(int j=-1; j<=1; j++) {
    for(int i=-1; i<=1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 point = neighbor + rand(n + neighbor + uSeed);
      point = 0.5 + 0.5 * sin(uTime * uVoronoiSpeed + 6.2831 * point);
      float d = length(neighbor + point - f);
      if(d < minDist) {
        minDist = d;
        mCell = point;
      }
    }
  }
  return mCell;
}

void main() {
  vec2 uv = vTexCoord;
  
  // 1. Refraction Step
  if (uRefractType == 1) { // Grid
    vec2 gridUV = floor(uv * uRefractGrid) / uRefractGrid;
    uv = uv + (uv - (gridUV + 0.5/uRefractGrid)) * uRefractLevel;
  } else if (uRefractType == 2) { // Hex
    vec4 hex = hexCoords(uv * uRefractGrid);
    uv = uv + hex.xy * uRefractLevel;
  } else if (uRefractType == 3) { // Radial
    vec2 rel = uv - 0.5;
    float r = length(rel);
    float a = atan(rel.y, rel.x);
    r = mod(r * uRefractGrid.x, 1.0);
    uv = uv + rel * r * uRefractLevel.x;
  } else if (uRefractType == 4) { // Diamond
    vec2 d = abs(uv - 0.5);
    float dist = d.x + d.y;
    uv = uv + (uv - 0.5) * fract(dist * uRefractGrid.x) * uRefractLevel.x;
  }

  // 2. Displacement Step
  vec2 displacement = vec2(0.0);
  
  if (uDisplaceType == 0) { // Box
    vec2 boxUV = uv * uBoxFreq + (uTime * uBoxSpeed * 0.1);
    displacement.x = sin(floor(boxUV.x)) * uBoxAmp.x * 0.001;
    displacement.y = cos(floor(boxUV.y)) * uBoxAmp.y * 0.001;
  } 
  else if (uDisplaceType == 1) { // Flow
    float n1 = fbm(uv * uFlowFreq + (uTime * uFlowSpeed * 0.01), uFlowOctaves);
    float n2 = fbm(uv * uFlowFreq + (uTime * uFlowSpeed * 0.01) + vec2(1.5), uFlowOctaves);
    displacement = (vec2(n1, n2) - 0.5) * uFlowAmp * 0.01;
  }
  else if (uDisplaceType == 2) { // Sine
    displacement.x = sin(uv.y * uSineFreq.x + uTime * uSineCycle.x) * uSineAmp.x * 0.001;
    displacement.y = cos(uv.x * uSineFreq.y + uTime * uSineCycle.y) * uSineAmp.y * 0.001;
  }
  else if (uDisplaceType == 3) { // Whirl
    vec2 rel = uv - 0.5;
    float dist = length(rel);
    if (dist < uWhirlRadius) {
      float percent = (uWhirlRadius - dist) / uWhirlRadius;
      float theta = percent * percent * uWhirlAngle * 8.0 * sin(uTime * uWhirlSpeed);
      float s = sin(theta); float c = cos(theta);
      displacement = vec2(dot(rel, vec2(c, -s)), dot(rel, vec2(s, c))) - rel;
    }
  }
  else if (uDisplaceType == 4) { // Pinch
    vec2 rel = uv - 0.5;
    float dist = length(rel);
    if (dist < uPinchRadius) {
      float percent = (uPinchRadius - dist) / uPinchRadius;
      float amount = percent * uPinchAmount * sin(uTime * uPinchSpeed);
      displacement = rel * amount;
    }
  }
  else if (uDisplaceType == 5) { // Glitch
    float g = noise(vec2(uTime * uGlitchFreq, floor(uv.y * 50.0)));
    if (g > 0.8) {
      displacement.x = (rand(vec2(uTime)) - 0.5) * uGlitchAmount;
    }
  }
  else if (uDisplaceType == 6) { // Voronoi
    vec2 v = voronoi(uv * uVoronoiScale);
    displacement = (v - 0.5) * 0.1;
  }

  // Sample with custom wrap logic can be done here or in p5 using fract/mod
  vec2 finalUv = fract(uv + displacement);
  
  // Apply RGB split if glitch split > 0
  if (uDisplaceType == 5 && uGlitchSplit > 0.0) {
    float r = texture2D(uTexture, fract(finalUv + vec2(uGlitchSplit, 0.0))).r;
    float g = texture2D(uTexture, finalUv).g;
    float b = texture2D(uTexture, fract(finalUv - vec2(uGlitchSplit, 0.0))).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  } else {
    gl_FragColor = texture2D(uTexture, finalUv);
  }
}
`;

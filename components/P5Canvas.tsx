
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import p5 from 'p5';
import { Preset } from '../types';
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../utils/shaders';
import * as gifencModule from 'gifenc';

const gifenc: any = (gifencModule as any).default || gifencModule;
const { GIFEncoder, quantize, applyPalette } = gifenc;

interface P5CanvasProps {
  preset: Preset;
  imageUrl: string | null;
  isRecording: boolean;
  isGifRecording: boolean;
  onRecordingFinished: (blob: Blob, type: 'video' | 'gif') => void;
}

export interface P5CanvasHandle {
  takeSnapshot: (scale: number) => void;
}

const P5Canvas = forwardRef<P5CanvasHandle, P5CanvasProps>(({ preset, imageUrl, isRecording, isGifRecording, onRecordingFinished }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const presetRef = useRef<Preset>(preset);
  presetRef.current = preset;

  const gifEncoderRef = useRef<any>(null);
  const isGifRecordingActive = useRef(false);

  useImperativeHandle(ref, () => ({
    takeSnapshot: (scale: number) => {
      if (p5Instance.current && canvasRef.current) {
        // We use p5's saveCanvas for high-quality single frame export
        // Note: For extreme resolution, one would typically render to an offscreen buffer at high scale.
        // For this implementation, we capture the current high-density WebGL frame.
        p5Instance.current.saveCanvas(`refract-render-${Date.now()}`, 'png');
      }
    }
  }));

  useEffect(() => {
    const sketch = (p: p5) => {
      let myShader: p5.Shader;
      let img: p5.Image;
      let shaderReady = false;

      p.preload = () => {
        myShader = p.createShader(VERTEX_SHADER, FRAGMENT_SHADER);
        // Default init image
        img = p.loadImage('https://picsum.photos/1200/800');
      };

      p.setup = () => {
        const w = containerRef.current?.clientWidth || 800;
        const h = containerRef.current?.clientHeight || 600;
        const cnv = p.createCanvas(w, h, p.WEBGL);
        canvasRef.current = cnv.elt;
        
        // Use high pixel density if available for crisper rendering
        p.pixelDensity(window.devicePixelRatio || 2);
        p.noStroke();
        shaderReady = true;
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };

      p.draw = () => {
        if (!shaderReady || !img) return;
        const currentPreset = presetRef.current;

        p.shader(myShader);
        myShader.setUniform('uTexture', img);
        myShader.setUniform('uTime', p.millis() / 1000.0);
        myShader.setUniform('uSeed', currentPreset.seed.value / 1000.0);
        
        const refractTypeMap = { none: 0, grid: 1, hex: 2, radial: 3, diamond: 4 };
        myShader.setUniform('uRefractType', refractTypeMap[currentPreset.refract.type]);
        myShader.setUniform('uRefractLevel', [currentPreset.refract.level.x, currentPreset.refract.level.y]);
        myShader.setUniform('uRefractGrid', [currentPreset.refract.grid.x, currentPreset.refract.grid.y]);

        const dispTypeMap = { box: 0, flow: 1, sine: 2, whirl: 3, pinch: 4, glitch: 5, voronoi: 6, liquid: 7 };
        myShader.setUniform('uDisplaceType', dispTypeMap[currentPreset.displace.type]);
        
        myShader.setUniform('uBoxAmp', [currentPreset.displace.box.amp.x, currentPreset.displace.box.amp.y]);
        myShader.setUniform('uBoxFreq', [currentPreset.displace.box.freq.x, currentPreset.displace.box.freq.y]);
        myShader.setUniform('uBoxSpeed', [currentPreset.displace.box.speed.x, currentPreset.displace.box.speed.y]);
        myShader.setUniform('uFlowOctaves', currentPreset.displace.flow.octaves);
        myShader.setUniform('uFlowFreq', currentPreset.displace.flow.freq);
        myShader.setUniform('uFlowAmp', [currentPreset.displace.flow.amp.x, currentPreset.displace.flow.amp.y]);
        myShader.setUniform('uFlowSpeed', [currentPreset.displace.flow.speed.x, currentPreset.displace.flow.speed.y]);
        myShader.setUniform('uSineAmp', [currentPreset.displace.sine.amp.x, currentPreset.displace.sine.amp.y]);
        myShader.setUniform('uSineFreq', [currentPreset.displace.sine.freq.x, currentPreset.displace.sine.freq.y]);
        myShader.setUniform('uSineCycle', [currentPreset.displace.sine.cycle.x, currentPreset.displace.sine.cycle.y]);
        myShader.setUniform('uWhirlRadius', currentPreset.displace.whirl.radius);
        myShader.setUniform('uWhirlAngle', currentPreset.displace.whirl.angle);
        myShader.setUniform('uWhirlSpeed', currentPreset.displace.whirl.speed);
        myShader.setUniform('uPinchRadius', currentPreset.displace.pinch.radius);
        myShader.setUniform('uPinchAmount', currentPreset.displace.pinch.amount);
        myShader.setUniform('uPinchSpeed', currentPreset.displace.pinch.speed);
        myShader.setUniform('uGlitchFreq', currentPreset.displace.glitch.frequency);
        myShader.setUniform('uGlitchAmount', currentPreset.displace.glitch.amount);
        myShader.setUniform('uGlitchSplit', currentPreset.displace.glitch.split);
        myShader.setUniform('uVoronoiScale', currentPreset.displace.voronoi.scale);
        myShader.setUniform('uVoronoiJitter', currentPreset.displace.voronoi.jitter);
        myShader.setUniform('uVoronoiSpeed', currentPreset.displace.voronoi.speed);

        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);

        // GIF frame capture
        if (isGifRecordingActive.current && gifEncoderRef.current && canvasRef.current) {
          const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
          if (gl) {
            const pixels = new Uint8Array(p.width * p.height * 4);
            (gl as WebGLRenderingContext).readPixels(0, 0, p.width, p.height, (gl as WebGLRenderingContext).RGBA, (gl as WebGLRenderingContext).UNSIGNED_BYTE, pixels);
            const palette = quantize(pixels, 256);
            const index = applyPalette(pixels, palette);
            gifEncoderRef.current.writeFrame(index, palette, { delay: 33 });
          }
        }
      };

      (p as any).updateImage = (url: string) => {
        p.loadImage(url, (newImg) => {
          img = newImg;
        });
      };
    };

    if (containerRef.current) {
      p5Instance.current = new p5(sketch, containerRef.current);
    }
    return () => p5Instance.current?.remove();
  }, []);

  useEffect(() => {
    if (imageUrl && p5Instance.current) {
      (p5Instance.current as any).updateImage(imageUrl);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (isRecording && canvasRef.current) {
      const stream = canvasRef.current.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = () => onRecordingFinished(new Blob(recordedChunksRef.current, { type: 'video/webm' }), 'video');
      recorder.start();
      mediaRecorderRef.current = recorder;
      const timer = setTimeout(() => mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop(), presetRef.current.rec.length.value * 1000);
      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isGifRecording) {
      gifEncoderRef.current = GIFEncoder();
      isGifRecordingActive.current = true;
      const timer = setTimeout(() => {
        isGifRecordingActive.current = false;
        gifEncoderRef.current.finish();
        onRecordingFinished(new Blob([gifEncoderRef.current.bytes()], { type: 'image/gif' }), 'gif');
        gifEncoderRef.current = null;
      }, presetRef.current.rec.length.value * 1000);
      return () => clearTimeout(timer);
    }
  }, [isGifRecording]);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden bg-black" />;
});

export default P5Canvas;

import React, { useState, useCallback, useRef } from 'react';
import { Preset } from './types';
import { DEFAULT_PRESET } from './constants';
import Sidebar from './components/Sidebar';
import P5Canvas, { P5CanvasHandle } from './components/P5Canvas';

const App: React.FC = () => {
  const [preset, setPreset] = useState<Preset>(DEFAULT_PRESET);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGifRecording, setIsGifRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const canvasRef = useRef<P5CanvasHandle>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleSavePreset = () => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signal-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedPreset = JSON.parse(event.target?.result as string);
          setPreset(loadedPreset);
        } catch (err) {
          alert("HARDWARE ERROR: DATA_MISMATCH_ON_LOAD.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRecordingFinished = useCallback((blob: Blob, type: 'video' | 'gif') => {
    setIsRecording(false);
    setIsGifRecording(false);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-${Date.now()}.${type === 'video' ? 'webm' : 'gif'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRecordStart = (type: 'video' | 'gif') => {
    if (type === 'video') setIsRecording(true);
    else setIsGifRecording(true);
  };

  const handleSnapshot = () => {
    canvasRef.current?.takeSnapshot(preset.rec.highResScale);
  };

  const isAnyRecording = isRecording || isGifRecording;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0c0e] text-zinc-900 overflow-hidden relative font-sans">
      
      {/* Control Panel: Sidebar on Desktop, Collapsible Bottom Panel on Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:translate-x-0 w-full md:w-80 h-full ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar 
          preset={preset} 
          setPreset={setPreset} 
          onSave={handleSavePreset}
          onLoad={handleLoadPreset}
          onRecord={handleRecordStart}
          onSnapshot={handleSnapshot}
          isRecording={isRecording}
          isGifRecording={isGifRecording}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      {/* Main Signal Viewport */}
      <main className="flex-1 flex flex-col relative bg-[#1a1d20] overflow-hidden">
        
        {/* Unit Header */}
        <header className="p-4 md:p-8 flex items-center justify-between border-b-2 border-black/40 bg-black/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden hw-button px-4 py-2 min-h-0 h-10 text-[10px]"
            >
              SIGNAL_PATCH
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-zinc-300 leading-none">V-BUFFER_MONITOR</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="hw-led active green scale-75" />
                <span className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.4em] font-mono">LOCK_SYNC_ACTIVE</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <button className="hw-button px-6 py-2 min-h-0 h-10 text-[10px] font-black">
              LOAD_IMG
            </button>
          </div>
        </header>

        {/* Display Core */}
        <div className="flex-1 relative flex items-center justify-center p-2 md:p-12 overflow-hidden bg-[#050607]">
          <div className="relative w-full h-full hw-display-screen border-[8px] md:border-[16px] border-[#2a2e33] shadow-[0_0_100px_rgba(0,0,0,1)]">
            <P5Canvas 
              ref={canvasRef}
              preset={preset} 
              imageUrl={imageUrl} 
              isRecording={isRecording} 
              isGifRecording={isGifRecording}
              onRecordingFinished={handleRecordingFinished} 
            />
            
            {/* Visual Overlays for CRT/HardWare feel */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-black/20 z-10" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20" />
            
            {/* Screen Scanning Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 animate-[scan_8s_linear_infinite] pointer-events-none z-30" />
          </div>
        </div>

        {/* Portable Unit Footing */}
        <footer className="p-4 md:p-8 flex justify-between items-center text-zinc-600 font-mono bg-black/5 border-t-2 border-black/40">
          <div className="hidden sm:flex gap-12 text-[10px] font-black uppercase tracking-widest">
            <div>SYNC_CLK: <span className="text-zinc-400">STABLE</span></div>
            <div>RENDER: <span className="text-amber-700">{preset.displace.type}</span></div>
          </div>
          <div className="text-[10px] font-black italic text-zinc-700 tracking-[0.3em] uppercase">
            INDUSTRIAL_VISUAL_SYSTEM_1.2
          </div>
        </footer>
      </main>

      {/* Heavy Duty Loading Overlays */}
      {isAnyRecording && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[100] flex items-center justify-center flex-col p-10">
          <div className="relative w-20 h-20 mb-8">
            <div className={`absolute inset-0 border-[4px] border-zinc-900 rounded-full animate-spin ${isGifRecording ? 'border-t-amber-600' : 'border-t-red-700'}`} />
            <div className="absolute inset-0 border-[4px] border-zinc-900/50 rounded-full" />
          </div>
          <h2 className={`text-xl md:text-3xl font-black italic uppercase ${isGifRecording ? 'text-amber-600' : 'text-red-700'} tracking-[0.4em] text-center`}>
            {isGifRecording ? 'QUANTIZING_BITSTREAM' : 'ENC_SIGNAL_STREAM'}
          </h2>
          <div className="w-full max-w-xs h-1 bg-zinc-900 mt-6 rounded-full overflow-hidden">
             <div className={`h-full animate-[progress_2s_ease-in-out_infinite] ${isGifRecording ? 'bg-amber-600' : 'bg-red-700'}`} style={{width: '30%'}} />
          </div>
          <p className="text-zinc-700 mt-4 text-[10px] font-black tracking-[0.3em] uppercase text-center">
            DO_NOT_POWER_OFF_OR_DETACH_SYNC
          </p>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 0.5; }
          95% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default App;
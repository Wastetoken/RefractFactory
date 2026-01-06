import React, { useState } from 'react';
import { Preset, DisplaceType, RefractType } from '../types';
import { EXAMPLE_PRESETS } from '../constants';

interface SidebarProps {
  preset: Preset;
  setPreset: React.Dispatch<React.SetStateAction<Preset>>;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecord: (type: 'video' | 'gif') => void;
  onSnapshot: () => void;
  isRecording: boolean;
  isGifRecording: boolean;
  onClose?: () => void;
}

type Tab = 'INPUT' | 'OPTICS' | 'LOGIC' | 'OUT';

const Fader: React.FC<{ 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  onChange: (val: number) => void 
}> = ({ label, value, min, max, step, onChange }) => (
  <div className="flex flex-col gap-2 bg-black/5 p-3 rounded border border-black/5">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-zinc-900 font-black uppercase tracking-[0.2em]">{label}</span>
      <span className="text-[12px] text-green-900 font-mono bg-black/10 px-2 py-0.5 rounded border border-black/10 font-bold">
        {value.toFixed(2)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="hw-slider"
    />
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  preset, 
  setPreset, 
  onSave, 
  onLoad, 
  onRecord, 
  onSnapshot,
  isRecording, 
  isGifRecording, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('OPTICS');

  const updatePreset = (path: string, value: any) => {
    setPreset(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const isAnyRecording = isRecording || isGifRecording;

  return (
    <div className="flex flex-col h-full hw-rack-panel border-t-8 md:border-t-0 md:border-r-[12px] border-[#2a2e33]">
      {/* Decorative Screws */}
      <div className="hidden md:block absolute top-4 left-4 hw-rack-screw" />
      <div className="hidden md:block absolute top-4 right-4 hw-rack-screw" />
      
      {/* Mobile-First Header */}
      <div className="p-4 border-b-2 border-black/20 bg-black/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none">SIGNAL_REFRACTOR</h1>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">PRO_HW_UNIT_V1.2</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="hw-button p-2 min-h-0 h-10 w-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b-2 border-black/30 bg-[#2a2e33]">
        {(['INPUT', 'OPTICS', 'LOGIC', 'OUT'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-4 text-[10px] font-black tracking-widest transition-all ${activeTab === t ? 'bg-[#b8c2cc] text-zinc-900 shadow-inner' : 'bg-[#2a2e33] text-zinc-500 hover:text-zinc-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pb-24">
        {activeTab === 'INPUT' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">Load Factory Bank</label>
              <select 
                className="bg-zinc-800 border-2 border-black/40 rounded px-4 py-3 text-[12px] font-bold text-zinc-100 outline-none w-full"
                onChange={(e) => e.target.value && setPreset(EXAMPLE_PRESETS[e.target.value])}
              >
                <option value="">USER_BUFFER_INIT</option>
                {Object.keys(EXAMPLE_PRESETS).map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
              </select>
            </div>
            <Fader label="Noise Seed" value={preset.seed.value} min={0} max={1000} step={1} onChange={(v) => updatePreset('seed.value', v)} />
          </div>
        )}

        {activeTab === 'OPTICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {['none', 'grid', 'hex', 'radial', 'diamond'].map(m => (
                <button
                  key={m}
                  onClick={() => updatePreset('refract.type', m)}
                  className={`hw-button gap-2 justify-start ${preset.refract.type === m ? 'active' : ''}`}
                >
                  <div className={`hw-led ${preset.refract.type === m ? 'active green' : ''}`} />
                  {m}
                </button>
              ))}
            </div>
            <Fader label="Refract X" value={preset.refract.level.x} min={0} max={5} step={0.01} onChange={(v) => updatePreset('refract.level.x', v)} />
            <Fader label="Refract Y" value={preset.refract.level.y} min={0} max={5} step={0.01} onChange={(v) => updatePreset('refract.level.y', v)} />
            <Fader label="Grid X" value={preset.refract.grid.x} min={1} max={100} step={1} onChange={(v) => updatePreset('refract.grid.x', v)} />
            <Fader label="Grid Y" value={preset.refract.grid.y} min={1} max={100} step={1} onChange={(v) => updatePreset('refract.grid.y', v)} />
          </div>
        )}

        {activeTab === 'LOGIC' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {['box', 'flow', 'sine', 'whirl', 'pinch', 'glitch', 'voronoi'].map(m => (
                <button
                  key={m}
                  onClick={() => updatePreset('displace.type', m)}
                  className={`hw-button gap-2 justify-start ${preset.displace.type === m ? 'active' : ''}`}
                >
                  <div className={`hw-led ${preset.displace.type === m ? 'active amber' : ''}`} />
                  {m}
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-6 border-t border-black/10">
              {preset.displace.type === 'box' && (
                <>
                  <Fader label="GAIN_AMP" value={preset.displace.box.amp.x} min={0} max={200} step={1} onChange={(v) => updatePreset('displace.box.amp.x', v)} />
                  <Fader label="FREQ_MOD" value={preset.displace.box.freq.x} min={0} max={100} step={0.1} onChange={(v) => updatePreset('displace.box.freq.x', v)} />
                  <Fader label="SYNC_SPD" value={preset.displace.box.speed.x} min={0} max={100} step={1} onChange={(v) => updatePreset('displace.box.speed.x', v)} />
                </>
              )}
              {preset.displace.type === 'flow' && (
                <>
                  <Fader label="FLOW_FRQ" value={preset.displace.flow.freq} min={0} max={100} step={0.1} onChange={(v) => updatePreset('displace.flow.freq', v)} />
                  <Fader label="OCTAVES" value={preset.displace.flow.octaves} min={1} max={8} step={1} onChange={(v) => updatePreset('displace.flow.octaves', v)} />
                  <Fader label="FLOW_AMP" value={preset.displace.flow.amp.x} min={0} max={100} step={0.1} onChange={(v) => updatePreset('displace.flow.amp.x', v)} />
                </>
              )}
              {preset.displace.type === 'glitch' && (
                <>
                  <Fader label="BIT_CLK" value={preset.displace.glitch.frequency} min={0} max={60} step={1} onChange={(v) => updatePreset('displace.glitch.frequency', v)} />
                  <Fader label="DATA_LOSS" value={preset.displace.glitch.amount} min={0} max={0.5} step={0.001} onChange={(v) => updatePreset('displace.glitch.amount', v)} />
                  <Fader label="RGB_PHASE" value={preset.displace.glitch.split} min={0} max={0.2} step={0.001} onChange={(v) => updatePreset('displace.glitch.split', v)} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'OUT' && (
          <div className="space-y-6">
            <button onClick={onSnapshot} className="hw-button w-full py-6 text-sm font-black tracking-[0.2em] shadow-xl">
              CAPTURE_HI_RES_PNG
            </button>
            
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => onRecord('video')} disabled={isAnyRecording} className="hw-button gap-4 justify-start px-6">
                <div className={`hw-led ${isRecording ? 'active red' : ''}`} />
                RECORD_SIGNAL_WEBM
              </button>
              <button onClick={() => onRecord('gif')} disabled={isAnyRecording} className="hw-button gap-4 justify-start px-6">
                <div className={`hw-led ${isGifRecording ? 'active amber' : ''}`} />
                ENCODE_SIGNAL_GIF
              </button>
            </div>

            <div className="flex gap-2 pt-4 border-t border-black/10">
              <button onClick={onSave} className="hw-button flex-1 py-3 text-[10px]">EXPORT_CFG</button>
              <div className="relative flex-1">
                <input type="file" onChange={onLoad} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <button className="hw-button w-full py-3 text-[10px]">IMPORT_CFG</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Screws Bottom */}
      <div className="hidden md:block absolute bottom-4 left-4 hw-rack-screw" />
      <div className="hidden md:block absolute bottom-4 right-4 hw-rack-screw" />
      
      {/* Mobile persistent indicator */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-1 bg-black/20" />
    </div>
  );
};

export default Sidebar;
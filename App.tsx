import React, { useState, useEffect, useRef, useCallback } from 'react';
import Wheel from './components/Wheel';
import AdminPanel from './components/AdminPanel';
import ZoomView from './components/ZoomView';
import WinnerHistory, { WinnerRecord } from './components/WinnerHistory';
import { Participant, WheelState } from './types';
import { Menu, Play, RefreshCw, Volume2, VolumeX, History, X } from 'lucide-react';
import * as d3 from 'd3';
import { NAME_LIST } from './names';

// Predefined palette for nice visuals
const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#f43f5e', // rose-500
];

// Utility for shuffling
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Initial Participant Generation
const INITIAL_PARTICIPANTS = fisherYatesShuffle([...NAME_LIST]).map((name, index) => ({
  id: crypto.randomUUID(),
  name,
  color: COLORS[index % COLORS.length]
}));

function App() {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const participantsRef = useRef<Participant[]>(participants);
  
  const [winners, setWinners] = useState<WinnerRecord[]>([]);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [spinDuration, setSpinDuration] = useState(8); // Seconds
  
  // Animation State
  const [wheelState, setWheelState] = useState<WheelState>({
    rotation: 0,
    velocity: 0,
    isSpinning: false,
    winner: null,
  });

  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);
  
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  
  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTick = useCallback(() => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.02);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [soundEnabled]);

  const playWin = useCallback(() => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        const now = ctx.currentTime + (i * 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        
        osc.start(now);
        osc.stop(now + 1);
    });
  }, [soundEnabled]);

  const getCurrentParticipant = useCallback((currentRotation: number, items: Participant[]) => {
    if (items.length === 0) return null;
    const degreesPerSlice = 360 / items.length;
    const normalizedRotation = (currentRotation % 360 + 360) % 360;
    const activeAngle = (360 - normalizedRotation) % 360;
    const index = Math.floor(activeAngle / degreesPerSlice);
    return { participant: items[index] || items[0], index };
  }, []);

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    const duration = spinDuration;
    const currentList = participantsRef.current;

    if (elapsed < duration) {
      const t = elapsed / duration;
      const ease = d3.easeExpOut(t);
      const currentRotation = d3.interpolate(startRotationRef.current, targetRotationRef.current)(ease);
      
      const current = getCurrentParticipant(currentRotation, currentList);
      if (current && current.index !== lastTickIndexRef.current) {
         playTick();
         lastTickIndexRef.current = current.index;
      }

      setWheelState(prev => ({
        ...prev,
        rotation: currentRotation,
        isSpinning: true
      }));
      
      requestRef.current = requestAnimationFrame(animate);
    } else {
      const finalRotation = targetRotationRef.current;
      const result = getCurrentParticipant(finalRotation, currentList);
      const winner = result?.participant || null;
      
      if (winner) {
        setWinners(prev => [{ ...winner, timestamp: new Date() }, ...prev]);
      }

      setWheelState({
        rotation: finalRotation % 360,
        velocity: 0,
        isSpinning: false,
        winner: winner
      });
      playWin();
    }
  }, [spinDuration, getCurrentParticipant, playTick, playWin]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
     if (!wheelState.isSpinning && !wheelState.winner) {
         const current = getCurrentParticipant(wheelState.rotation, participants);
         setActiveParticipant(current?.participant || null);
     } else if (wheelState.isSpinning) {
        const current = getCurrentParticipant(wheelState.rotation, participants);
        setActiveParticipant(current?.participant || null);
     }
  }, [wheelState.rotation, participants, getCurrentParticipant, wheelState.isSpinning, wheelState.winner]);

  const handleSpin = () => {
    let currentList = [...participants];

    if (wheelState.winner) {
      currentList = currentList.filter(p => p.id !== wheelState.winner?.id);
      setParticipants(currentList);
      participantsRef.current = currentList;
    }

    if (currentList.length < 2) {
      setWheelState(prev => ({ ...prev, winner: null, isSpinning: false }));
      return; 
    }
    
    initAudio();
    
    setWheelState(prev => ({ ...prev, isSpinning: true, winner: null }));
    
    startTimeRef.current = 0;
    startRotationRef.current = wheelState.rotation;
    
    const minSpins = 5 + Math.floor(spinDuration * 2);
    const randomOffset = Math.random() * 360;
    const totalRotation = startRotationRef.current + (360 * minSpins) + randomOffset;
    
    targetRotationRef.current = totalRotation;
    
    requestRef.current = requestAnimationFrame(animate);
  };

  const addParticipant = (name: string) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      color: COLORS[participants.length % COLORS.length]
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleBulkAdd = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    
    const newParticipants = lines.map(name => ({
      id: crypto.randomUUID(),
      name,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
    
    const shuffledBatch = fisherYatesShuffle(newParticipants);
    setParticipants(prev => [...prev, ...shuffledBatch]);
  };

  const handleShuffle = () => {
     setParticipants(prev => fisherYatesShuffle(prev));
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const resetParticipants = () => {
    setParticipants([]);
    setWheelState(prev => ({ ...prev, winner: null, rotation: 0 }));
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden font-sans">
      {/* Mobile Header Buttons */}
      <div className="lg:hidden absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
         <button 
           onClick={() => setShowAdmin(true)} 
           className="pointer-events-auto p-2 bg-slate-800 rounded-lg shadow-lg text-white border border-slate-700"
         >
           <Menu size={24} />
         </button>
         <button 
           onClick={() => setShowHistory(true)} 
           className="pointer-events-auto p-2 bg-slate-800 rounded-lg shadow-lg text-white border border-slate-700"
         >
           <History size={24} />
         </button>
      </div>

      {/* Admin Panel (Left) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-80 xl:w-96
        ${showAdmin ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col relative">
            <button 
              onClick={() => setShowAdmin(false)} 
              className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-50"
            >
              <X size={24} />
            </button>
            <AdminPanel 
              participants={participants}
              onAddParticipant={addParticipant}
              onBulkAdd={handleBulkAdd}
              onRemoveParticipant={removeParticipant}
              onReset={resetParticipants}
              onShuffle={handleShuffle}
              isSpinning={wheelState.isSpinning}
              spinDuration={spinDuration}
              onDurationChange={setSpinDuration}
            />
        </div>
      </div>

      {/* Main Content Area (Center) */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Area: Zoom/Winner Display */}
        <div className="h-1/4 min-h-[180px] p-6 flex flex-col items-center justify-center relative z-10">
           <ZoomView 
             currentParticipant={activeParticipant} 
             isSpinning={wheelState.isSpinning}
             winner={wheelState.winner}
           />
        </div>

        {/* Center: The Wheel */}
        <div className="flex-1 flex items-center justify-center relative p-4 lg:-mt-10">
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full scale-110 pointer-events-none"></div>
             
             {participants.length > 0 ? (
                <Wheel 
                  participants={participants} 
                  rotation={wheelState.rotation} 
                  size={Math.min(window.innerHeight * 0.5, window.innerWidth * 0.9, 600)}
                />
             ) : (
               <div className="text-slate-500 font-medium text-lg">Add participants to start</div>
             )}
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="h-24 bg-slate-800/50 backdrop-blur-md border-t border-slate-700 flex items-center justify-center gap-6 z-20">
           <button
             onClick={() => {
                setSoundEnabled(!soundEnabled);
                initAudio();
             }}
             className={`p-3 rounded-full transition-all ${soundEnabled ? 'bg-slate-700 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}
             title={soundEnabled ? "Sound On" : "Sound Off"}
           >
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>

           <button
             onClick={handleSpin}
             disabled={wheelState.isSpinning || participants.length < 2}
             className={`
               group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform
               ${wheelState.isSpinning || participants.length < 2
                 ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                 : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/25'}
             `}
           >
             <span className={`${wheelState.isSpinning ? 'animate-spin' : ''}`}>
               {wheelState.isSpinning ? <RefreshCw size={24} /> : <Play size={24} fill="currentColor" />}
             </span>
             {wheelState.isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
           </button>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Winner History (Right) */}
      <div className={`
        fixed inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-72 xl:w-80
        ${showHistory ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
          <WinnerHistory 
            winners={winners} 
            onClear={() => setWinners([])}
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
          />
      </div>
    </div>
  );
}

export default App;
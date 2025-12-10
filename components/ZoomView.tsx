import React from 'react';
import { Participant } from '../types';
import { Crosshair } from 'lucide-react';

interface ZoomViewProps {
  currentParticipant: Participant | null;
  isSpinning: boolean;
  winner: Participant | null;
}

const ZoomView: React.FC<ZoomViewProps> = ({ currentParticipant, isSpinning, winner }) => {
  // Determine what to show.
  // If we have a winner and stopped spinning, show winner heavily.
  // If spinning, show current passing.
  // If idle and no winner yet, show "Ready to Spin".
  
  const displayParticipant = winner || currentParticipant;
  
  if (!displayParticipant && !isSpinning) {
    return (
      <div className="w-full max-w-sm mx-auto bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center shadow-lg relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
         <Crosshair className="mx-auto text-slate-600 mb-2 opacity-50" size={32} />
         <h3 className="text-xl font-bold text-slate-400">Ready</h3>
         <p className="text-slate-500 text-sm">Waiting for spin...</p>
      </div>
    );
  }

  // Visual state
  const isWinnerState = !!winner && !isSpinning;

  return (
    <div className={`
      relative w-full max-w-sm mx-auto rounded-2xl border-4 p-6 text-center shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-center min-h-[160px]
      ${isWinnerState 
        ? 'bg-yellow-500/10 border-yellow-400 scale-105' 
        : 'bg-slate-800 border-indigo-500'}
    `}>
      {/* Background decoration */}
      <div 
        className="absolute inset-0 opacity-20 transition-colors duration-200"
        style={{ backgroundColor: displayParticipant?.color }}
      />
      
      {/* Target Reticle UI Overlay */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/30" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/30" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/30" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/30" />

      <div className="relative z-10 flex flex-col h-full justify-center">
        <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${isWinnerState ? 'text-yellow-400' : 'text-indigo-400'}`}>
          {isWinnerState ? 'WINNER DETECTED' : 'CURRENT SELECTION'}
        </p>
        
        <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight py-2 break-words leading-tight">
          {displayParticipant?.name}
        </h2>

        {isSpinning && (
           <div className="h-1 w-24 mx-auto bg-slate-700 rounded-full mt-2 overflow-hidden shrink-0">
             <div className="h-full bg-indigo-500 animate-progressBar" />
           </div>
        )}
      </div>
    </div>
  );
};

export default ZoomView;
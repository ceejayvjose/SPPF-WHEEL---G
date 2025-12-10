import React from 'react';
import { Participant } from '../types';
import { Trophy, Trash2, Clock, X } from 'lucide-react';

export interface WinnerRecord extends Participant {
  timestamp: Date;
}

interface WinnerHistoryProps {
  winners: WinnerRecord[];
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const WinnerHistory: React.FC<WinnerHistoryProps> = ({ winners, onClear, isOpen, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold text-white">Winners</h2>
        </div>
        
        {/* Mobile Close Button */}
        <button 
           onClick={onClose} 
           className="lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {winners.length === 0 ? (
          <div className="text-center text-slate-500 py-10 flex flex-col items-center">
            <Clock size={48} className="mb-4 opacity-20" />
            <p>No winners yet.</p>
            <p className="text-sm">Spin the wheel to make history!</p>
          </div>
        ) : (
          winners.map((winner, index) => (
            <div 
              key={`${winner.id}-${winner.timestamp.getTime()}`}
              className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 flex items-center justify-between group animate-fadeIn"
            >
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs" style={{ backgroundColor: winner.color }}>
                    #{winners.length - index}
                 </div>
                 <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">{winner.name}</p>
                    <p className="text-xs text-slate-400">
                      {winner.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {winners.length > 0 && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 size={16} /> Clear History
          </button>
        </div>
      )}
    </div>
  );
};

export default WinnerHistory;
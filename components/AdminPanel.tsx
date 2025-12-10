import React, { useState } from 'react';
import { Participant } from '../types';
import { Trash2, Plus, Users, RefreshCw, Shuffle, Clock, FileText, Type } from 'lucide-react';

interface AdminPanelProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onBulkAdd: (text: string) => void;
  onRemoveParticipant: (id: string) => void;
  onReset: () => void;
  onShuffle: () => void;
  isSpinning: boolean;
  spinDuration: number;
  onDurationChange: (duration: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  participants, 
  onAddParticipant, 
  onBulkAdd,
  onRemoveParticipant, 
  onReset,
  onShuffle,
  isSpinning,
  spinDuration,
  onDurationChange
}) => {
  const [newName, setNewName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newName.trim()) {
      onAddParticipant(newName.trim());
      setNewName('');
    }
  };

  const handleBulkSubmit = () => {
    if (bulkText.trim()) {
      onBulkAdd(bulkText);
      setBulkText('');
      setMode('single');
    }
  };

  return (
    <div className="w-full lg:w-96 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-xl z-30">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="text-indigo-400" size={24} />
          <h2 className="text-xl font-bold text-white">Participants</h2>
        </div>
        <p className="text-slate-400 text-sm">Manage the wheel entries below.</p>
      </div>

      {/* Input Section */}
      <div className="p-4 border-b border-slate-700 space-y-3 bg-slate-800">
        <div className="flex gap-2 mb-2">
           <button 
             onClick={() => setMode('single')}
             className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'single' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
           >
             <Type size={14} /> Single Entry
           </button>
           <button 
             onClick={() => setMode('bulk')}
             className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
           >
             <FileText size={14} /> Bulk Paste
           </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name..."
              className="flex-1 bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 transition-all"
              disabled={isSpinning}
            />
            <button
              type="submit"
              disabled={!newName.trim() || isSpinning}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste names here (one per line)..."
              className="w-full h-32 bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 text-sm resize-none"
              disabled={isSpinning}
            />
            <button
              onClick={handleBulkSubmit}
              disabled={!bulkText.trim() || isSpinning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg transition-colors font-medium text-sm"
            >
              Add List (Randomized)
            </button>
          </div>
        )}
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.length === 0 ? (
          <div className="text-center text-slate-500 py-10 flex flex-col items-center">
            <Users size={48} className="mb-4 opacity-20" />
            <p>No participants yet.</p>
            <p className="text-sm">Add some names to get started!</p>
          </div>
        ) : (
          participants.map((p) => (
            <div 
              key={p.id} 
              className="group flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 p-3 rounded-lg border border-transparent hover:border-slate-600 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: p.color }} 
                />
                <span className="font-medium text-slate-200 truncate">{p.name}</span>
              </div>
              <button
                onClick={() => onRemoveParticipant(p.id)}
                disabled={isSpinning}
                className="text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Settings & Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-4">
        {/* Spin Duration Control */}
        <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-bold tracking-wider">
               <span className="flex items-center gap-1"><Clock size={12}/> Spin Duration</span>
               <span className="text-indigo-400">{spinDuration}s</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1"
              value={spinDuration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              disabled={isSpinning}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-sm text-slate-400">Total: {participants.length}</span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onShuffle}
              disabled={participants.length < 2 || isSpinning}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-30"
              title="Shuffle All"
            >
              <Shuffle size={14} />
            </button>
            <div className="w-px h-3 bg-slate-700"></div>
            <button 
              onClick={onReset}
              disabled={isSpinning}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
              title="Reset to Default"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
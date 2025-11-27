import React from 'react';
import { Badge, Dream } from '../types';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'beginner',
    name: '初次入夢',
    description: '記錄第一個夢境',
    icon: '🌙',
    condition: (dreams) => dreams.length >= 1,
    unlocked: false
  },
  {
    id: 'storyteller',
    name: '夢語者',
    description: '累積 5 個夢境',
    icon: '📜',
    condition: (dreams) => dreams.length >= 5,
    unlocked: false
  },
  {
    id: 'explorer',
    name: '潛意識探險家',
    description: '收集超過 20 個夢境碎片',
    icon: '🧩',
    condition: (dreams) => dreams.reduce((acc, d) => acc + d.fragments.length, 0) >= 20,
    unlocked: false
  },
  {
    id: 'intense',
    name: '高能量釋放',
    description: '記錄一個能量分數 90 以上的夢',
    icon: '🔥',
    condition: (dreams) => dreams.some(d => d.fragments.some(f => f.energy_score >= 90)),
    unlocked: false
  },
  {
    id: 'nightmare',
    name: '面對恐懼',
    description: '面對包含「害怕」或「恐懼」的夢境',
    icon: '👁️',
    condition: (dreams) => dreams.some(d => d.fragments.some(f => f.emotions.some(e => e.includes('怕') || e.includes('恐')))),
    unlocked: false
  }
];

interface BadgeSystemProps {
  dreams: Dream[];
}

const BadgeSystem: React.FC<BadgeSystemProps> = ({ dreams }) => {
  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {INITIAL_BADGES.map((badge) => {
        const isUnlocked = badge.condition(dreams);
        
        return (
          <div 
            key={badge.id}
            className={`
              relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center text-center
              border transition-all duration-300
              ${isUnlocked 
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 grayscale opacity-60'}
            `}
          >
            <div className={`text-4xl mb-3 ${isUnlocked ? 'animate-bounce' : ''}`}>
              {badge.icon}
            </div>
            <h4 className="font-bold text-slate-100 mb-1">{badge.name}</h4>
            <p className="text-xs text-slate-400">{badge.description}</p>
            {!isUnlocked && (
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 bg-slate-900 px-2 py-1 rounded">Locked</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BadgeSystem;
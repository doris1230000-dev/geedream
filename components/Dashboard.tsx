import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Dream } from '../types';

interface DashboardProps {
  dreams: Dream[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ dreams }) => {

  const emotionData = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach(d => {
      d.fragments.forEach(f => {
        f.emotions.forEach(e => {
          counts[e] = (counts[e] || 0) + 1;
        });
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [dreams]);

  const colorData = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach(d => {
      d.fragments.forEach(f => {
        f.colors.forEach(c => {
          counts[c] = (counts[c] || 0) + 1;
        });
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [dreams]);

  const energyTrend = useMemo(() => {
    return dreams.slice().reverse().map((d, idx) => {
      const avgEnergy = d.fragments.reduce((sum, f) => sum + f.energy_score, 0) / (d.fragments.length || 1);
      return {
        name: `Day ${idx + 1}`,
        energy: Math.round(avgEnergy)
      };
    });
  }, [dreams]);

  if (dreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>No dreams recorded yet. Start dreaming!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      
      {/* Emotion Bar Chart */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">情緒頻率 Top 5</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emotionData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Color Pie Chart */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">夢境色彩能量</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={colorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {colorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* Energy Trend */}
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg md:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">能量強度趨勢</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyTrend}>
               <XAxis dataKey="name" tick={{fill: '#94a3b8'}} />
               <Tooltip 
                cursor={{fill: '#334155'}}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
               <Bar dataKey="energy" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
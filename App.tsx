import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { analyzeDreamText } from './services/geminiService';
import { Dream, View } from './types';
import Dashboard from './components/Dashboard';
import BadgeSystem from './components/BadgeSystem';
import NetworkGraph from './components/NetworkGraph';
import { PieChart, List, Activity, Share2, Plus, Loader2, Sparkles, Users, MapPin, Heart, HelpCircle, Calendar, MessageCircle, RefreshCcw } from 'lucide-react';

// Default Options Constants
const DEFAULT_CHARACTERS = ["家人", "朋友", "伴侶", "陌生人", "狗", "貓", "逝者", "名人", "同事", "鬼怪", "小孩", "老師"];
const DEFAULT_LOCATIONS = ["家裡", "學校", "辦公室", "老家", "森林", "海邊", "城市", "未知房間", "樓梯", "山", "交通工具", "天空", "廁所", "電梯"];
const DEFAULT_EMOTIONS = ["害怕", "焦慮", "快樂", "困惑", "悲傷", "生氣", "平靜", "興奮", "愧疚", "羞恥", "愛", "孤單", "無助"];

// Reusable Tag Selector Component
interface TagSelectorProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  colorClass: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({ title, icon, options, selected, onChange, placeholder, colorClass }) => {
  const [customInput, setCustomInput] = useState('');

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const handleAddCustom = () => {
    if (customInput.trim() && !selected.includes(customInput.trim())) {
      onChange([...selected, customInput.trim()]);
      setCustomInput('');
    }
  };

  // Combine default options with any selected custom tags to ensure they are visible
  const displayOptions = Array.from(new Set([...options, ...selected]));

  return (
    <div className="mb-6">
      <label className="flex items-center text-sm font-medium text-slate-300 mb-3">
        {icon}
        <span className="ml-2">{title}</span>
      </label>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {displayOptions.map(tag => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                isSelected 
                  ? `${colorClass} text-white border-transparent shadow-md` 
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder={placeholder}
        />
        <button 
          onClick={handleAddCustom}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form State
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputDream, setInputDream] = useState('');
  const [inputContext, setInputContext] = useState('');
  const [inputReentryRecord, setInputReentryRecord] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('dream-weaver-dreams');
    if (saved) {
      try {
        setDreams(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local storage");
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('dream-weaver-dreams', JSON.stringify(dreams));
  }, [dreams]);

  const handleAnalyze = async () => {
    // Validation: Require at least one input
    if (!inputDream.trim() && selectedCharacters.length === 0 && selectedLocations.length === 0 && selectedEmotions.length === 0) {
      alert("請輸入夢境內容或選擇至少一個相關標籤（人物、場景或情緒）。");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Construct a rich prompt from structured data if text is sparse
      let richDreamText = inputDream.trim();
      
      const metaParts = [];
      if (selectedCharacters.length) metaParts.push(`出現人物: ${selectedCharacters.join(', ')}`);
      if (selectedLocations.length) metaParts.push(`場景: ${selectedLocations.join(', ')}`);
      if (selectedEmotions.length) metaParts.push(`感受到的情緒: ${selectedEmotions.join(', ')}`);
      
      if (metaParts.length > 0) {
        richDreamText += `\n\n[使用者補充標籤資訊]\n${metaParts.join('\n')}`;
      }

      // If user didn't type a story but selected tags, use the tags as the story
      if (!inputDream.trim() && metaParts.length > 0) {
        richDreamText = `夢境包含以下元素：\n${metaParts.join('\n')}`;
      }

      const fragments = await analyzeDreamText(richDreamText, inputContext, inputReentryRecord);
      
      const newDream: Dream = {
        id: uuidv4(),
        rawText: richDreamText, // Save the constructed text so we have context
        context: inputContext,
        reentryRecord: inputReentryRecord,
        date: new Date(inputDate).toISOString(),
        fragments: fragments
      };

      setDreams(prev => [newDream, ...prev]);
      
      // Reset Form
      setInputDream('');
      setInputContext('');
      setInputReentryRecord('');
      setSelectedCharacters([]);
      setSelectedLocations([]);
      setSelectedEmotions([]);
      // Date keeps current selection or resets to today? Let's keep it as is or reset to today. 
      // Usually users might log multiple dreams for same day, so keeping it is fine, but resetting to today is safer for next usage.
      setInputDate(new Date().toISOString().split('T')[0]);
      
      setView('journal'); // Go to journal to see result
    } catch (error) {
      console.error(error);
      alert("解析失敗，請稍後再試。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <div className="max-w-2xl mx-auto pt-6 px-4 pb-12">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2 text-center">
              記錄你的夢境
            </h1>
            <p className="text-center text-slate-400 mb-6 text-sm">
              輸入夢境內容或選取關鍵字，AI 將自動拆解碎片並解析潛意識。
            </p>
            
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
              
              {/* 0. Date Selection */}
              <div>
                 <label className="flex items-center text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                  夢境日期
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                />
              </div>

              {/* 1. Dream Content (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  夢境內容 <span className="text-slate-500 text-xs">(選填)</span>
                </label>
                <textarea 
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none leading-relaxed"
                  placeholder="我看見自己在一個無盡的走廊奔跑..."
                  value={inputDream}
                  onChange={(e) => setInputDream(e.target.value)}
                />
              </div>

              <div className="h-px bg-slate-700/50 my-4"></div>

              {/* 2. Characters */}
              <TagSelector 
                title="夢境出現人物" 
                icon={<Users className="w-4 h-4 text-emerald-400" />}
                options={DEFAULT_CHARACTERS}
                selected={selectedCharacters}
                onChange={setSelectedCharacters}
                placeholder="新增人物..."
                colorClass="bg-emerald-600"
              />

              {/* 3. Locations */}
              <TagSelector 
                title="夢境場景" 
                icon={<MapPin className="w-4 h-4 text-amber-400" />}
                options={DEFAULT_LOCATIONS}
                selected={selectedLocations}
                onChange={setSelectedLocations}
                placeholder="新增場景..."
                colorClass="bg-amber-600"
              />

              {/* 4. Emotions */}
              <TagSelector 
                title="情緒" 
                icon={<Heart className="w-4 h-4 text-pink-400" />}
                options={DEFAULT_EMOTIONS}
                selected={selectedEmotions}
                onChange={setSelectedEmotions}
                placeholder="新增情緒..."
                colorClass="bg-pink-600"
              />

              <div className="h-px bg-slate-700/50 my-4"></div>

              {/* 5. Recent Context (At the end) */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-300 mb-2">
                  <HelpCircle className="w-4 h-4 mr-2 text-indigo-400" />
                  最近有什麼煩惱或事件？
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="例如：最近工作壓力大、剛看完一部恐怖片..."
                  value={inputContext}
                  onChange={(e) => setInputContext(e.target.value)}
                />
              </div>

              <div className="h-px bg-slate-700/50 my-4"></div>

               {/* 6. Advanced Field: Re-entry Record */}
               <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-900/30">
                <label className="flex items-center text-sm font-medium text-indigo-300 mb-2">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  回到夢裡對話與紀錄 (進階靈性)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  這是針對靈性者用潛意識回到夢裡再次與夢裡人事物做更深層的對話與詢問甚至改寫的紀錄
                </p>
                <textarea 
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                  placeholder="例如：我再次回到走廊，問那個人為什麼追我，他告訴我..."
                  value={inputReentryRecord}
                  onChange={(e) => setInputReentryRecord(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!inputDream.trim() && selectedCharacters.length === 0 && selectedLocations.length === 0 && selectedEmotions.length === 0)}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" /> 解析夢境碎片中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" /> 開始解析
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'journal':
        return (
          <div className="max-w-3xl mx-auto pt-6 px-4 pb-20">
            <h2 className="text-2xl font-bold mb-6 text-slate-200 flex items-center">
              <List className="mr-2" /> 夢境碎片庫
            </h2>
            {dreams.length === 0 ? (
              <div className="text-center text-slate-500 mt-12">
                <p>尚未有紀錄。</p>
                <button onClick={() => setView('home')} className="mt-4 text-indigo-400 hover:text-indigo-300">
                  去記錄第一場夢 &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {dreams.map((dream) => (
                  <div key={dream.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-md">
                    <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                      <span className="text-sm font-mono text-slate-300 font-bold flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-slate-500" />
                        {new Date(dream.date).toLocaleDateString()}
                      </span>
                      {dream.context && <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 truncate max-w-[200px]">事件: {dream.context}</span>}
                    </div>
                    
                    {/* Raw Text Preview */}
                    <div className="p-4 text-slate-400 text-sm italic border-b border-slate-700/50 whitespace-pre-wrap">
                      {dream.rawText.length > 150 ? dream.rawText.substring(0, 150) + '...' : dream.rawText}
                    </div>

                    {/* Re-entry Record Display */}
                    {dream.reentryRecord && (
                      <div className="p-4 bg-indigo-950/20 border-b border-indigo-900/30">
                        <div className="flex items-center text-xs font-bold text-indigo-300 mb-2">
                          <RefreshCcw className="w-3 h-3 mr-1.5" />
                          回到夢裡對話與紀錄
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed pl-4 border-l-2 border-indigo-500/30">
                          {dream.reentryRecord}
                        </p>
                      </div>
                    )}

                    <div className="p-4 grid gap-4 md:grid-cols-2">
                      {dream.fragments.map((frag) => (
                        <div key={frag.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 relative group hover:border-indigo-500/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                             <div className="text-sm font-medium text-slate-200 line-clamp-2 mb-2">{frag.text}</div>
                             <div className={`text-xs px-2 py-0.5 rounded font-mono ${
                               frag.energy_score > 70 ? 'bg-red-500/20 text-red-300' : 
                               frag.energy_score < 30 ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                             }`}>
                               E:{frag.energy_score}
                             </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {frag.colors.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 bg-slate-600 rounded text-slate-300">🎨 {c}</span>)}
                            {frag.emotions.map(e => <span key={e} className="text-[10px] px-1.5 py-0.5 bg-pink-900/40 text-pink-200 rounded">❤️ {e}</span>)}
                            {frag.characters.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 bg-indigo-900/40 text-indigo-200 rounded">👤 {c}</span>)}
                          </div>
                          
                          <div className="text-xs text-indigo-200 bg-indigo-950/30 p-2 rounded border border-indigo-500/20">
                            🔮 解析: {frag.interpretation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'dashboard':
        return (
          <div className="max-w-6xl mx-auto pt-6 px-4 pb-20">
             <h2 className="text-2xl font-bold mb-6 text-slate-200 flex items-center">
              <Activity className="mr-2" /> 夢境儀表板
            </h2>
            <Dashboard dreams={dreams} />
            
            <h2 className="text-2xl font-bold mt-12 mb-6 text-slate-200 flex items-center">
              <Share2 className="mr-2" /> 關聯星圖
            </h2>
            <NetworkGraph dreams={dreams} />
          </div>
        );
      
      case 'graph':
        return (
           <div className="h-[calc(100vh-100px)] p-4">
             <NetworkGraph dreams={dreams} />
           </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Mobile-First Header */}
      <header className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white text-lg font-bold">D</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DreamWeaver
            </span>
          </div>
          
          <div className="text-xs text-slate-500 hidden sm:block">
            Gemini 2.5 AI Powered
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-24 min-h-screen">
        {renderContent()}
        
        {view === 'journal' && dreams.length > 0 && (
           <div className="max-w-3xl mx-auto px-4 mt-12">
             <h3 className="text-xl font-bold mb-4 text-slate-200">成就徽章</h3>
             <BadgeSystem dreams={dreams} />
           </div>
        )}
      </main>

      {/* Sticky Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'home' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Plus size={24} />
            <span className="text-[10px] mt-1 font-medium">記錄</span>
          </button>
          
          <button 
            onClick={() => setView('journal')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'journal' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List size={24} />
            <span className="text-[10px] mt-1 font-medium">碎片庫</span>
          </button>
          
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <PieChart size={24} />
            <span className="text-[10px] mt-1 font-medium">洞察</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
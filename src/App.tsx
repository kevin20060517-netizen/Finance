import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Shield, Wallet, BarChart3, Settings, 
  User, Info, Zap, Gavel, RefreshCcw, ArrowRightLeft, Sparkles, Volume2,
  Lock, Unlock, ChevronRight, Activity, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  // --- UI 狀態 ---
  const [role, setRole] = useState<'player' | 'admin'>('player');
  const [isLocked, setIsLocked] = useState(false);

  // --- 遊戲狀態 ---
  const [balance, setBalance] = useState(10000000);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState([{ round: 0, balance: 10000000 }]);
  const [weights, setWeights] = useState({ stocks: 40, bonds: 40, crypto: 20 });
  const [leverage, setLeverage] = useState(1);
  const [committed, setCommitted] = useState({ weights: { stocks: 40, bonds: 40, crypto: 20 }, leverage: 1 });
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [eventProbs, setEventProbs] = useState<Record<number, number>>({});
  const [insiderInfo, setInsiderInfo] = useState<string | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<{ scenario: string, return: number } | null>(null);

  // --- 市場事件 (預設可選事件) ---
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "量子計算突破",
      desc: "高科技領域生產力大升，但加密貨幣面臨安全挑戰。",
      alpha: 0.1,
      impact: { stocks: 0.15, bonds: -0.02, crypto: -0.15 },
      volatility: { stocks: 0.05, bonds: 0.01, crypto: 0.2 },
      violation: { trigger: "crypto", threshold: 60, penalty: 0.1, msg: "監管機構對高風險資產展開調查。" }
    },
    {
      id: 2,
      name: "全球通膨飆升",
      desc: "大宗商品大漲，央行激進加息壓制經濟。",
      alpha: 0.2,
      impact: { stocks: -0.12, bonds: 0.04, crypto: -0.30 },
      volatility: { stocks: 0.08, bonds: 0.02, crypto: 0.15 },
      violation: { trigger: "leverage", threshold: 1.5, penalty: 0.05, msg: "高槓桿遭流動性緊縮懲罰。" }
    },
    {
      id: 3,
      name: "穩健復甦期",
      desc: "低失業率與穩定增長齊頭並進，市場波動降低。",
      alpha: 0.05,
      impact: { stocks: 0.08, bonds: 0.02, crypto: 0.10 },
      volatility: { stocks: 0.03, bonds: 0.01, crypto: 0.08 },
    },
    {
      id: 4,
      name: "地緣摩擦加劇",
      desc: "國際貿易受到威脅，避險資金逃往傳統債券。",
      alpha: 0.15,
      impact: { stocks: -0.10, bonds: 0.08, crypto: -0.12 },
      volatility: { stocks: 0.07, bonds: 0.02, crypto: 0.12 },
    },
    {
      id: 5,
      name: "技術革命爆發",
      desc: "新型能源與傳播技術普及，股市迎来增長潮。",
      alpha: 0.1,
      impact: { stocks: 0.12, bonds: 0.01, crypto: 0.05 },
      volatility: { stocks: 0.04, bonds: 0.01, crypto: 0.06 },
    }
  ]);

  // --- 計算邏輯 ---
  const totalWeight = useMemo(() => weights.stocks + weights.bonds + weights.crypto, [weights]);
  const canConfirm = totalWeight === 100;

  const handleCommit = () => {
    if (!canConfirm) return;
    setCommitted({ weights: { ...weights }, leverage });
    setIsLocked(true);
  };

  const currentTotalProb = useMemo(() => {
    return selectedEventIds.reduce((sum, id) => sum + (eventProbs[id] || 0), 0);
  }, [selectedEventIds, eventProbs]);

  const handleSettle = () => {
    if (selectedEventIds.length !== 3 || !isLocked) return;
    
    // 獨立決定每個事件是否觸發
    const triggeredEvents = selectedEventIds.filter(id => {
      const prob = eventProbs[id] || 0;
      return Math.random() * 100 <= prob;
    });

    let selectedEventImpacts: any[] = [];
    let scenarioDescription = "";

    if (triggeredEvents.length > 0) {
      // 如果有事件觸發，計算加權平均或是單獨處理
      // 使用觸發事件的機率作為權重進行加權平均
      const totalTriggeredWeight = triggeredEvents.reduce((sum, id) => sum + (eventProbs[id] || 1), 0);
      
      const combinedImpact = {
        stocks: 0,
        bonds: 0,
        crypto: 0,
        volatility: { stocks: 0, bonds: 0, crypto: 0 },
        alpha: 0
      };

      triggeredEvents.forEach(id => {
        const e = events.find(ev => ev.id === id)!;
        const weight = (eventProbs[id] || 1) / totalTriggeredWeight;
        
        combinedImpact.stocks += e.impact.stocks * weight;
        combinedImpact.bonds += e.impact.bonds * weight;
        combinedImpact.crypto += e.impact.crypto * weight;
        combinedImpact.volatility.stocks += e.volatility.stocks * weight;
        combinedImpact.volatility.bonds += e.volatility.bonds * weight;
        combinedImpact.volatility.crypto += e.volatility.crypto * weight;
        combinedImpact.alpha += e.alpha * weight;
      });

      selectedEventImpacts = [combinedImpact];
      scenarioDescription = `觸發事件: ${triggeredEvents.map(id => events.find(e => e.id === id)?.name).join(", ")} (加權計算)`;
    } else {
      // 都沒選中時：選機率最高的數值 + (機率最低的 0.3 倍數值)
      const sortedByProb = [...selectedEventIds].sort((a, b) => (eventProbs[b] || 0) - (eventProbs[a] || 0));
      const highestId = sortedByProb[0];
      const lowestId = sortedByProb[sortedByProb.length - 1];
      
      const highestEvent = events.find(e => e.id === highestId)!;
      const lowestEvent = events.find(e => e.id === lowestId)!;

      const fallbackImpact = {
        stocks: highestEvent.impact.stocks + (lowestEvent.impact.stocks * 0.3),
        bonds: highestEvent.impact.bonds + (lowestEvent.impact.bonds * 0.3),
        crypto: highestEvent.impact.crypto + (lowestEvent.impact.crypto * 0.3),
        volatility: {
          stocks: highestEvent.volatility.stocks + (lowestEvent.volatility.stocks * 0.3),
          bonds: highestEvent.volatility.bonds + (lowestEvent.volatility.bonds * 0.3),
          crypto: highestEvent.volatility.crypto + (lowestEvent.volatility.crypto * 0.3),
        },
        alpha: (highestEvent.alpha + lowestEvent.alpha) / 2 // 平均 alpha 作為參考
      };

      selectedEventImpacts = [fallbackImpact];
      scenarioDescription = "市場觀望: 未觸發特定事件。執行基準影響補償計算。";
    }

    const impact = selectedEventImpacts[0];
    const calcRet = (i: number, v: number, a: number) => i + (Math.log(1 / a) * 1.5 * v * (Math.random() * 2 - 1));
    const rs = calcRet(impact.stocks, impact.volatility.stocks, impact.alpha);
    const rb = calcRet(impact.bonds, impact.volatility.bonds, impact.alpha);
    const rc = calcRet(impact.crypto, impact.volatility.crypto, impact.alpha);

    const weighted = (committed.weights.stocks/100)*rs + (committed.weights.bonds/100)*rb + (committed.weights.crypto/100)*rc;
    let roundReturn = (weighted * committed.leverage) - (Math.max(0, Math.abs(committed.leverage) - 1) * 0.02);

    const newBal = Math.max(0, balance * (1 + roundReturn));
    setBalance(newBal);
    setHistory([...history, { round: round, balance: newBal }]);
    setRound(round + 1);
    setIsLocked(false);
    setSelectedEventIds([]);
    setEventProbs({});
    setInsiderInfo(scenarioDescription);
    setLastRoundResult({ scenario: scenarioDescription, return: roundReturn });
  };

  const toggleEventSelection = (id: number) => {
    if (selectedEventIds.includes(id)) {
      setSelectedEventIds(selectedEventIds.filter(i => i !== id));
      const nextProbs = { ...eventProbs };
      delete nextProbs[id];
      setEventProbs(nextProbs);
    } else if (selectedEventIds.length < 3) {
      setSelectedEventIds([...selectedEventIds, id]);
      setEventProbs({ ...eventProbs, [id]: 0 });
    }
  };

  const handleWeightChange = (key: string, val: string) => {
    const newVal = parseInt(val) || 0;
    setWeights({
      ...weights,
      [key]: newVal
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">資</div>
            <div>
              <h1 className="text-lg font-black tracking-tight">資產組合 <span className="text-slate-400">v3.0</span></h1>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 系統運行正常 • 第 {round} 回合
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">淨值總額</p>
              <p className="text-xl font-mono font-black text-slate-900">${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <button 
              onClick={() => setRole(role === 'player' ? 'admin' : 'player')}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all text-slate-500"
              title="切換後台"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {lastRoundResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg border border-indigo-500 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-indigo-200 fill-indigo-200" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">回合結算報告</span>
                    </div>
                    <button onClick={() => setLastRoundResult(null)} className="text-indigo-200 hover:text-white transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs font-bold leading-relaxed">{lastRoundResult.scenario}</p>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">當期回報</span>
                      <span className={`text-sm font-mono font-black ${lastRoundResult.return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(lastRoundResult.return * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {role === 'player' ? (
                <motion.div 
                  key="player" 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-2xl p-8 space-y-10"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-slate-400" size={18} />
                    <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">策略配置面板</h2>
                  </div>

                  <div className="space-y-10">
                    {[
                      { key: 'stocks', label: '股票', sub: 'Stocks', color: '#6366f1' },
                      { key: 'crypto', label: '虛擬貨幣', sub: 'Crypto', color: '#f59e0b' },
                      { key: 'bonds', label: '債券', sub: 'Bonds', color: '#10b981' }
                    ].map((asset) => (
                      <div key={asset.key} className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{asset.label}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.sub}</span>
                          </div>
                          <span className="text-xl font-mono font-black" style={{ color: asset.color }}>{(weights as any)[asset.key]}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={(weights as any)[asset.key]}
                          onChange={(e) => handleWeightChange(asset.key, e.target.value)}
                          className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900 transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <span>槓桿倍數 Leverage</span>
                        <span className="text-slate-900 font-mono font-bold">{leverage}x</span>
                      </div>
                      <input 
                        type="range" min="-3" max="3" step="0.1" value={leverage}
                        onChange={(e) => setLeverage(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <button 
                      onClick={handleCommit}
                      disabled={!canConfirm}
                      className={`py-5 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] border transition-all ${
                        !canConfirm 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isLocked 
                            ? (JSON.stringify(weights) !== JSON.stringify(committed.weights) || leverage !== committed.leverage ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400')
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
                      }`}
                    >
                      {!canConfirm ? `比例需為100% (${totalWeight}%)` : isLocked ? (JSON.stringify(weights) !== JSON.stringify(committed.weights) || leverage !== committed.leverage ? '更新並重新鎖定' : '配置已鎖定回報待產出') : '鎖定當前比例並傳送'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="admin" 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="text-slate-400" size={18} />
                    <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">市場結算系統 (混合事件模式)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">步驟 1: 選擇三個標的事件 ({selectedEventIds.length}/3)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {events.map(e => {
                          const isSelected = selectedEventIds.includes(e.id);
                          return (
                            <div key={e.id} className="relative group/tooltip">
                              <button 
                                onClick={() => toggleEventSelection(e.id)}
                                className={`w-full p-4 rounded-xl text-left border transition-all ${
                                  isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
                                }`}
                              >
                                <h4 className="text-[10px] font-black mb-1">{e.name}</h4>
                                <p className={`text-[8px] leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{e.desc}</p>
                              </button>
                              
                              {/* Hover Details Tooltip */}
                              <div className="absolute z-50 bottom-full left-0 mb-2 w-48 p-3 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                                <div className="space-y-2">
                                  <div className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-100 pb-1 mb-1">預期影響 (Impact)</div>
                                  <div className="grid grid-cols-2 gap-y-1 text-[9px] font-bold">
                                    <span className="text-slate-500">股票:</span>
                                    <span className={e.impact.stocks >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(e.impact.stocks * 100).toFixed(0)}%</span>
                                    <span className="text-slate-500">債券:</span>
                                    <span className={e.impact.bonds >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(e.impact.bonds * 100).toFixed(0)}%</span>
                                    <span className="text-slate-500">虛擬貨幣:</span>
                                    <span className={e.impact.crypto >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(e.impact.crypto * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="text-[8px] font-black uppercase text-slate-400 border-t border-slate-100 pt-1 mt-1">基準波動 (Vol)</div>
                                  <div className="flex justify-between text-[9px] font-mono text-slate-600">
                                    <span>股:{(e.volatility.stocks * 100).toFixed(0)}%</span>
                                    <span>債:{(e.volatility.bonds * 100).toFixed(0)}%</span>
                                    <span>虛:{(e.volatility.crypto * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {selectedEventIds.length === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 border-t border-slate-50 pt-6">
                        <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">步驟 2: 設定發生機率 (獨立機率，不限總和)</h3>
                        <div className="space-y-4">
                          {selectedEventIds.map(id => {
                            const event = events.find(e => e.id === id);
                            return (
                              <div key={id} className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl relative group/tooltip">
                                <span className="text-[10px] font-bold text-slate-800 w-24 truncate cursor-help underline decoration-dotted decoration-slate-300 underline-offset-4">{event?.name}</span>
                                
                                {/* Inline Tooltip for Prob Step */}
                                <div className="absolute z-50 bottom-full left-4 mb-2 w-48 p-3 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                                  {event && (
                                    <div className="space-y-2 text-left">
                                      <div className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-100 pb-1 mb-1">影響參數明細</div>
                                      <div className="grid grid-cols-2 gap-y-1 text-[9px] font-bold">
                                        <span className="text-slate-500">股票:</span>
                                        <span className={event.impact.stocks >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(event.impact.stocks * 100).toFixed(0)}%</span>
                                        <span className="text-slate-500">債券:</span>
                                        <span className={event.impact.bonds >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(event.impact.bonds * 100).toFixed(0)}%</span>
                                        <span className="text-slate-500">虛擬貨幣:</span>
                                        <span className={event.impact.crypto >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{(event.impact.crypto * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <input 
                                  type="range" min="0" max="100" value={eventProbs[id] || 0}
                                  onChange={(e) => setEventProbs({ ...eventProbs, [id]: parseInt(e.target.value) })}
                                  className="flex-1 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-xs font-mono font-black text-indigo-600 w-10 text-right">{eventProbs[id] || 0}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button 
                    disabled={selectedEventIds.length !== 3 || !isLocked}
                    onClick={handleSettle}
                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-xl transition-all shadow-md"
                  >
                    {selectedEventIds.length !== 3 
                      ? '請先選擇三個事件' 
                      : !isLocked 
                        ? '等待玩家鎖定配置' 
                        : '執行獨立機率結算'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-6">價值增長路徑</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="round" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Line type="stepAfter" dataKey="balance" stroke="#000" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-lg">
                <span>報酬回報</span>
                <span className={history.length > 1 && history[history.length-1].balance >= history[0].balance ? 'text-emerald-600' : 'text-rose-600'}>
                  {history.length > 1 ? (((history[history.length-1].balance/history[0].balance)-1)*100).toFixed(2) : "0.00"}%
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">已鎖定的配置結構</h3>
                 {isLocked && (JSON.stringify(weights) !== JSON.stringify(committed.weights) || leverage !== committed.leverage) && (
                   <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">與當前不符</span>
                 )}
               </div>
               <div className="h-32 w-full flex items-center justify-center relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={[{ name: 'S', value: committed.weights.stocks }, { name: 'B', value: committed.weights.bonds }, { name: 'C', value: committed.weights.crypto }]} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                       <Cell fill="#6366f1" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-900">{committed.leverage}x</span>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-4 text-[8px] font-bold text-slate-400 text-center uppercase tracking-wider">
                 <div className="flex flex-col items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"/> 股票</div>
                 <div className="flex flex-col items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> 債券</div>
                 <div className="flex flex-col items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> 虛擬貨幣</div>
               </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={12} className="text-indigo-400" />
                <h3 className="text-[9px] font-black tracking-widest uppercase text-indigo-300">專業情報中心</h3>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400 font-medium italic">
                {insiderInfo || "當前市場處於均衡狀態。請密切監測地緣政治與科技突破之相關動態。所有指令將於指令發送後第一時間生效。"}
              </p>
            </div>
          </div>
        </main>

        <footer className="pt-8 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">
          &copy; 2026 資產組合 • 金融科技模擬交易端
        </footer>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        input[type='range'] { -webkit-appearance: none; }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%;
          background: white; border: 2px solid #000; cursor: pointer; margin-top: -6px;
        }
        input[type='range']::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; }
      `}} />
    </div>
  );
};

export default App;

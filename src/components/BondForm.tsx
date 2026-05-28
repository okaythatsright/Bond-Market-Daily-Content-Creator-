import { useState, useEffect } from 'react';
import { BondMarketSection, BondDataPoint } from '../types';
import { RefreshCw, Play, Edit, Plus, Trash2, Sliders, AlertCircle, Info, TrendingUp, TrendingDown, Minus, Globe, ExternalLink, Compass } from 'lucide-react';

interface BondFormProps {
  sections: BondMarketSection[];
  onChangeSections: (sections: BondMarketSection[]) => void;
  onSynthesize: () => void;
  isSynthesizing: boolean;
  onReset: () => void;
}

export default function BondForm({
  sections,
  onChangeSections,
  onSynthesize,
  isSynthesizing,
  onReset
}: BondFormProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>('broad-aggregate');
  
  // Real-time search grounded macroeconomic narratives state
  const [narratives, setNarratives] = useState<Record<string, {
    narrativeText: string;
    sentiment: string;
    keyDrivers: string[];
    citations: { title: string; url: string }[];
  }>>({});
  const [loadingNarrative, setLoadingNarrative] = useState<boolean>(false);

  const fetchNarrative = async (secId: string, secTitle: string) => {
    setLoadingNarrative(true);
    try {
      const res = await fetch(`/api/bond-data/narratives?sectionId=${encodeURIComponent(secId)}&sectionTitle=${encodeURIComponent(secTitle)}`);
      const data = await res.json();
      if (data.success) {
        setNarratives(prev => ({
          ...prev,
          [secId]: {
            narrativeText: data.narrativeText,
            sentiment: data.sentiment,
            keyDrivers: data.keyDrivers || [],
            citations: data.citations || []
          }
        }));
      }
    } catch (err) {
      console.error("Narrative fetch failed:", err);
    } finally {
      setLoadingNarrative(false);
    }
  };

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  // Auto-fetch narrative on tab changes if they are not already cached
  useEffect(() => {
    if (activeSectionId && activeSection && !narratives[activeSectionId]) {
      fetchNarrative(activeSectionId, activeSection.title);
    }
  }, [activeSectionId]);

  // Handle updates to specific data point inline
  const handleDataPointChange = (
    sectionId: string,
    dataIndex: number,
    field: keyof BondDataPoint,
    value: string
  ) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        const updatedData = [...sec.data];
        updatedData[dataIndex] = {
          ...updatedData[dataIndex],
          [field]: value
        };
        return { ...sec, data: updatedData };
      }
      return sec;
    });
    onChangeSections(updatedSections);
  };

  // Quick edit trend direction
  const handleTrendCycle = (sectionId: string, dataIndex: number, currentTrend: 'up' | 'down' | 'flat') => {
    const nextTrendMap: Record<'up' | 'down' | 'flat', 'up' | 'down' | 'flat'> = {
      'up': 'down',
      'down': 'flat',
      'flat': 'up'
    };
    handleDataPointChange(sectionId, dataIndex, 'trend', nextTrendMap[currentTrend]);
  };

  return (
    <div className="bg-[#16181D] rounded-lg border border-[#1F2937] shadow-sm overflow-hidden" id="bond-form-container">
      {/* Dashboard Section Selection Navigation */}
      <div className="bg-[#0F1116] border-b border-[#1F2937] p-2 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-1">
        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`px-4 py-2 rounded text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-[#B89C6D] text-[#0A0B0E] shadow-md font-bold'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1C1F26]'
              }`}
              id={`tab-btn-${section.id}`}
            >
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Editor Main Section */}
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#B89C6D]" />
              Configure Live Dashboard Data
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {activeSection.description}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onReset}
              className="text-xs text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center bg-[#1C1F26] hover:bg-[#2D3139] border border-[#1F2937] px-3 py-1.5 rounded transition-all cursor-pointer"
              title="Restore initial representative values"
              id="reset-defaults-btn"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Real-time Web Grounded Macro Narrative Block */}
        <div className="mb-6 bg-[#0F1116] rounded-lg border border-[#1F2937] p-5 shadow-inner" id="macro-narrative-panel">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1C1F26]">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#B89C6D]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">
                Sovereign Macro Narrative & Web Insights
              </h4>
            </div>
            
            <button
              onClick={() => fetchNarrative(activeSection.id, activeSection.title)}
              disabled={loadingNarrative}
              className={`text-[10px] text-[#B89C6D] hover:text-[#D4B382] font-semibold flex items-center gap-1 bg-[#1C1F26] px-2 py-1 rounded border border-[#2D3139] transition-all cursor-pointer ${
                loadingNarrative ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              id="refresh-narrative-btn"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${loadingNarrative ? 'animate-spin' : ''}`} />
              {loadingNarrative ? 'Querying Web...' : 'Refetch Insights'}
            </button>
          </div>

          {loadingNarrative && !narratives[activeSection.id] ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-5 w-5 text-[#B89C6D] animate-spin" />
              <p className="text-[10px] text-[#9CA3AF] font-mono tracking-wide">
                Executing real-time Google search grounding query...
              </p>
            </div>
          ) : narratives[activeSection.id] ? (
            <div className="space-y-4">
              {/* Sentiment & Overview */}
              <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                <p className="text-xs text-[#D1D5DB] leading-relaxed font-sans flex-1">
                  {narratives[activeSection.id].narrativeText}
                </p>
                
                {/* Sentiment Badge */}
                <div className="flex-shrink-0 w-full sm:w-auto">
                  {(() => {
                    const sent = narratives[activeSection.id].sentiment?.toLowerCase() || '';
                    if (sent === 'hawkish') {
                      return (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider block text-center min-w-[140px]">
                          🔴 Hawkish Pressures
                        </span>
                      );
                    } else if (sent === 'dovish') {
                      return (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider block text-center min-w-[140px]">
                          🟢 Dovish Relief
                        </span>
                      );
                    } else if (sent === 'volatile') {
                      return (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider block text-center min-w-[140px]">
                          🟣 Market Volatility
                        </span>
                      );
                    } else {
                      return (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase tracking-wider block text-center min-w-[140px]">
                          ⚪ Neutral Outlook
                        </span>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Key Drivers */}
              {narratives[activeSection.id].keyDrivers && narratives[activeSection.id].keyDrivers.length > 0 && (
                <div className="bg-[#16181D] p-3 rounded border border-[#1F2937]/75">
                  <span className="text-[9px] uppercase font-bold text-[#9CA3AF] tracking-wider block mb-2">
                    Primary Macroeconomic Transmission Channels:
                  </span>
                  <ul className="space-y-1.5">
                    {narratives[activeSection.id].keyDrivers.map((driver, k) => (
                      <li key={k} className="text-[11px] text-[#A3A3A3] flex items-start gap-1.5 leading-normal">
                        <span className="text-[#B89C6D] mt-0.5">•</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citations Grounding references */}
              {narratives[activeSection.id].citations && narratives[activeSection.id].citations.length > 0 ? (
                <div className="pt-3 border-t border-[#1C1F26]">
                  <span className="text-[9px] uppercase font-bold text-[#9CA3AF] tracking-wider block mb-1">
                    Grounded Web References & Quote Sources:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {narratives[activeSection.id].citations.map((cite, idx) => (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded bg-[#16181D]/80 border border-[#1F2937] hover:border-[#B89C6D]/40 text-[#9CA3AF] hover:text-[#F3F4F6] transition-all flex items-center space-x-1.5 cursor-pointer text-[10px] truncate"
                        title={cite.title}
                      >
                        <Globe className="h-3 w-3 text-[#B89C6D] flex-shrink-0" />
                        <span className="truncate flex-1 font-mono">{cite.title}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-gray-600 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#1C1F26] text-[10px] text-gray-600 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>Real-time reference sources compiled without secondary redirects.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-gray-500">
              No macroeconomic narratives loaded for this category.
            </div>
          )}
        </div>

        {/* Indicators Editing List */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
          {activeSection.data.map((point, index) => {
            return (
              <div
                key={index}
                className="bg-[#0F1116]/60 p-4 rounded border border-[#1F2937] hover:border-[#374151] transition-all flex flex-col space-y-3"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-tight text-[#E5E7EB]">
                    {point.label}
                  </span>
                  
                  {/* Cycle Trend Button */}
                  <button
                    onClick={() => handleTrendCycle(activeSection.id, index, point.trend)}
                    className={`flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      point.trend === 'up'
                        ? 'bg-[#10B981]/15 text-emerald-400 border border-emerald-500/20'
                        : point.trend === 'down'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                    }`}
                    title="Click to toggle movement direction"
                    id={`toggle-trend-${activeSection.id}-${index}`}
                  >
                    {point.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-emerald-400" />}
                    {point.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-rose-400" />}
                    {point.trend === 'flat' && <Minus className="h-3 w-3 mr-1 text-gray-400" />}
                    {point.trend}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Value Input */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block mb-1">
                      Current Rate / Yield
                    </label>
                    <input
                      type="text"
                      value={point.value}
                      onChange={(e) => handleDataPointChange(activeSection.id, index, 'value', e.target.value)}
                      className="w-full bg-[#16181D] border border-[#2D3748] rounded px-3 py-1.5 text-xs text-[#F3F4F6] font-semibold focus:border-[#B89C6D] outline-none"
                    />
                  </div>

                  {/* Change Input */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block mb-1">
                      Daily Change
                    </label>
                    <input
                      type="text"
                      value={point.change}
                      onChange={(e) => handleDataPointChange(activeSection.id, index, 'change', e.target.value)}
                      className="w-full bg-[#16181D] border border-[#2D3748] rounded px-3 py-1.5 text-xs text-[#F3F4F6] font-semibold focus:border-[#B89C6D] outline-none"
                    />
                  </div>

                  {/* Context Note Details */}
                  <div className="md:col-span-6">
                    <label className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block mb-1">
                      Context / Market Sentiment (Details)
                    </label>
                    <input
                      type="text"
                      value={point.details || ''}
                      onChange={(e) => handleDataPointChange(activeSection.id, index, 'details', e.target.value)}
                      placeholder="e.g. Fed sentiment pressure, overseas demand"
                      className="w-full bg-[#16181D] border border-[#2D3748] rounded px-3 py-1.5 text-xs text-[#D1D5DB] focus:border-[#B89C6D] outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block synthesizing action */}
      <div className="bg-[#0F1116] border-t border-[#1F2937] p-4 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-2 text-xs text-[#9CA3AF]">
          <Info className="h-4 w-4 text-[#B89C6D] flex-shrink-0" />
          <span>Configured values across all 8 tab sections are compiled during synthesis.</span>
        </div>

        <button
          onClick={onSynthesize}
          disabled={isSynthesizing}
          className={`px-5 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
            isSynthesizing
              ? 'bg-[#B89C6D]/40 text-[#0A0B0E]/60 cursor-not-allowed'
              : 'bg-[#B89C6D] hover:bg-[#977E55] text-[#0A0B0E] shadow-md active:translate-y-px'
          }`}
          id="trigger-synthesis-btn"
        >
          {isSynthesizing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              Writing Professional Summaries...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1 text-[#0A0B0E] fill-[#0A0B0E]" />
              Synthesize 8 Daily BlueSky Posts
            </>
          )}
        </button>
      </div>
    </div>
  );
}

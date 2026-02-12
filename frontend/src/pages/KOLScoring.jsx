import { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Star, Crown, Gem, Eye, ExternalLink } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const PLATFORM_CONFIG = {
  twitter: { name: 'X', color: '#1DA1F2', urlKey: 'x_url', icon: '𝕏' },
  youtube: { name: 'YouTube', color: '#FF0000', urlKey: 'youtube_url', icon: '▶' },
  twitch: { name: 'Twitch', color: '#9146FF', urlKey: 'twitch_url', icon: '◉' },
};

export default function KOLScoring() {
  const [kols, setKols] = useState([]);
  const [microKols, setMicroKols] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedKol, setSelectedKol] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getKOLs(),
      api.getMicroKOLs(),
    ]).then(([k, m]) => {
      setKols(k.kols);
      setVariables(k.scoring_variables);
      setMicroKols(m.micro_kols);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSelectKol = async (kol) => {
    if (selectedKol?.id === kol.id) {
      setSelectedKol(null);
      setBreakdown(null);
      return;
    }
    setSelectedKol(kol);
    try {
      const data = await api.getKOLBreakdown(kol.id);
      setBreakdown(data.breakdown);
    } catch (err) {
      console.error(err);
    }
  };

  const radarData = breakdown ? Object.entries(breakdown).map(([key, val]) => ({
    variable: val.label.split(' ').slice(0, 2).join(' '),
    score: val.normalized,
  })) : [];

  const scoreColor = (score) => score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444';

  const getSocialLinks = (kol) => {
    const links = [];
    ['twitter', 'youtube', 'twitch'].forEach(p => {
      const url = kol[PLATFORM_CONFIG[p].urlKey];
      if (url) links.push({ platform: p, url, ...PLATFORM_CONFIG[p] });
    });
    return links.filter(l => l.url);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">KOL Scoring</h1>
        <p className="text-slate-400 mt-1">Évaluation par capacité de portée (impressions) et engagement mesurable</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" /> 10 Variables — Impressions (API X) remplace les conversions estimées
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {variables.map(v => (
            <div key={v.key} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-300 font-medium">{v.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <span className="text-lg font-bold text-indigo-400">{v.weight_percent}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('all')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${tab === 'all' ? 'gradient-maas text-white' : 'text-slate-400 bg-slate-800/30 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Tous ({kols.length})
        </button>
        <button onClick={() => setTab('micro')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${tab === 'micro' ? 'gradient-maas text-white' : 'text-slate-400 bg-slate-800/30 hover:text-white'}`}>
          <Gem className="w-4 h-4" /> Micro-KOLs ({microKols.length})
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-2">
          {(tab === 'all' ? kols : microKols).map((kol, i) => (
            <div
              key={kol.id}
              onClick={() => handleSelectKol(kol)}
              className={`glass rounded-xl p-4 cursor-pointer transition-all ${selectedKol?.id === kol.id ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : 'hover:bg-slate-800/30'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{
                    background: `conic-gradient(${scoreColor(kol.compatibility_score)} ${kol.compatibility_score}%, #1e293b ${kol.compatibility_score}%)`
                  }}>
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-xs font-bold" style={{ color: scoreColor(kol.compatibility_score) }}>{Math.round(kol.compatibility_score)}</span>
                    </div>
                  </div>
                  {i < 3 && tab === 'all' && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{kol.name}</p>
                    <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_CONFIG[kol.platform]?.color }} />
                  </div>
                  <p className="text-xs text-slate-400">{kol.handle} · {kol.followers?.toLocaleString()} · {kol.niche}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: scoreColor(kol.compatibility_score) }}>{Math.round(kol.compatibility_score)}</p>
                  <p className="text-[10px] text-slate-500">/100</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedKol && breakdown ? (
            <div className="glass rounded-2xl p-6 sticky top-6">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold mb-4" style={{ color: scoreColor(selectedKol.compatibility_score) }}>
                  {Math.round(selectedKol.compatibility_score)}
                </p>
                <div className="flex justify-center mb-3">
                  <a href={selectedKol[PLATFORM_CONFIG[selectedKol.primary_platform]?.urlKey] || selectedKol.x_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={selectedKol.avatar_url}
                      alt={selectedKol.name}
                      className="w-20 h-20 rounded-full border-2 object-cover"
                      style={{ borderColor: PLATFORM_CONFIG[selectedKol.primary_platform]?.color || '#6366f1' }}
                    />
                  </a>
                </div>
                <div className="flex justify-center gap-3 mt-2">
                  {getSocialLinks(selectedKol).map(({ platform, url, color, name }) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors" title={name} style={{ color }}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Détail du Score</h3>
              <p className="text-lg font-bold text-white mb-4">{selectedKol.name}</p>

              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="variable" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-2">
                {Object.entries(breakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <p className="text-xs text-slate-400">{val.label}</p>
                        <span className="text-xs font-bold" style={{ color: scoreColor(val.normalized) }}>{val.normalized}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800">
                        <div className="h-full rounded-full transition-all" style={{ width: `${val.normalized}%`, background: scoreColor(val.normalized) }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center h-64">
              <Eye className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">Cliquez sur un KOL pour voir le détail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

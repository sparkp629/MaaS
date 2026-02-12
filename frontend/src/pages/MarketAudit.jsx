import { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, TrendingUp, Newspaper, Twitter, Video, Radio, BarChart3, AlertTriangle, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';

const TYPE_ICONS = { newsletter: Newspaper, thread_x: Twitter, video_short: Video, podcast: Radio };
const TYPE_LABELS = { newsletter: 'Newsletter', thread_x: 'Thread X', video_short: 'Short Vidéo', podcast: 'Podcast' };
const COMP_COLORS = { faible: '#10b981', moyen: '#f59e0b', élevé: '#ef4444', 'très faible': '#06b6d4' };

export default function MarketAudit() {
  const [audits, setAudits] = useState([]);
  const [segments, setSegments] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [nicheAnalysis, setNicheAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('opportunities');

  useEffect(() => {
    Promise.all([
      api.getMarketAudit(),
      api.getSegments(),
      api.getWeaknesses(),
    ]).then(([a, s, w]) => {
      setAudits(a.audits);
      setSegments(s.segments);
      setWeaknesses(w.weaknesses);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleNicheSearch = async () => {
    if (!selectedNiche) return;
    try {
      const analysis = await api.getNicheAnalysis(selectedNiche);
      setNicheAnalysis(analysis);
    } catch (err) {
      console.error(err);
    }
  };

  const niches = [...new Set(audits.map(a => a.niche))];
  const filteredAudits = selectedNiche ? audits.filter(a => a.niche === selectedNiche) : audits;

  const segmentChartData = segments.map(s => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    'Besoin Mindshare': s.mindshare_need,
    'Score Opportunité': s.opportunity_score,
    'Croissance': s.growth_rate,
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Audit de Marché</h1>
        <p className="text-slate-400 mt-1">Analyse des opportunités de Mindshare pour l'écosystème SaaS & IA</p>
      </div>

      {/* Niche Search */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-5 h-5 text-slate-400" />
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Toutes les niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={handleNicheSearch} disabled={!selectedNiche} className="px-4 py-2 rounded-lg gradient-maas text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
            Analyser la niche
          </button>
        </div>

        {nicheAnalysis && nicheAnalysis.status === 'analyzed' && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-400">{nicheAnalysis.recommendation}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="text-center p-2 rounded-lg bg-slate-800/30">
                <p className="text-lg font-bold text-white">{nicheAnalysis.summary.total_opportunities}</p>
                <p className="text-xs text-slate-500">Opportunités</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/30">
                <p className="text-lg font-bold text-white">{nicheAnalysis.summary.avg_trending_score}</p>
                <p className="text-xs text-slate-500">Score Tendance</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/30">
                <p className="text-lg font-bold text-white">{(nicheAnalysis.summary.total_potential_reach / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500">Portée Potentielle</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-800/30">
                <p className="text-lg font-bold text-emerald-400">{nicheAnalysis.summary.low_competition_count}</p>
                <p className="text-xs text-slate-500">Faible Compétition</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-1">
        {[
          { id: 'opportunities', label: 'Opportunités de Contenu', icon: Newspaper },
          { id: 'segments', label: 'Segments Micro-SaaS', icon: Layers },
          { id: 'weaknesses', label: 'Faiblesses Concurrents', icon: AlertTriangle },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === t.id ? 'text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'
          }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'opportunities' && (
        <div className="grid gap-3">
          {filteredAudits.map(audit => {
            const Icon = TYPE_ICONS[audit.opportunity_type] || Newspaper;
            return (
              <div key={audit.id} className="glass rounded-xl p-4 flex items-center gap-4 card-hover">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{audit.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${COMP_COLORS[audit.competition_level]}15`, color: COMP_COLORS[audit.competition_level] }}>
                      {audit.competition_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{audit.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-400">{TYPE_LABELS[audit.opportunity_type]}</span>
                    <span className="text-xs text-slate-400">Portée: {(audit.potential_reach / 1000).toFixed(0)}K</span>
                    <span className="text-xs text-slate-400">Source: {audit.source}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-indigo-400">{audit.trending_score}</p>
                  <p className="text-[10px] text-slate-500">Trending</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'segments' && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Score Opportunité par Segment</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentChartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="Score Opportunité" fill="#6366f1" radius={[0, 6, 6, 0]} />
                <Bar dataKey="Besoin Mindshare" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Segment Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((seg, i) => (
              <div key={seg.id} className="glass rounded-xl p-5 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-lg gradient-maas flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    seg.ad_budget_level === 'très faible' ? 'bg-cyan-500/10 text-cyan-400' :
                    seg.ad_budget_level === 'faible' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    Budget pub: {seg.ad_budget_level}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{seg.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{seg.description}</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-1.5 rounded-lg bg-slate-800/30">
                    <p className="text-sm font-bold text-indigo-400">{seg.mindshare_need}</p>
                    <p className="text-[10px] text-slate-500">Besoin MS</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-slate-800/30">
                    <p className="text-sm font-bold text-cyan-400">{seg.growth_rate}%</p>
                    <p className="text-[10px] text-slate-500">Croissance</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-slate-800/30">
                    <p className="text-sm font-bold text-emerald-400">{seg.market_size}</p>
                    <p className="text-[10px] text-slate-500">Marché</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Ex: {seg.example_tools}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'weaknesses' && (
        <div className="space-y-3">
          {weaknesses.map(w => (
            <div key={w.id} className="glass rounded-xl p-5 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white">{w.weakness}</p>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">
                      Sévérité: {w.severity}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{w.agency_type}</p>
                  <p className="text-xs text-slate-300 mt-2">{w.description}</p>
                  <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Solution MaaS</span>
                    </div>
                    <p className="text-xs text-slate-300">{w.maas_solution}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                    background: `conic-gradient(#ef4444 ${w.severity * 10}%, #1e293b ${w.severity * 10}%)`
                  }}>
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-red-400">{w.severity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

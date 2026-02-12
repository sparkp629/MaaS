import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import MindshareGauge from '../components/MindshareGauge';
import { NETWORKS } from '../components/NetworkIcons';
import { TrendingUp, Users, Eye, Target, Award, Zap, BarChart3, ArrowUpRight, Shield, Sparkles, Search, Rocket } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PLATFORMS = ['twitter', 'linkedin', 'youtube', 'newsletter', 'twitch'];

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 card-hover`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5" />
        <ArrowUpRight className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

const PERIODS = [
  { id: 'daily', label: '14 jours' },
  { id: 'weekly', label: '12 semaines' },
  { id: 'monthly', label: '12 mois' },
];

function aggregateByPeriod(history, periodId) {
  if (!history?.length) return [];
  if (periodId === 'daily') {
    return history.slice(-14).map(h => ({
      date: h.date.split('-').slice(1).join('/'),
      index: h.mindshare_index,
      twitter: h.breakdown?.twitter?.score || 0,
      linkedin: h.breakdown?.linkedin?.score || 0,
      newsletter: h.breakdown?.newsletter?.score || 0,
    }));
  }
  if (periodId === 'weekly') {
    const byWeek = {};
    history.forEach(h => {
      const d = new Date(h.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!byWeek[key]) byWeek[key] = { index: [], twitter: [], linkedin: [], newsletter: [] };
      byWeek[key].index.push(h.mindshare_index);
      byWeek[key].twitter.push(h.breakdown?.twitter?.score || 0);
      byWeek[key].linkedin.push(h.breakdown?.linkedin?.score || 0);
      byWeek[key].newsletter.push(h.breakdown?.newsletter?.score || 0);
    });
    return Object.entries(byWeek)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, v]) => ({
        date: key.split('-').slice(1).join('/'),
        index: Math.round((v.index.reduce((a, b) => a + b, 0) / v.index.length) * 10) / 10,
        twitter: Math.round((v.twitter.reduce((a, b) => a + b, 0) / v.twitter.length) * 10) / 10,
        linkedin: Math.round((v.linkedin.reduce((a, b) => a + b, 0) / (v.linkedin.length || 1)) * 10) / 10,
        newsletter: Math.round((v.newsletter.reduce((a, b) => a + b, 0) / v.newsletter.length) * 10) / 10,
      }));
  }
  if (periodId === 'monthly') {
    const byMonth = {};
    history.forEach(h => {
      const key = h.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { index: [], twitter: [], linkedin: [], newsletter: [] };
      byMonth[key].index.push(h.mindshare_index);
      byMonth[key].twitter.push(h.breakdown?.twitter?.score || 0);
      byMonth[key].linkedin.push(h.breakdown?.linkedin?.score || 0);
      byMonth[key].newsletter.push(h.breakdown?.newsletter?.score || 0);
    });
    return Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, v]) => ({
        date: key,
        index: Math.round((v.index.reduce((a, b) => a + b, 0) / v.index.length) * 10) / 10,
        twitter: Math.round((v.twitter.reduce((a, b) => a + b, 0) / v.twitter.length) * 10) / 10,
        linkedin: Math.round((v.linkedin.reduce((a, b) => a + b, 0) / (v.linkedin.length || 1)) * 10) / 10,
        newsletter: Math.round((v.newsletter.reduce((a, b) => a + b, 0) / v.newsletter.length) * 10) / 10,
      }));
  }
  return [];
}

function uniqById(arr) {
  const seen = new Set();
  return (arr || []).filter(x => {
    const id = x.id ?? x;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [mindshareData, setMindshareData] = useState(null);
  const [offer, setOffer] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [topContent, setTopContent] = useState(null);
  const [kolsByEngagement, setKolsByEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('daily');
  const [contentPlatform, setContentPlatform] = useState('twitter');

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getMindshare(1),
      api.getOffer(),
      api.getAnalysisLatest(),
      api.getTopContent(),
      api.getKolsByEngagement(),
    ]).then(([d, m, o, a, t, k]) => {
      setData(d);
      setMindshareData(m);
      setOffer(o);
      setAnalysis(a?.analysis);
      setTopContent(t);
      setKolsByEngagement(k?.kols || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-400">Erreur de chargement</p>;

  const { overview, campaigns, mindshare_latest } = data;
  const topKols = uniqById(data.top_kols || []);
  const uniqueCampaigns = uniqById(campaigns || []);
  const chartData = aggregateByPeriod(mindshareData?.history || [], chartPeriod);
  const latestMI = mindshareData?.latest;

  const platformContent = topContent?.by_platform?.[contentPlatform]?.[0] || topContent?.content?.[0];
  const preview280 = platformContent?.content_preview?.slice(0, 280) || 'Aucun contenu à fort engagement pour cette plateforme.';
  const thumbnail = platformContent?.thumbnail_url;
  const contentUrl = platformContent?.content_url;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard MaaS</h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de votre Mindshare-as-a-Service</p>
        </div>
        <div className="flex gap-2">
          <Link to="/market" className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-indigo-500/30 text-sm">
            <Search className="w-4 h-4 inline mr-2" /> Audit Marché
          </Link>
          <Link to="/kols" className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-indigo-500/30 text-sm">
            <Users className="w-4 h-4 inline mr-2" /> KOL Scoring
          </Link>
          <Link to="/campaigns" className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-indigo-500/30 text-sm">
            <Rocket className="w-4 h-4 inline mr-2" /> Campagnes
          </Link>
          <Link to="/roi" className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-indigo-500/30 text-sm">
            <TrendingUp className="w-4 h-4 inline mr-2" /> ROI Client
          </Link>
        </div>
      </div>

      {/* Analyse SaaS + justifications canaux */}
      {analysis && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
          <h3 className="uppercase tracking-wider mb-4 text-slate-400 font-medium">Analyse de votre SaaS & canaux recommandés</h3>
          <p className="text-slate-300 mb-3"><strong>{analysis.niche}</strong> — {analysis.saas_type} · {analysis.nature}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(analysis.channel_justifications && typeof analysis.channel_justifications === 'object'
              ? Object.entries(analysis.channel_justifications)
              : []
            ).map(([chan, why]) => (
              <div key={chan} className="p-3 rounded-lg bg-slate-800/30 text-sm">
                <p className="text-indigo-400 font-medium capitalize">{chan}</p>
                <p className="text-slate-400">{why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - violet remplacé par cyan (données API peu coûteuses) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="KOLs Scorés" value={overview.total_kols} color="indigo" />
        <StatCard icon={Zap} label="Campagnes Actives" value={overview.active_campaigns} color="cyan" />
        <StatCard icon={Eye} label="Impressions Totales" value={`${(overview.total_impressions / 1000).toFixed(0)}K`} color="cyan" />
        <StatCard icon={Target} label="Valeur pub. estimée" value={`${Math.round(overview.total_impressions / 1000 * 8)}€`} sub="~8€/1K impr. (X CPM)" color="emerald" />
        <StatCard icon={TrendingUp} label="ROI Moyen" value={`${overview.avg_roi}%`} sub="+45% vs agences trad." color="amber" />
      </div>

      {/* Section aperçu contenu à fort engagement : switch plateformes + 280 chars / miniature + Générer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="uppercase tracking-wider text-slate-400 font-medium">Contenus à fort engagement — inspirez-vous</h3>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => setContentPlatform(p)}
                className={`p-2 rounded-lg transition-colors ${contentPlatform === p ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                title={NETWORKS[p]?.name}
              >
                <span
                  className="inline-flex w-8 h-8 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: NETWORKS[p]?.color || '#64748b' }}
                >
                  {NETWORKS[p]?.icon}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {preview280}
                {preview280.length >= 280 && '…'}
              </p>
              {(contentPlatform === 'youtube' && thumbnail) && (
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full max-w-xs aspect-video rounded-xl overflow-hidden bg-slate-800"
                >
                  <img src={thumbnail} alt="Vidéo YouTube" className="w-full h-full object-cover" />
                </a>
              )}
            </div>
            <div className="flex items-center">
              <button disabled className="px-8 py-3 rounded-xl bg-slate-700 text-slate-500 cursor-not-allowed font-medium">
                Générer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KOLs par engagement + Mindshare Index avec icônes réseaux */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-slate-400 uppercase tracking-wider mb-4 font-medium">Mindshare Index</h3>
          {latestMI && (
            <>
              <MindshareGauge score={latestMI.mindshare_index} level={latestMI.level} size="lg" />
              <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                {Object.entries(latestMI.breakdown || {}).map(([key, val]) => (
                  <div key={key} className="text-center p-2 rounded-lg bg-slate-800/30 flex flex-col items-center gap-1">
                    <span
                      className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: NETWORKS[key]?.color || NETWORKS.newsletter?.color || '#8B5CF6' }}
                    >
                      {key.slice(0, 1).toUpperCase()}
                    </span>
                    <p className="text-slate-500 capitalize text-xs">{key}</p>
                    <p className="font-semibold text-white">{val.score}</p>
                    <p className="text-[10px] text-slate-600">{val.weight}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="uppercase tracking-wider text-slate-400 font-medium">Évolution du Mindshare Index</h3>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setChartPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${chartPeriod === p.id ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }} />
              <Area type="monotone" dataKey="index" stroke="#6366f1" fill="url(#gIndex)" strokeWidth={2} name="Mindshare Index" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top KOLs par engagement + Campagnes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="uppercase tracking-wider mb-4 font-medium flex items-center gap-2 text-slate-400">
            <Award className="w-4 h-4" /> Top KOLs par engagement
          </h3>
          <div className="space-y-3">
            {(kolsByEngagement.length ? kolsByEngagement : topKols).slice(0, 5).map((kol, i) => (
              <div key={kol.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <span className="w-7 h-7 rounded-full gradient-maas flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{kol.name}</p>
                  <p className="text-xs text-slate-500">{kol.handle} · {kol.platform} · {kol.followers?.toLocaleString()} followers</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-400">{kol.top_engagement?.toFixed(1) ?? kol.score ?? kol.compatibility_score}%</p>
                  <p className="text-[10px] text-slate-500">engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="uppercase tracking-wider mb-4 font-medium flex items-center gap-2 text-slate-400">
            <BarChart3 className="w-4 h-4" /> Campagnes Actives
          </h3>
          <div className="space-y-3">
            {uniqueCampaigns.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{c.product}</p>
                    <p className="text-xs text-slate-500">{c.client}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                    {c.status === 'active' ? 'Active' : 'Brouillon'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500">Impressions</p>
                    <p className="font-semibold text-white">{(c.impressions / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500">Val. pub.</p>
                    <p className="font-semibold text-white">~{Math.round(c.impressions / 1000 * 8)}€</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500">ROI</p>
                    <p className="font-semibold text-emerald-400">+{c.roi}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offre irrésistible */}
      {offer && (
        <div className="relative overflow-hidden rounded-2xl gradient-maas p-[1px]">
          <div className="bg-slate-950 rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl gradient-maas flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{offer.title}</h2>
                <p className="text-slate-400 mt-1">{offer.subtitle}</p>
                <p className="text-xs text-emerald-400/90 mt-1 font-medium">Paiement unique · 10 000€ – 50 000€+</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
              <p className="text-amber-400 font-medium">{offer.urgency?.message}</p>
              <p className="text-xs text-slate-500 mt-1">{offer.urgency?.social_proof}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {offer.pricing_model?.tiers?.map((tier) => (
                <div key={tier.name} className={`rounded-xl p-5 ${tier.featured ? 'bg-indigo-500/10 border-2 border-indigo-500/30 relative' : 'bg-slate-800/30 border border-slate-700/30'}`}>
                  {tier.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-xs font-bold text-white">Populaire</span>
                  )}
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <p className="text-xl text-indigo-400 font-bold mt-1">{tier.price_display}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Paiement unique</p>
                  <p className="text-xs text-slate-500 mt-1">{tier.best_for}</p>
                  <ul className="mt-3 space-y-1.5">
                    {tier.includes?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Shield className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/checkout?tier=${encodeURIComponent(tier.name)}&price=${tier.price}`} className="mt-4 block w-full text-center px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium text-sm transition-colors">
                    Choisir {tier.name}
                  </Link>
                </div>
              ))}
            </div>

            {offer.niche_comparisons && (
              <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 mb-6">
                <h3 className="uppercase tracking-wider mb-3 text-slate-400 font-medium">MaaS vs services traditionnels — par niche</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(offer.niche_comparisons).filter(([k]) => k !== 'default').slice(0, 4).map(([niche, d]) => (
                    <div key={niche} className="p-3 rounded-lg bg-slate-900/50 text-xs">
                      <p className="font-semibold text-white mb-2">{niche}</p>
                      <p className="text-slate-400">Agence trad. ~{(d.traditional_cost_annual / 1000).toFixed(0)}k€/an</p>
                      <p className="text-emerald-400">MaaS : -{d.maas_savings_pct}% coût</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {offer.guarantees?.map((g, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">{g}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

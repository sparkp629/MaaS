import { useState, useEffect, useMemo } from 'react';
import { Users, ExternalLink, Sparkles, Lock, ChevronDown, Eye, MousePointerClick, ArrowUpRight, ArrowDownRight, TrendingUp, Lightbulb, Megaphone, CalendarClock } from 'lucide-react';
import { api } from '../api';
import NetworkIcon, { NETWORKS } from '../components/NetworkIcons';
import MindshareGauge from '../components/MindshareGauge';

// --- Time period selector ---
const PERIODS = [
  { key: '24h', label: '24h' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annually', label: 'Annually' },
];

function PeriodSelector({ active, onChange, apiStatus }) {
  return (
    <div className="flex bg-slate-800/50 rounded-lg p-0.5">
      {PERIODS.map((p) => {
        const isPremium = p.key === 'monthly' || p.key === 'annually';
        const disabled = isPremium && !apiStatus?.premium;
        return (
          <button
            key={p.key}
            onClick={() => !disabled && onChange(p.key)}
            disabled={disabled}
            title={disabled ? 'Available in Premium plan' : ''}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              active === p.key
                ? 'bg-indigo-500/20 text-indigo-300'
                : disabled
                ? 'text-slate-600 cursor-not-allowed opacity-60'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Trend metric card (numbers + arrows, no progress bars) ---
function TrendCard({ label, value, change, icon: Icon, color = 'indigo' }) {
  const isUp = change > 0;
  const changeColor = isUp ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-500';
  const ArrowIcon = isUp ? ArrowUpRight : ArrowDownRight;
  const colorBg = {
    indigo: 'from-indigo-500/8 to-indigo-500/3 border-indigo-500/15',
    emerald: 'from-emerald-500/8 to-emerald-500/3 border-emerald-500/15',
    amber: 'from-amber-500/8 to-amber-500/3 border-amber-500/15',
    cyan: 'from-cyan-500/8 to-cyan-500/3 border-cyan-500/15',
  };

  return (
    <div className={`bg-gradient-to-br ${colorBg[color]} border rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${changeColor}`}>
          <ArrowIcon className="w-3 h-3" />
          {Math.abs(change)}% vs prev.
        </div>
      )}
    </div>
  );
}

// --- Network filter icons (explicit sizes) ---
const NETWORK_FILTERS = ['twitter', 'youtube', 'linkedin', 'newsletter', 'tiktok', 'instagram'];

function NetworkFilters({ active, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          !active ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
      >
        All
      </button>
      {NETWORK_FILTERS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(active === n ? null : n)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
            active === n
              ? 'ring-2 ring-indigo-500/50 bg-slate-800/80 scale-110'
              : 'hover:bg-slate-800/50 opacity-60 hover:opacity-100'
          }`}
          title={NETWORKS[n]?.name}
        >
          <NetworkIcon network={n} size="md" />
        </button>
      ))}
    </div>
  );
}

function getChannelStatus(apiStatus, network) {
  const mapping = {
    twitter: apiStatus?.x,
    youtube: apiStatus?.youtube,
    linkedin: apiStatus?.linkedin,
    newsletter: true,
    tiktok: apiStatus?.tiktok,
    instagram: apiStatus?.meta,
  };
  return Boolean(mapping[network]);
}

function buildInsights(kols, apiStatus) {
  const networkWeights = { twitter: 3, youtube: 4, linkedin: 2 };
  const opportunities = [];

  (kols || []).forEach((kol) => {
    const previews = kol.previews || {};
    ['twitter', 'youtube', 'linkedin'].forEach((network) => {
      if (!previews[network]) return;
      const scoreBase = (kol.conversionScore || 0) * 0.6 + (kol.mindshareIndex || 0) * 0.4;
      opportunities.push({
        id: `${kol.id}-${network}`,
        network,
        available: getChannelStatus(apiStatus, network),
        kolName: kol.displayName,
        niche: kol.niche,
        score: Math.round(scoreBase + (networkWeights[network] || 0)),
        text: previews[network].text || `${kol.displayName} • ${kol.niche}`,
      });
    });
  });

  const ranked = opportunities.sort((a, b) => b.score - a.score);
  const best = ranked[0] || null;
  const bestAvailable = ranked.find((item) => item.available) || null;
  const channel = bestAvailable?.network || best?.network || 'newsletter';
  const topicFromText = best?.text?.split(/[.!?]/)?.[0]?.trim();

  const nextActionByChannel = {
    twitter: 'Publier un thread preuve sociale + CTA démo sous 48h.',
    youtube: 'Publier une vidéo courte orientée cas client cette semaine.',
    linkedin: 'Publier un post expert + preuve chiffrée avant fin de semaine.',
    newsletter: 'Envoyer un email “avant/après levée” avec un CTA audit.',
  };

  return {
    topContents: ranked.slice(0, 5),
    actionPlan: {
      subject: topicFromText || 'Angle fondateur + preuve de traction avant/apres levee',
      channel,
      nextAction: nextActionByChannel[channel] || 'Lancer un test de contenu sur le canal prioritaire.',
      confidence: bestAvailable ? 'Elevee' : 'Moyenne',
    },
  };
}

function ActionPlanSection({ plan }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <h3 className="text-sm font-medium text-indigo-400 mb-3">Plan d'action media (7 jours)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            Sujet prioritaire
          </div>
          <p className="text-sm text-white leading-relaxed">{plan.subject}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            Canal recommande
          </div>
          <div className="flex items-center gap-2">
            <NetworkIcon network={plan.channel} size="sm" />
            <span className="text-sm text-white">{NETWORKS[plan.channel]?.name || plan.channel}</span>
          </div>
          <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs ${
            plan.confidence === 'Elevee'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            Confiance {plan.confidence}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CalendarClock className="w-3.5 h-3.5" />
            Prochaine action
          </div>
          <p className="text-sm text-white leading-relaxed">{plan.nextAction}</p>
        </div>
      </div>
    </div>
  );
}

function TopContentSection({ topContents }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <h3 className="text-sm font-medium text-indigo-400 mb-3">Contenus qui performent le mieux</h3>
      {topContents.length > 0 ? (
        <div className="space-y-2">
          {topContents.map((content) => (
            <div
              key={content.id}
              className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm text-white truncate">
                  {content.kolName} • {content.niche}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{content.text}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <NetworkIcon network={content.network} size="sm" />
                  <span className="text-xs text-slate-300">{NETWORKS[content.network]?.name || content.network}</span>
                </div>
                <div className="text-xs text-indigo-300 mt-1">Score {content.score}</div>
                {!content.available && (
                  <div className="text-[11px] text-amber-400 mt-1">Coming soon</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">Coming soon</p>
      )}
    </div>
  );
}

function ChannelAvailabilitySection({ apiStatus }) {
  const channels = ['twitter', 'youtube', 'linkedin', 'newsletter', 'tiktok', 'instagram'];
  return (
    <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <h3 className="text-sm font-medium text-indigo-400 mb-3">Etat des canaux de donnees</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {channels.map((channel) => {
          const isReady = getChannelStatus(apiStatus, channel);
          return (
            <div key={channel} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <NetworkIcon network={channel} size="sm" />
                <span className="text-xs text-slate-200 truncate">{NETWORKS[channel]?.name || channel}</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                isReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {isReady ? 'Actif' : 'Coming soon'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- KOL Card with network content ---
function KOLCard({ kol, activeNetwork }) {
  const p = kol.previews || {};

  function getContentForNetwork(net) {
    switch (net) {
      case 'twitter': return p.twitter ? (
        <a href={`https://x.com/${kol.handle?.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
           className="block p-3 rounded-xl bg-slate-900/60 border border-slate-600/30 hover:border-slate-500/50 transition-colors cursor-pointer group">
          <div className="flex gap-3">
            <img src={p.twitter.avatarUrl || kol.avatarUrl} alt="" className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm leading-relaxed line-clamp-4">{p.twitter.text}</p>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 group-hover:text-indigo-400">
                View on X <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </a>
      ) : null;
      case 'youtube': return p.youtube ? (
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
           className="block rounded-xl overflow-hidden bg-slate-900/60 border border-slate-600/30 hover:border-slate-500/50 transition-colors cursor-pointer group">
          {/* Enlarged YouTube thumbnail */}
          <div className="aspect-video bg-slate-700 relative w-full min-h-[200px]">
            {p.youtube.thumbnailUrl ? (
              <img src={p.youtube.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-500 text-5xl">▶</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Watch on YouTube</span>
            </div>
          </div>
          <div className="p-3 flex gap-2">
            {p.youtube.avatarUrl && <img src={p.youtube.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />}
            <div>
              <p className="text-slate-300 text-sm">{kol.displayName} &mdash; {kol.niche}</p>
              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-red-400">
                YouTube <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </a>
      ) : null;
      case 'linkedin': return p.linkedin ? (
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
           className="block p-3 rounded-xl bg-slate-800/50 border border-slate-600/30 hover:border-[#0A66C2]/40 transition-colors cursor-pointer group">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded bg-[#0A66C2]/30 shrink-0 flex items-center justify-center">
              <span className="text-[#0A66C2] text-xs font-bold">in</span>
            </div>
            <div>
              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{p.linkedin.text}</p>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 group-hover:text-[#0A66C2]">
                View on LinkedIn <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </a>
      ) : null;
      default: return null;
    }
  }

  const defaultContent = p.youtube ? getContentForNetwork('youtube')
    : p.twitter ? getContentForNetwork('twitter')
    : p.linkedin ? getContentForNetwork('linkedin')
    : null;

  const networkContent = activeNetwork ? getContentForNetwork(activeNetwork) : defaultContent;

  return (
    <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex gap-5">
        {/* Left: KOL info + concrete metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            {kol.avatarUrl && (
              <img src={kol.avatarUrl} alt="" className="w-12 h-12 rounded-full border border-slate-600" />
            )}
            <div>
              <div className="font-medium text-white">{kol.displayName}</div>
              <div className="text-sm text-slate-400">{kol.handle} &mdash; {kol.niche}</div>
            </div>
            {kol.isMicroKOL && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">Micro-KOL</span>
            )}
          </div>

          {/* Concrete metrics — numbers with trends, NOT progress bars */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/40">
              <span className="text-slate-500 block">Followers</span>
              <span className="text-white font-semibold text-sm">{(kol.followers || 0).toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/40">
              <span className="text-slate-500 block">Mindshare</span>
              <span className="text-indigo-400 font-semibold text-sm">{kol.mindshareIndex ?? 0}/100</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/40">
              <span className="text-slate-500 block">Conv. Score</span>
              <span className="text-emerald-400 font-semibold text-sm">{kol.conversionScore ?? 0}/100</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/40">
              <span className="text-slate-500 block">Eng. Rate</span>
              <span className="text-amber-400 font-semibold text-sm">{kol.engagementRate ?? '—'}</span>
            </div>
          </div>

          {Array.isArray(kol.externalLinks) && kol.externalLinks.length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-slate-900/40">
              <span className="text-slate-500 block text-xs mb-1">Liens profil détectés</span>
              <div className="flex flex-wrap gap-1.5">
                {kol.externalLinks.slice(0, 3).map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-300 hover:text-indigo-200 underline underline-offset-2 break-all"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: network content preview (enlarged) */}
        <div className="w-[400px] shrink-0">
          {networkContent || (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm p-4 border border-dashed border-slate-700/50 rounded-xl">
              Coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Intelligence : chiffres concrets + flèches tendances (PAS de barres %) ---
function IntelligenceSection({ segments, competitors, roi, period }) {
  const periodLabel = { '24h': '24h', weekly: '7d', monthly: '30d', annually: '1y' }[period] || '';

  return (
    <div className="space-y-4">
      {/* Row 1: big metrics with trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TrendCard label="Clicks" value={(roi?.clicks ?? 0).toLocaleString()} change={roi?.clicksChange ?? null} icon={MousePointerClick} color="emerald" />
        <TrendCard label="Impressions" value={(roi?.impressions ?? 0).toLocaleString()} change={roi?.impressionsChange ?? null} icon={Eye} color="cyan" />
        <TrendCard label="Mindshare Growth" value={`${roi?.mindshareGrowth ?? 0}pts`} change={roi?.mindshareGrowthChange ?? null} icon={TrendingUp} color="indigo" />
        <TrendCard label="Spend" value={`${roi?.spend ?? 0} EUR`} change={null} icon={null} color="amber" />
      </div>

      {/* Row 2: segments + competitors as data tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-3">High-demand segments</h3>
          {segments?.length > 0 ? (
            <div className="space-y-1.5">
              {segments.map((s) => (
                <div key={s.id || s.name} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300 text-sm">{s.name}</span>
                  <span className={`text-sm font-semibold ${
                    s.demand >= 70 ? 'text-emerald-400' : s.demand >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {s.demand}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Aucune donnée réelle disponible</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-3">Competitor weaknesses</h3>
          {competitors?.length > 0 ? (
            <div className="space-y-1.5">
              {competitors.map((c) => {
                const dims = c.dimensions || {};
                return (
                  <div key={c.competitorId || c.name} className="py-1.5 border-b border-slate-800/50 last:border-0">
                    <div className="text-slate-300 text-sm font-medium mb-1">{c.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(dims).map(([dim, val]) => (
                        <span key={dim} className={`px-1.5 py-0.5 rounded text-xs ${
                          val >= 70 ? 'bg-emerald-500/10 text-emerald-400' : val >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {dim}: {val}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Coming soon</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [kols, setKols] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [roi, setRoi] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [showMore, setShowMore] = useState(false);
  const [countryFilter, setCountryFilter] = useState([]);
  const [sortBy, setSortBy] = useState('influence');

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getKOLs(),
      api.getIntelligence(),
      api.getRoi(),
      api.getApiStatus(),
    ])
      .then(([d, k, i, r, status]) => { setData(d); setKols(k || []); setIntelligence(i); setRoi(r); setApiStatus(status || null); })
      .catch(() => {
        setData({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } });
        setApiStatus(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const insights = useMemo(() => buildInsights(kols, apiStatus), [kols, apiStatus]);
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  const visibleKols = showMore ? kols.slice(0, 10) : kols.slice(0, 5);
  const hasMore = kols.length > 5 && !showMore;
  // derive countries from KOLs
  const countries = useMemo(() => {
    const set = new Set();
    (kols || []).forEach((k) => { if (k.country) set.add(k.country); });
    return Array.from(set).sort();
  }, [kols]);

  // apply country filter and sorting
  const filteredKols = useMemo(() => {
    let list = kols || [];
    if (countryFilter.length > 0) {
      list = list.filter((k) => countryFilter.includes(k.country));
    }
    if (sortBy === 'influence') {
      list = list.slice().sort((a, b) => {
        const ai = (a.mindshareIndex || 0) + (a.conversionScore || 0);
        const bi = (b.mindshareIndex || 0) + (b.conversionScore || 0);
        return bi - ai;
      });
    } else if (sortBy === 'followers') {
      list = list.slice().sort((a, b) => (b.followers || 0) - (a.followers || 0));
    }
    return list;
  }, [kols, countryFilter, sortBy]);

  const visibleFilteredKols = showMore ? filteredKols.slice(0, 10) : filteredKols.slice(0, 5);
  const hasMoreFiltered = filteredKols.length > (showMore ? 10 : 5) && !showMore;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <PeriodSelector active={period} onChange={setPeriod} apiStatus={apiStatus} />
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TrendCard label="KOLs Tracked" value={data?.kolCount ?? 0} change={null} icon={Users} color="indigo" />
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 flex items-center gap-3">
          <MindshareGauge value={data?.mindshare?.value ?? 0} level={data?.mindshare?.level ?? 'Invisible'} size="sm" />
          <div>
            <div className="text-slate-400 text-xs">Eng. {period === '24h' ? '24h' : period === 'weekly' ? '7d' : period === 'monthly' ? '30d' : '1y'}</div>
            <div className="text-white font-bold text-lg">{data?.mindshare?.value ?? 0}</div>
            <div className="text-xs text-slate-500">{data?.mindshare?.level}</div>
          </div>
        </div>
        <TrendCard label="Clicks" value={(roi?.clicks ?? 0).toLocaleString()} change={roi?.clicksChange ?? null} icon={MousePointerClick} color="emerald" />
        <TrendCard label="Impressions" value={(roi?.impressions ?? 0).toLocaleString()} change={roi?.impressionsChange ?? null} icon={Eye} color="cyan" />
      </div>

      {/* Network filter + title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-slate-300">KOL Discovery</h2>
          <div className="text-[13px] text-slate-400">Filter by country:</div>
          <div className="flex items-center gap-2">
            {countries.length > 0 ? (
              countries.map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" className="accent-indigo-500" value={c} checked={countryFilter.includes(c)} onChange={(e) => {
                    const val = e.target.value;
                    setCountryFilter((prev) => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                  }} />
                  {c}
                </label>
              ))
            ) : (
              <span className="text-xs text-slate-500">Coming soon</span>
            )}
          </div>
          <div className="ml-4 text-xs text-slate-400">Sort:</div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs bg-slate-800/40 rounded-md px-2 py-1">
            <option value="influence">Influence / Relevance</option>
            <option value="followers">Followers</option>
          </select>
        </div>
        <NetworkFilters active={activeNetwork} onChange={setActiveNetwork} />
      </div>

      <ActionPlanSection plan={insights.actionPlan} />
      <TopContentSection topContents={insights.topContents} />
      <ChannelAvailabilitySection apiStatus={apiStatus} />

      {/* KOL cards — top 5, then "More" for next 5 */}
      {visibleFilteredKols.length > 0 ? (
        <div className="space-y-4">
          {visibleFilteredKols.map((k) => (
            <KOLCard key={k.id} kol={k} activeNetwork={activeNetwork} />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm p-6 text-center border border-dashed border-slate-700/50 rounded-xl">
          Coming soon
        </div>
      )}
      {hasMoreFiltered && (
        <button
          onClick={() => setShowMore(true)}
          className="w-full py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" />
          Show more KOLs ({filteredKols.length - (showMore ? 10 : 5)} remaining)
        </button>
      )}

      {/* Magic Button — just the button, flush under KOL content */}
      <button
        disabled
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
      >
        <Sparkles className="w-4 h-4" />
        <Lock className="w-3 h-3" />
        Generate AI Content &mdash; Coming soon
      </button>

      {/* Intelligence + ROI unified — concrete numbers, NOT progress bars */}
      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Market Intelligence &amp; ROI</h2>
        <IntelligenceSection
          segments={intelligence?.segments}
          competitors={intelligence?.competitors}
          roi={roi}
          period={period}
        />
      </div>
    </div>
  );
}

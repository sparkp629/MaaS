import { useState, useEffect } from 'react';
import { Users, BarChart3, TrendingUp, ExternalLink, Sparkles, Lock } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import NetworkIcon, { NETWORKS } from '../components/NetworkIcons';
import MindshareGauge from '../components/MindshareGauge';

// --- Metric Bar (colored progress) ---
function MetricBar({ label, value, max = 100, color = 'indigo' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = {
    indigo: { bar: 'bg-indigo-500', text: 'text-indigo-400' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400' },
    cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400' },
    red: { bar: 'bg-red-500', text: 'text-red-400' },
  };
  const c = colorMap[color] || colorMap.indigo;
  const level = pct >= 70 ? 'emerald' : pct >= 40 ? 'amber' : 'red';
  const levelBar = colorMap[level].bar;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={c.text}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${levelBar} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// --- Stat Card compact ---
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// --- Network filter icons ---
const NETWORK_FILTERS = ['twitter', 'youtube', 'linkedin', 'newsletter', 'tiktok', 'instagram'];

function NetworkFilters({ active, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          !active ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
      >
        All
      </button>
      {NETWORK_FILTERS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(active === n ? null : n)}
          className={`p-1.5 rounded-lg transition-all ${
            active === n
              ? 'ring-2 ring-indigo-500/50 bg-slate-800/80 scale-110'
              : 'hover:bg-slate-800/50 opacity-60 hover:opacity-100'
          }`}
          title={NETWORKS[n]?.name}
        >
          <NetworkIcon network={n} size="sm" />
        </button>
      ))}
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
           className="block rounded-xl overflow-hidden bg-slate-900/60 border border-slate-600/30 hover:border-slate-500/50 transition-colors cursor-pointer group max-w-sm">
          <div className="aspect-video bg-slate-700 relative">
            {p.youtube.thumbnailUrl ? (
              <img src={p.youtube.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-500 text-4xl">▶</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium">Watch on YouTube</span>
            </div>
          </div>
          <div className="p-3 flex gap-2">
            {p.youtube.avatarUrl && <img src={p.youtube.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />}
            <div>
              <p className="text-slate-300 text-sm">{kol.displayName} — {kol.niche}</p>
              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-red-400">
                YouTube <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </a>
      ) : null;
      case 'linkedin': return p.linkedin ? (
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
           className="block p-3 rounded-xl bg-slate-800/50 border border-slate-600/30 hover:border-[#0A66C2]/40 transition-colors cursor-pointer group max-w-md">
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

  // Default: show YouTube content if available, else first available
  const defaultContent = p.youtube ? getContentForNetwork('youtube')
    : p.twitter ? getContentForNetwork('twitter')
    : p.linkedin ? getContentForNetwork('linkedin')
    : null;

  const networkContent = activeNetwork ? getContentForNetwork(activeNetwork) : defaultContent;

  return (
    <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex gap-5">
        {/* Left: KOL info + metrics */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            {kol.avatarUrl && (
              <img src={kol.avatarUrl} alt="" className="w-12 h-12 rounded-full border border-slate-600" />
            )}
            <div>
              <div className="font-medium text-white">{kol.displayName}</div>
              <div className="text-sm text-slate-400">{kol.handle} — {kol.niche}</div>
            </div>
          </div>

          {/* Metric bars */}
          <div className="space-y-2 mb-3">
            <MetricBar label="Mindshare Index" value={kol.mindshareIndex} max={100} color="indigo" />
            <MetricBar label="Conversion Score" value={kol.conversionScore} max={100} color="emerald" />
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 text-xs">
            <span className="text-slate-500">{kol.followers?.toLocaleString()} followers</span>
            {kol.isMicroKOL && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">Micro-KOL</span>
            )}
          </div>
        </div>

        {/* Right: network content preview */}
        <div className="w-80 shrink-0">
          {networkContent || (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm p-4 border border-dashed border-slate-700/50 rounded-xl">
              No content for this network
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Intelligence section (inline) ---
function IntelligenceSection({ segments, competitors }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <h3 className="text-sm font-medium text-indigo-400 mb-3">High-demand segments</h3>
        <div className="space-y-2">
          {segments?.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">{s.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.demand}%` }} />
                </div>
                <span className="text-xs text-slate-500">{s.demand}/100</span>
              </div>
            </div>
          )) ?? (
            ['Dev Tools', 'No-code', 'API-first', 'CRM niche', 'Analytics'].map((n) => (
              <div key={n} className="text-slate-400 text-sm">— {n}</div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <h3 className="text-sm font-medium text-indigo-400 mb-3">Competitor weaknesses</h3>
        {competitors?.length > 0 ? (
          <div className="space-y-2">
            {competitors.map((c) => {
              const avg = Object.values(c.dimensions || {}).reduce((a, b) => a + b, 0) / (Object.keys(c.dimensions || {}).length || 1);
              return (
                <div key={c.competitorId} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{c.name}</span>
                  <MetricBar label="" value={avg} max={100} color="amber" />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Complete the onboarding to see competitor analysis.</p>
        )}
      </div>
    </div>
  );
}

// --- ROI Section (inline) ---
function ROISection({ roi }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={TrendingUp} label="Clicks" value={roi?.clicks ?? 0} sub="Total" color="emerald" />
      <StatCard icon={BarChart3} label="Impressions" value={roi?.impressions ?? 0} sub="Total" color="cyan" />
      <StatCard icon={TrendingUp} label="Mindshare Growth" value={`${roi?.mindshareGrowth ?? 0}%`} sub="Change" color="indigo" />
      <StatCard icon={BarChart3} label="Spend" value={`${roi?.spend ?? 0} €`} sub="Budget" color="amber" />
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState(null);
  const [kols, setKols] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getKOLs(),
      api.getIntelligence(),
      api.getRoi(),
    ])
      .then(([d, k, i, r]) => { setData(d); setKols(k); setIntelligence(i); setRoi(r); })
      .catch(() => { setData({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } }); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* Top stats + Mindshare gauge */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="KOLs" value={data?.kolCount ?? 0} sub="Tracked" color="indigo" />
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 flex items-center gap-3">
          <MindshareGauge value={data?.mindshare?.value ?? 0} level={data?.mindshare?.level ?? 'Invisible'} size="sm" />
          <div>
            <div className="text-slate-400 text-xs">Mindshare Index</div>
            <div className="text-white font-bold text-lg">{data?.mindshare?.value ?? 0}</div>
            <div className="text-xs text-slate-500">{data?.mindshare?.level}</div>
          </div>
        </div>
        <StatCard icon={TrendingUp} label="Clicks" value={roi?.clicks ?? 0} sub="Total campaigns" color="emerald" />
        <StatCard icon={BarChart3} label="Impressions" value={roi?.impressions ?? 0} sub="Total campaigns" color="cyan" />
      </div>

      {/* Network filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300">KOL Discovery</h2>
        <NetworkFilters active={activeNetwork} onChange={setActiveNetwork} />
      </div>

      {/* KOL cards */}
      {kols?.length > 0 ? (
        <div className="space-y-4">
          {kols.map((k) => (
            <KOLCard key={k.id} kol={k} activeNetwork={activeNetwork} />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm p-6 text-center border border-dashed border-slate-700/50 rounded-xl">
          No KOLs tracked yet. Add KOLs via the API to start tracking.
        </div>
      )}

      {/* Intelligence inline */}
      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Market Intelligence</h2>
        <IntelligenceSection segments={intelligence?.segments} competitors={intelligence?.competitors} />
      </div>

      {/* ROI inline */}
      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-3">ROI / Attribution</h2>
        <ROISection roi={roi} />
      </div>

      {/* Magic Button — AI content suggestions (non-functional) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">AI Content Engine</h3>
            <p className="text-slate-400 text-sm mb-3">
              Generate high-impact content inspired by your competitors' top-performing posts.
              Our AI analyzes engagement patterns across X, LinkedIn, and YouTube to craft content
              that stands out in your niche.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded bg-slate-800/50 text-slate-400 text-xs">X Threads</span>
              <span className="px-2 py-1 rounded bg-slate-800/50 text-slate-400 text-xs">LinkedIn Posts</span>
              <span className="px-2 py-1 rounded bg-slate-800/50 text-slate-400 text-xs">Short Scripts</span>
              <span className="px-2 py-1 rounded bg-slate-800/50 text-slate-400 text-xs">Scheduled publishing</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs text-slate-500 mb-4">
              <p className="mb-1"><strong className="text-slate-400">Free tier includes:</strong> Mindshare audit, KOL matching, first campaign (X Thread + LinkedIn + Short), ROI tracking.</p>
              <p><strong className="text-slate-400">Upgrade to unlock:</strong> AI-generated content, unlimited campaigns, scheduled publishing across all platforms — without the complexity of Make, N8N, or managing a team on Notion.</p>
            </div>

            <button
              disabled
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium cursor-not-allowed opacity-60"
            >
              <Lock className="w-4 h-4" />
              Coming soon — Generate AI Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

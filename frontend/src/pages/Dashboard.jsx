import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  ChevronDown,
  Sparkles,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Github,
  MessageCircle,
  Send,
  Twitch,
  BadgeAlert,
} from 'lucide-react';
import { api } from '../api';
import NetworkIcon, { NETWORKS } from '../components/NetworkIcons';
import MindshareGauge from '../components/MindshareGauge';

const PERIODS = [
  { key: 'weekly', label: 'Weekly', plan: 'Free' },
  { key: 'monthly', label: 'Monthly', plan: 'Premium' },
  { key: 'annually', label: 'Annually', plan: 'Premium' },
];

const NETWORK_FILTERS = ['twitter', 'youtube', 'linkedin', 'newsletter', 'tiktok', 'instagram'];

function PeriodSelector({ active, onChange }) {
  return (
    <div className="flex bg-slate-800/60 rounded-xl p-1">
      {PERIODS.map((period) => (
        <button
          key={period.key}
          onClick={() => onChange(period.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            active === period.key ? 'bg-indigo-500/25 text-indigo-200' : 'text-slate-400 hover:text-white'
          }`}
        >
          {period.label}
          <span className="ml-1 text-[10px] opacity-80">{period.plan}</span>
        </button>
      ))}
    </div>
  );
}

function TrendCard({ label, value, change, icon: Icon }) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/35 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change !== null && change !== undefined && (
        <div className={`mt-1 text-xs flex items-center gap-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)} vs previous period
        </div>
      )}
    </div>
  );
}

function NetworkFilters({ active, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-2 rounded-lg text-xs font-medium ${
          active === null ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
        }`}
      >
        All
      </button>
      {NETWORK_FILTERS.map((network) => (
        <button
          key={network}
          onClick={() => onChange(active === network ? null : network)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
            active === network ? 'ring-2 ring-indigo-400/60 bg-slate-700/60' : 'hover:bg-slate-800/60'
          }`}
          title={NETWORKS[network]?.name}
        >
          <NetworkIcon network={network} size="md" />
        </button>
      ))}
    </div>
  );
}

function KOLCard({ kol, activeNetwork, apiStatus }) {
  const selectedNetwork = activeNetwork || kol.primaryNetwork || 'twitter';
  const preview = kol.previews?.[selectedNetwork] || null;

  const isUnavailable =
    (selectedNetwork === 'twitter' && !apiStatus?.x) ||
    (selectedNetwork === 'youtube' && !apiStatus?.youtube) ||
    (selectedNetwork === 'linkedin' && !apiStatus?.linkedin) ||
    (selectedNetwork === 'tiktok' && !apiStatus?.tiktok) ||
    (selectedNetwork === 'instagram' && !apiStatus?.meta);

  return (
    <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <img src={kol.avatarUrl} alt="" className="w-12 h-12 rounded-full border border-slate-600" />
            <div>
              <div className="font-medium text-white">{kol.displayName}</div>
              <div className="text-sm text-slate-400">{kol.handle} • {kol.country} • {kol.niche}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
            <div className="p-2 rounded-lg bg-slate-900/40"><span className="text-slate-500 block">Followers</span><span className="text-white font-semibold">{(kol.followers || 0).toLocaleString()}</span></div>
            <div className="p-2 rounded-lg bg-slate-900/40"><span className="text-slate-500 block">Mindshare</span><span className="text-indigo-400 font-semibold">{kol.mindshareIndex ?? 0}/100</span></div>
            <div className="p-2 rounded-lg bg-slate-900/40"><span className="text-slate-500 block">Conv. Score</span><span className="text-emerald-400 font-semibold">{kol.conversionScore ?? 0}/100</span></div>
            <div className="p-2 rounded-lg bg-slate-900/40"><span className="text-slate-500 block">Eng. Rate</span><span className="text-amber-400 font-semibold">{kol.engagementRate || 'Coming soon'}</span></div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-200">Subject: {kol.contentPattern?.subject || 'Coming soon'}</span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200">Format: {kol.contentPattern?.format || 'Coming soon'}</span>
            <span className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-200">Tone: {kol.contentPattern?.tone || 'Coming soon'}</span>
          </div>
        </div>

        <div className="lg:w-[390px] shrink-0 rounded-xl border border-slate-700/40 bg-slate-900/35 p-3">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <NetworkIcon network={selectedNetwork} size="sm" />
            Content preview
          </div>
          {isUnavailable ? (
            <p className="text-sm text-amber-400">Coming soon (API unavailable)</p>
          ) : preview?.status === 'censored' ? (
            <p className="text-sm text-red-400">Censored on {preview.platformLabel || NETWORKS[selectedNetwork]?.name}</p>
          ) : preview?.text ? (
            <p className="text-sm text-slate-200 leading-relaxed">{preview.text}</p>
          ) : (
            <p className="text-sm text-slate-500">Coming soon</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('weekly');
  const [activeNetwork, setActiveNetwork] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('All countries');
  const [showRedditPreview, setShowRedditPreview] = useState(false);

  const [data, setData] = useState({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } });
  const [kols, setKols] = useState([]);
  const [roi, setRoi] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [hygiene, setHygiene] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getKOLs(),
      api.getRoi(),
      api.getIntelligence(),
      api.getApiStatus(),
      api.getHygieneStatus(),
    ])
      .then(([dashboard, kolList, roiData, intel, status, hygieneStatus]) => {
        setData(dashboard || { kolCount: 0, mindshare: { value: 0, level: 'Invisible' } });
        setKols(kolList || []);
        setRoi(roiData || null);
        setIntelligence(intel || null);
        setApiStatus(status || null);
        setHygiene(hygieneStatus || null);
      })
      .catch(() => {
        setData({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } });
        setKols([]);
      });
  }, []);

  const countries = useMemo(() => ['All countries', ...new Set(kols.map((kol) => kol.country || 'Unknown'))], [kols]);

  const filteredKols = useMemo(() => {
    return kols.filter((kol) => {
      const countryOk = selectedCountry === 'All countries' || (kol.country || 'Unknown') === selectedCountry;
      const networkOk = !activeNetwork || kol.previews?.[activeNetwork];
      return countryOk && networkOk;
    });
  }, [kols, selectedCountry, activeNetwork]);

  const visibleKols = showMore ? filteredKols.slice(0, 12) : filteredKols.slice(0, 5);
  const countryCount = new Set(filteredKols.map((kol) => kol.country)).size;
  const nicheCount = new Set(filteredKols.map((kol) => kol.niche)).size;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <PeriodSelector active={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TrendCard label="KOLs Tracked" value={filteredKols.length || data?.kolCount || 0} icon={Users} />
        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/35 p-4 flex items-center gap-3">
          <MindshareGauge value={data?.mindshare?.value ?? 0} level={data?.mindshare?.level ?? 'Invisible'} size="sm" />
          <div>
            <div className="text-slate-400 text-xs">Mindshare ({period === 'weekly' ? '7d' : period === 'monthly' ? '30d' : '1y'})</div>
            <div className="text-white font-bold text-lg">{data?.mindshare?.value ?? 0}</div>
            <div className="text-xs text-slate-500">{data?.mindshare?.level}</div>
          </div>
        </div>
        <TrendCard label="Clicks" value={(roi?.clicks ?? 0).toLocaleString()} change={roi?.clicksChange} icon={MousePointerClick} />
        <TrendCard label="Impressions" value={(roi?.impressions ?? 0).toLocaleString()} change={roi?.impressionsChange} icon={Eye} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-medium text-slate-300">KOL Discovery</h2>
        <NetworkFilters active={activeNetwork} onChange={setActiveNetwork} />
      </div>

      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm text-indigo-200">
        {filteredKols.length} converting KOLs across {countryCount} countries and {nicheCount} high-intent niches.
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-slate-400">Country</label>
        <select
          className="bg-slate-800/70 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-white"
          value={selectedCountry}
          onChange={(event) => setSelectedCountry(event.target.value)}
        >
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        {hygiene?.hourlyVerification?.enabled ? (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300">
            Hourly verification active
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">Coming soon</span>
        )}
      </div>

      {visibleKols.length > 0 ? (
        <div className="space-y-4">
          {visibleKols.map((kol) => (
            <KOLCard key={kol.id} kol={kol} activeNetwork={activeNetwork} apiStatus={apiStatus} />
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm p-6 text-center border border-dashed border-slate-700/50 rounded-xl">Coming soon</div>
      )}

      {filteredKols.length > 5 && !showMore && (
        <button
          onClick={() => setShowMore(true)}
          className="w-full py-2.5 rounded-xl bg-slate-800/35 border border-slate-700/30 text-slate-300 hover:text-white text-sm flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" />
          Show more ({filteredKols.length - 5})
        </button>
      )}

      <button
        disabled
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-sm font-medium cursor-not-allowed opacity-60"
      >
        <Sparkles className="w-4 h-4" />
        <Lock className="w-3 h-3" />
        AI Content — Coming soon
      </button>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 p-4">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Social Hub</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <a href="#" className="rounded-lg px-3 py-2 bg-[#229ED9] text-white text-sm flex items-center gap-2"><Send className="w-4 h-4" /> Telegram</a>
          <button className="rounded-lg px-3 py-2 bg-[#5865F2] text-white text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Discord</button>
          <button className="rounded-lg px-3 py-2 bg-[#9146FF] text-white text-sm flex items-center gap-2"><Twitch className="w-4 h-4" /> Twitch</button>
          <button className="rounded-lg px-3 py-2 bg-slate-700 text-white text-sm flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</button>
          <button
            onClick={() => setShowRedditPreview((value) => !value)}
            className="rounded-lg px-3 py-2 bg-[#FF4500] text-white text-sm flex items-center gap-2"
          >
            <BadgeAlert className="w-4 h-4" /> Reddit
          </button>
        </div>

        {showRedditPreview && (
          <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 space-y-2">
            <p className="text-xs text-slate-400">Preview of solved high-value closed-topic discussions</p>
            <div className="text-sm text-slate-200">• Reduced CAC by 37% in 3 weeks: audience mismatch fixed with creator-topic realignment.</div>
            <div className="text-sm text-slate-200">• Churn drop from onboarding rewrite: tone changed from technical to outcome-first proof.</div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-3">Market Intelligence &amp; ROI</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <TrendCard label="Clicks" value={(roi?.clicks ?? 0).toLocaleString()} change={roi?.clicksChange} icon={MousePointerClick} />
          <TrendCard label="Impressions" value={(roi?.impressions ?? 0).toLocaleString()} change={roi?.impressionsChange} icon={Eye} />
          <TrendCard label="Mindshare Growth" value={`${roi?.mindshareGrowth ?? 0} pts`} change={roi?.mindshareGrowthChange} icon={TrendingUp} />
          <TrendCard label="Spend" value={`${roi?.spend ?? 0} EUR`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/35 p-4">
            <h3 className="text-sm font-medium text-indigo-300 mb-2">High-demand segments</h3>
            {(intelligence?.segments || []).length > 0 ? intelligence.segments.map((segment) => (
              <div key={segment.id} className="flex items-center justify-between text-sm text-slate-200 py-1 border-b border-slate-800/60 last:border-0">
                <span>{segment.name}</span>
                <span className="text-emerald-400">{segment.demand}</span>
              </div>
            )) : <p className="text-sm text-slate-500">Coming soon</p>}
          </div>

          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/35 p-4">
            <h3 className="text-sm font-medium text-indigo-300 mb-2">Competitor weaknesses</h3>
            {(intelligence?.competitors || []).length > 0 ? intelligence.competitors.map((competitor) => (
              <div key={competitor.competitorId} className="text-sm text-slate-200 py-2 border-b border-slate-800/60 last:border-0">
                <div className="font-medium">{competitor.name}</div>
                <div className="text-xs text-slate-400 mt-1">Weak points: {Object.keys(competitor.dimensions || {}).join(', ')}</div>
              </div>
            )) : <p className="text-sm text-slate-500">Coming soon</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../api';
import NetworkIcon from '../components/NetworkIcons';

const TABS = [
  { id: 'discovery', label: 'Discovery', icon: Users },
  { id: 'intelligence', label: 'Intelligence', icon: BarChart3 },
  { id: 'roi', label: 'ROI / Attribution', icon: TrendingUp },
];

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 card-hover`}
    >
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function TabDiscovery() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Match founders ↔ KOLs. Context-Rich Previews : 280 chars X, thumbnails
        YT, LinkedIn, Facebook, TikTok, Instagram.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {['twitter', 'linkedin', 'youtube', 'newsletter'].map((n) => (
          <div
            key={n}
            className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center gap-3"
          >
            <NetworkIcon network={n} size="lg" />
            <span className="text-sm text-slate-300 capitalize">{n}</span>
          </div>
        ))}
      </div>
      <div className="text-slate-500 text-sm mt-6">
        Aucun KOL chargé. Connecter le backend pour afficher les matches.
      </div>
    </div>
  );
}

function TabIntelligence() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Top 5 segments Micro-SaaS et Competitor Weakness Matrix.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Segments à fort besoin
          </h3>
          <ul className="text-slate-500 text-sm space-y-1">
            <li>— Dev Tools</li>
            <li>— No-code / Low-code</li>
            <li>— API-first SaaS</li>
            <li>— CRM niche</li>
            <li>— Analytics</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Competitor Weakness Matrix
          </h3>
          <p className="text-slate-500 text-sm">
            Profondeur technique, ROI tracking, rigidité pricing.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabROI() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Clicks, impressions, Mindshare Growth vs Spend — vue single-page.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Clicks"
          value="0"
          sub="Total campagne"
          color="emerald"
        />
        <StatCard
          icon={BarChart3}
          label="Impressions"
          value="0"
          sub="Total campagne"
          color="cyan"
        />
        <StatCard
          icon={TrendingUp}
          label="Mindshare Growth"
          value="0%"
          sub="Évolution"
          color="indigo"
        />
        <StatCard
          icon={BarChart3}
          label="Spend"
          value="0 €"
          sub="Budget engagé"
          color="amber"
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('discovery');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch(() => setData({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900/40">
      <header className="border-b border-slate-700/30 px-6 py-4">
        <h1 className="text-xl font-bold text-white">MaaS — Mindshare as a Service</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Dashboard — Match, Intelligence, ROI
        </p>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* StatCards résumé */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="KOLs"
              value={data?.kolCount ?? 0}
              sub="En base"
              color="indigo"
            />
            <StatCard
              icon={BarChart3}
              label="Mindshare"
              value={data?.mindshare?.value ?? 0}
              sub={data?.mindshare?.level ?? 'Invisible'}
              color="emerald"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                tab === t.id
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
          {tab === 'discovery' && <TabDiscovery />}
          {tab === 'intelligence' && <TabIntelligence />}
          {tab === 'roi' && <TabROI />}
        </div>
      </main>
    </div>
  );
}

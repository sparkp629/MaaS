import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import NetworkIcon from '../components/NetworkIcons';
import MindshareGauge from '../components/MindshareGauge';
import ContextRichPreview from '../components/ContextRichPreview';

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

function TabDiscovery({ kols }) {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Match founders ↔ KOLs. Context-Rich Previews : 280 chars X, thumbnails
        YT, LinkedIn, Facebook, TikTok, Instagram.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {['twitter', 'linkedin', 'youtube', 'newsletter', 'facebook', 'tiktok', 'instagram'].map((n) => (
          <div
            key={n}
            className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center gap-3"
          >
            <NetworkIcon network={n} size="lg" />
            <span className="text-sm text-slate-300 capitalize">{n}</span>
          </div>
        ))}
      </div>
      {kols?.length > 0 ? (
        <div className="space-y-6 mt-6">
          {kols.map((k) => (
            <div
              key={k.id}
              className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {k.avatarUrl && (
                    <img
                      src={k.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-slate-600"
                    />
                  )}
                  <div>
                    <div className="font-medium text-white">{k.displayName}</div>
                    <div className="text-sm text-slate-400">{k.handle} • {k.niche}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{k.preview}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-indigo-400 font-bold">{k.mindshareIndex}</span>
                  <span className="text-slate-500 text-sm"> MI</span>
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-emerald-400 font-bold">{k.conversionScore}</span>
                  <span className="text-slate-500 text-sm"> Conv</span>
                </div>
              </div>
              <ContextRichPreview kol={k} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm mt-6">Aucun KOL en base.</div>
      )}
    </div>
  );
}

function TabIntelligence({ segments, competitors }) {
  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm">
        Top 5 segments Micro-SaaS et Competitor Weakness Matrix.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Segments à fort besoin
          </h3>
          <ul className="text-slate-400 text-sm space-y-2">
            {segments?.map((s) => (
              <li key={s.id}>
                {s.name} — demande {s.demand}/100, croissance {s.growth}%
              </li>
            )) ?? (
              <>
                <li>— Dev Tools</li>
                <li>— No-code / Low-code</li>
                <li>— API-first SaaS</li>
                <li>— CRM niche</li>
                <li>— Analytics</li>
              </>
            )}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Competitor Weakness Matrix
          </h3>
          <p className="text-slate-500 text-sm mb-3">
            Profondeur technique, ROI tracking, rigidité pricing (plus haut = plus faible).
          </p>
          {competitors?.length > 0 ? (
            <div className="space-y-2">
              {competitors.map((c) => (
                <div key={c.competitorId} className="flex justify-between text-sm">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="text-slate-500">
                    avg {(Object.values(c.dimensions || {}).reduce((a, b) => a + b, 0) / Object.keys(c.dimensions || {}).length || 0).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TabROI({ roi }) {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Clicks, impressions, Mindshare Growth vs Spend — vue single-page.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Clicks"
          value={roi?.clicks ?? 0}
          sub="Total campagne"
          color="emerald"
        />
        <StatCard
          icon={BarChart3}
          label="Impressions"
          value={roi?.impressions ?? 0}
          sub="Total campagne"
          color="cyan"
        />
        <StatCard
          icon={TrendingUp}
          label="Mindshare Growth"
          value={`${roi?.mindshareGrowth ?? 0}%`}
          sub="Évolution"
          color="indigo"
        />
        <StatCard
          icon={BarChart3}
          label="Spend"
          value={`${roi?.spend ?? 0} €`}
          sub="Budget engagé"
          color="amber"
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isLoggedIn } = useAuth();
  const [tab, setTab] = useState('discovery');
  const [data, setData] = useState(null);
  const [kols, setKols] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getKOLs(),
      api.getIntelligence(),
      api.getRoi(),
    ])
      .then(([d, k, i, r]) => {
        setData(d);
        setKols(k);
        setIntelligence(i);
        setRoi(r);
      })
      .catch(() => {
        setData({ kolCount: 0, mindshare: { value: 0, level: 'Invisible' } });
        setKols([]);
        setIntelligence(null);
        setRoi(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {!isLoggedIn && (
        <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
          Connectez-vous avec GitHub pour sauvegarder vos campagnes et accéder au ROI détaillé.
        </div>
      )}
      <h1 className="text-xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        <Link to="/campaign" className="text-indigo-400 hover:text-indigo-300">
          Moteur de campagne
        </Link>
        {' · '}
        <Link to="/checkout" className="text-indigo-400 hover:text-indigo-300">
          Magic Button
        </Link>
      </p>

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="KOLs"
            value={data?.kolCount ?? 0}
            sub="En base"
            color="indigo"
          />
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 flex items-center gap-4">
            <MindshareGauge
              value={data?.mindshare?.value ?? 0}
              level={data?.mindshare?.level ?? 'Invisible'}
              size="sm"
            />
            <div>
              <div className="text-slate-400 text-sm">Mindshare Index</div>
              <div className="text-white font-bold">{data?.mindshare?.value ?? 0}</div>
            </div>
          </div>
        </div>
      )}

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

      <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
        {tab === 'discovery' && <TabDiscovery kols={kols} />}
        {tab === 'intelligence' && (
          <TabIntelligence
            segments={intelligence?.segments}
            competitors={intelligence?.competitors}
          />
        )}
        {tab === 'roi' && <TabROI roi={roi} />}
      </div>
    </div>
  );
}

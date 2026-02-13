import { useState, useEffect } from 'react';
import { Users, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../api';
import NetworkIcon from '../components/NetworkIcons';

const TABS = [
  { id: 'discovery', label: 'Trouver des influenceurs', icon: Users },
  { id: 'intelligence', label: 'Marché & concurrents', icon: BarChart3 },
  { id: 'roi', label: 'Résultats & budget', icon: TrendingUp },
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
        Associez votre produit aux influenceurs dont l'audience correspond le mieux. Aperçus de leurs posts (X, LinkedIn, YouTube, newsletters…).
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
      {kols?.length > 0 ? (
        <div className="space-y-3 mt-6">
          {kols.map((k) => (
            <div
              key={k.id}
              className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-white">{k.displayName}</div>
                <div className="text-sm text-slate-400">{k.handle} • {k.niche}</div>
                <div className="text-xs text-slate-500 mt-1">{k.preview}</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right" title="À quel point cette personne compte dans son domaine (X, newsletter, YouTube, etc.)">
                  <div className="text-indigo-400 font-bold text-lg">{k.mindshareIndex}</div>
                  <div className="text-slate-500 text-xs">Influence dans la niche</div>
                </div>
                <div className="text-right" title="Probabilité que son audience convertisse (achète, s’inscrive, etc.)">
                  <div className="text-emerald-400 font-bold text-lg">{k.conversionScore}</div>
                  <div className="text-slate-500 text-xs">Potentiel de vente</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-sm mt-6">Aucun influenceur en base pour le moment.</div>
      )}
    </div>
  );
}

function TabIntelligence() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Où trouver vos clients idéaux et quelles lacunes exploitent vos concurrents.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Marchés où les créateurs cherchent de la visibilité
          </h3>
          <ul className="text-slate-500 text-sm space-y-1">
            <li>— Outils pour développeurs</li>
            <li>— No-code / Low-code</li>
            <li>— Logiciels API-first</li>
            <li>— CRM de niche</li>
            <li>— Données et analytics</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h3 className="text-sm font-medium text-indigo-400 mb-2">
            Faiblesses courantes de vos concurrents
          </h3>
          <p className="text-slate-500 text-sm">
            Contenu trop technique, suivi des ventes flou, tarifs rigides — autant d’angles pour vous différencier.
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
        Suivi des clics, vues, évolution de votre visibilité et montant dépensé.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Clics"
          value="0"
          sub="Personnes ayant cliqué"
          color="emerald"
        />
        <StatCard
          icon={BarChart3}
          label="Vues"
          value="0"
          sub="Personnes ayant vu vos posts"
          color="cyan"
        />
        <StatCard
          icon={TrendingUp}
          label="Visibilité"
          value="0%"
          sub="Évolution de votre notoriété"
          color="indigo"
        />
        <StatCard
          icon={BarChart3}
          label="Dépensé"
          value="0 €"
          sub="Budget engagé en campagnes"
          color="amber"
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('discovery');
  const [data, setData] = useState(null);
  const [kols, setKols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getKOLs()])
      .then(([d, k]) => {
        setData(d);
        setKols(k);
      })
      .catch(() => {
        setData({ kolCount: 0, mindshare: { value: 0, level: 'À développer' } });
        setKols([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900/40">
      <header className="border-b border-slate-700/30 px-6 py-4">
        <h1 className="text-xl font-bold text-white">MaaS</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Trouvez des influenceurs qui convertissent — pas seulement des comptes à nombreux followers.
        </p>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* StatCards résumé */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Influenceurs"
              value={data?.kolCount ?? 0}
              sub="Référencés"
              color="indigo"
            />
            <StatCard
              icon={BarChart3}
              label="Niveau d'influence moyen"
              value={data?.mindshare?.value ?? 0}
              sub={data?.mindshare?.level ?? 'À développer'}
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
          {tab === 'discovery' && <TabDiscovery kols={kols} />}
          {tab === 'intelligence' && <TabIntelligence />}
          {tab === 'roi' && <TabROI />}
        </div>
      </main>
    </div>
  );
}

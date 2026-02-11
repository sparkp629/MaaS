import { useState, useEffect } from 'react';
import { api } from '../api';
import { DollarSign, TrendingUp, Calculator, ArrowRight, BarChart3, Zap, Shield, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];

const CPM_X = 8; // €/1000 impressions (X Ads CPM typique 6–12€)

function FunnelSection({ campaignROI, funnelData }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const gainNet = (campaignROI.revenue_generated || 0) - (campaignROI.budget || 0);
  const fraisServices = [
    { libelle: 'Abonnement MaaS mensuel', montant: (campaignROI.budget || 0) / 3 },
    { libelle: 'Coût KOL / contenu', montant: (campaignROI.budget || 0) * 0.3 },
    { libelle: 'Outils analytics', montant: 50 },
  ];
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Funnel d'Attribution — {campaignROI.campaign}
      </h3>
      <p className="text-xs text-slate-500 mb-4">Métriques universelles (vues, clics, likes) — Gain basé sur des données authentiques</p>
      <div className="grid md:grid-cols-4 gap-4 items-center">
        {funnelData.map((stage, i) => (
          <div key={stage.name} className="flex items-center gap-3">
            <div className="flex-1 p-4 rounded-xl text-center" style={{ background: `${stage.color}10`, borderLeft: `3px solid ${stage.color}` }}>
              <p className="text-2xl font-bold text-white">{stage.value.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{stage.name}</p>
            </div>
            {i < funnelData.length - 1 && (
              <div className="hidden md:flex flex-col items-center">
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center">
          <p className="text-xs text-slate-400 mb-1">Gain approximatif</p>
          <p className="text-3xl font-bold text-emerald-400">{gainNet >= 0 ? '+' : ''}{gainNet.toLocaleString()}€</p>
          <p className="text-[10px] text-slate-500 mt-1">mois vs investissement</p>
          <button
            onClick={() => setDetailOpen(true)}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            détail
          </button>
        </div>
      </div>
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDetailOpen(false)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-white mb-4">Détail des frais de services SaaS</h4>
            <ul className="space-y-2 mb-4">
              {fraisServices.map((f, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-slate-300">{f.libelle}</span>
                  <span className="font-semibold text-white">{Math.round(f.montant)}€</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Investissement total: {campaignROI.budget}€ · Revenue généré: {campaignROI.revenue_generated}€
            </p>
            <button onClick={() => setDetailOpen(false)} className="mt-4 w-full py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTooltip({ text, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="text-slate-500 hover:text-indigo-400 transition-colors cursor-help focus:outline-none"
        aria-label="Justification"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg bg-slate-800 border border-slate-600 text-xs text-slate-200 shadow-xl">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-600" />
        </div>
      )}
    </span>
  );
}

export default function ClientROI() {
  const [roiEstimate, setRoiEstimate] = useState(null);
  const [campaignROI, setCampaignROI] = useState(null);
  const [budget, setBudget] = useState(3000);
  const [niche, setNiche] = useState('AI Tools');
  const [duration, setDuration] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getROIEstimate(budget, niche, duration),
      api.getCampaignROI(1),
    ]).then(([est, roi]) => {
      setRoiEstimate(est);
      setCampaignROI(roi);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCalculate = async () => {
    try {
      const est = await api.getROIEstimate(budget, niche, duration);
      setRoiEstimate(est);
    } catch (err) {
      console.error(err);
    }
  };

  const funnelData = campaignROI ? [
    { name: 'Vues', value: campaignROI.funnel.impressions, color: '#6366f1' },
    { name: 'Clics', value: campaignROI.funnel.clicks, color: '#06b6d4' },
    { name: 'Likes', value: campaignROI.funnel.conversions, color: '#10b981' },
  ] : [];

  const comparisonData = roiEstimate ? [
    { name: 'Publicité traditionnelle', roi: roiEstimate.comparison.traditional_ads_roi, fill: '#ef4444' },
    { name: 'Agence généraliste', roi: roiEstimate.comparison.generic_agency_roi, fill: '#f59e0b' },
    { name: 'MaaS (Mindshare)', roi: roiEstimate.comparison.maas_roi, fill: '#10b981' },
  ] : [];

  const breakdownData = roiEstimate ? [
    { name: 'Mois 1', revenue: roiEstimate.breakdown.month_1 },
    { name: 'Mois 2', revenue: roiEstimate.breakdown.month_2 },
    { name: 'Mois 3', revenue: roiEstimate.breakdown.month_3 },
  ] : [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Tableau de Bord ROI</h1>
        <p className="text-slate-400 mt-1">Transparence totale — Prouvez la valeur du MaaS à vos clients</p>
      </div>

      {/* ROI Calculator */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Simulateur de ROI
        </h3>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Budget mensuel (€)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Niche SaaS</label>
            <select
              value={niche}
              onChange={e => setNiche(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              {['AI Tools', 'Code Generation', 'SEO', 'Productivity', 'NoCode', 'DevOps', 'Analytics'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Durée (mois)</label>
            <select
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              {[1, 2, 3, 6, 12].map(d => <option key={d} value={d}>{d} mois</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleCalculate} className="w-full px-4 py-2.5 rounded-lg gradient-maas text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Calculer
            </button>
          </div>
        </div>

        {roiEstimate && (
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-800/30 text-center relative">
              <MetricTooltip text="Somme totale investie dans le MaaS sur la durée du contrat. Base du calcul du ROI." className="absolute top-2 right-2" />
              <DollarSign className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{roiEstimate.budget.toLocaleString()}€</p>
              <p className="text-xs text-slate-500">Investissement</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 text-center relative">
              <MetricTooltip text="Revenus additionnels estimés grâce au mindshare (leads qualifiés, conversions, notoriété). Basé sur les benchmarks du secteur." className="absolute top-2 right-2" />
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-400">{roiEstimate.estimated_revenue.toLocaleString()}€</p>
              <p className="text-xs text-slate-500">Revenue estimé</p>
            </div>
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center relative">
              <MetricTooltip text={`Coût équivalent en publicité X pour le même volume d'impressions. CPM X: ~${CPM_X}€/1K impr. (tarifs officiels X Ads).`} className="absolute top-2 right-2" />
              <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-3xl font-bold text-cyan-400">~{Math.round((campaignROI?.funnel?.impressions || 0) / 1000 * CPM_X).toLocaleString()}€</p>
              <p className="text-xs text-slate-500">Équiv. coût pub. X</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 text-center relative">
              <MetricTooltip text="Nombre de fois que l'investissement est récupéré via les revenus générés. &gt;1 = rentable." className="absolute top-2 right-2" />
              <BarChart3 className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-cyan-400">{roiEstimate.multiplier}x</p>
              <p className="text-xs text-slate-500">Multiplicateur</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ROI Comparison */}
        {comparisonData.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Comparaison ROI — MaaS vs Alternatives
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'ROI']}
                />
                <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 text-center mt-2">
              Le MaaS génère en moyenne 3x plus de ROI qu'une agence marketing généraliste
            </p>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sources</p>
              <ul className="space-y-0.5 text-[11px] text-slate-400">
                <li>
                  <a href="https://business.x.com/en/help/ads-pricing/cost-per-click-and-bidding.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    X Ads — Pricing (CPM, CPC)
                  </a>
                </li>
                <li>
                  <a href="https://www.statista.com/statistics/277259/advertising-spending-on-social-networks/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    Statista — Dépenses publicitaires réseaux sociaux
                  </a>
                </li>
                <li>
                  <a href="https://blog.hubspot.com/marketing/influencer-marketing-roi" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    HubSpot — ROI marketing d'influence
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Revenue Projection */}
        {breakdownData.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Projection de Revenue par Mois
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={breakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K€`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v) => [`${v.toLocaleString()}€`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Funnel universel Vues → Likes → Gain € */}
      {campaignROI && (
        <FunnelSection campaignROI={campaignROI} funnelData={funnelData} />
      )}

      {/* Urgency CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <Shield className="w-10 h-10 text-white/80 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">ROI Positif Garanti sous 90 Jours</h2>
          <p className="text-white/80 text-sm max-w-lg mx-auto mb-4">
            Si votre Mindshare Index n'a pas augmenté d'au moins 40 points et que vous n'avez pas constaté un ROI positif, nous vous remboursons intégralement. Zéro risque.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
              23 SaaS accompagnés
            </span>
            <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
              +340% Mindshare Index moyen
            </span>
            <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
              $2.4M revenue influenced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

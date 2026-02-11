import { useState, useEffect } from 'react';
import { api } from '../api';
import MindshareGauge from '../components/MindshareGauge';
import { Rocket, Wand2, FileText, MessageSquare, Megaphone, Video, Loader2, Github, MessageCircle, Repeat2, Heart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CONTENT_ICONS = { thread: FileText, bip: MessageSquare, cta: Megaphone, short: Video };

const SLOGAN = 'Match votre repo GitHub avec des KOLs ciblés — Génération de contenu différenciateur.';

const TEMPORALITIES = [
  { id: 'daily', label: '7 jours' },
  { id: 'weekly', label: '4 semaines' },
  { id: 'monthly', label: '3 mois' },
];

function engagementScore(impressions, likes, replies, reposts) {
  const eng = (likes || 0) + (replies || 0) * 2 + (reposts || 0) * 3;
  const base = Math.log10((impressions || 1) + 1) * 10;
  return Math.min(100, Math.round((base + eng * 2) / 2));
}

export default function CampaignEngine() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ product_name: '', niche: 'AI Tools', product_description: '' });
  const [loading, setLoading] = useState(true);
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [temporality, setTemporality] = useState('daily');

  useEffect(() => {
    api.getCampaigns().then(d => {
      setCampaigns(d.campaigns);
      if (d.campaigns.length > 0) loadCampaign(d.campaigns[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadCampaign = async (id) => {
    try {
      const data = await api.getCampaign(id);
      setSelectedCampaign(data.campaign);
      setCampaignDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectGithub = async () => {
    if (!charterAccepted) return;
    setConnectingGithub(true);
    try {
      // Placeholder: en production, OAuth GitHub
      await new Promise(r => setTimeout(r, 800));
      setGithubConnected(true);
    } catch (err) {
      console.error(err);
    }
    setConnectingGithub(false);
  };

  const handleGenerate = async () => {
    if (!form.product_name || !githubConnected) return;
    setGenerating(true);
    try {
      const result = await api.generateContent(form);
      setGeneratedContent(result);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const chartData = campaignDetail?.history?.slice(-14).map(h => ({
    date: h.date.split('-').slice(1).join('/'),
    index: h.mindshare_index,
  })) || [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-indigo-400 font-medium mb-1">{SLOGAN}</p>
        <h1 className="text-3xl font-bold gradient-text">Orchestrateur de Campagne</h1>
        <p className="text-slate-400 mt-1">Le "bouton magique" — Génération automatique de contenu & livraison aux KOLs</p>
      </div>

      {/* GitHub Connect + Charte */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Github className="w-4 h-4" /> Connecter votre repo GitHub
        </h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={charterAccepted}
              onChange={e => setCharterAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
            />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              J'accepte la <strong className="text-indigo-400">charte d'utilisation</strong> : nous ne conservons aucune donnée.
              MaaS analyse uniquement la nature de mon SaaS via des agents IA pour identifier des KOLs compatibles, sans stockage des contenus de mon dépôt.
            </span>
          </label>
          <button
            onClick={handleConnectGithub}
            disabled={!charterAccepted || connectingGithub}
            className="w-fit px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {connectingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-5 h-5" />}
            {githubConnected ? 'Repo connecté ✓' : connectingGithub ? 'Connexion...' : 'Connecter GitHub'}
          </button>
        </div>
      </div>

      {/* Content Generator — visible après connexion GitHub */}
      {githubConnected && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Content Orchestrator — Générer du contenu
          </h3>
          <div className="grid md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nom du produit SaaS"
              value={form.product_name}
              onChange={e => setForm({ ...form, product_name: e.target.value })}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <select
              value={form.niche}
              onChange={e => setForm({ ...form, niche: e.target.value })}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              {['AI Tools', 'Code Generation', 'SEO', 'Productivity', 'NoCode', 'DevOps', 'Analytics'].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description courte (optionnel)"
              value={form.product_description}
              onChange={e => setForm({ ...form, product_description: e.target.value })}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={handleGenerate}
              disabled={!form.product_name || generating}
              className="px-4 py-2.5 rounded-lg gradient-maas text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {generating ? 'Génération...' : 'Générez'}
            </button>
          </div>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Campagne: {generatedContent.product}</h3>
                <p className="text-xs text-slate-400">Hook: "{generatedContent.hook}"</p>
              </div>
              <div className="flex gap-3 text-center">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <p className="text-lg font-bold text-indigo-400">{generatedContent.total_kols}</p>
                  <p className="text-[10px] text-slate-500">KOLs</p>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <p className="text-lg font-bold text-cyan-400">{generatedContent.content_pieces}</p>
                  <p className="text-[10px] text-slate-500">Contenus</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-lg font-bold text-emerald-400">{(generatedContent.estimated_total_reach / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-slate-500">Portée Est.</p>
                </div>
              </div>
            </div>

            {/* Content per KOL */}
            {generatedContent.contents.map((c, i) => (
              <div key={i} className="mt-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full gradient-maas flex items-center justify-center text-xs font-bold">
                    {c.kol_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.kol_name}</p>
                    <p className="text-xs text-slate-500">{c.kol_handle} · Ton: {c.tone}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { key: 'x_thread', data: c.x_thread },
                    { key: 'x_bip', data: c.x_bip },
                    { key: 'x_cta', data: c.x_cta },
                    { key: 'short', data: c.short },
                  ].map(({ key, data }) => {
                    const Icon = CONTENT_ICONS[data.type] || FileText;
                    const raw = data.content || (data.script ? Object.values(data.script).join('\n') : '');
                    const preview = raw.length > 280 ? raw.slice(0, 280) + '…' : raw;
                    return (
                      <div key={key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-400">{data.format}</span>
                          {data.estimated_engagement && (
                            <span className="text-[10px] text-slate-500 ml-auto">Eng. est.: {data.estimated_engagement}</span>
                          )}
                        </div>
                        <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-700/50 font-sans text-sm leading-relaxed text-slate-200">
                          {preview}
                          {raw.length > 280 && <span className="text-slate-500"> ({raw.length} caractères)</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 italic">{data.adaptation_notes}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Derniers posts (tweets) selon temporalité */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Derniers posts</h3>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50">
              {TEMPORALITIES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemporality(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    temporality === t.id ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {campaigns.map(c => {
              const score = engagementScore(c.impressions, c.conversions, Math.round(c.conversions * 0.3), Math.round(c.conversions * 0.1));
              const content = c.thread_content || `${c.product_name} — ${c.niche}`;
              const preview = content.slice(0, 280) + (content.length > 280 ? '…' : '');
              return (
                <div
                  key={c.id}
                  onClick={() => loadCampaign(c.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-colors border ${
                    selectedCampaign?.id === c.id ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.product_name}</p>
                      <p className="text-xs text-slate-500">@{c.client_name?.replace(/\s/g, '') || 'client'} · {c.niche}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 shrink-0">{score}/100</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mb-3 font-sans">{preview}</p>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1 text-xs">
                      <MessageCircle className="w-3.5 h-3.5" /> {Math.round((c.conversions || 0) * 0.3)}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Repeat2 className="w-3.5 h-3.5" /> {Math.round((c.conversions || 0) * 0.1)}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Heart className="w-3.5 h-3.5" /> {c.conversions || 0}
                    </span>
                    <span className="text-xs text-cyan-400 ml-auto">{(c.impressions / 1000).toFixed(0)}K impr.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign Mindshare */}
        {selectedCampaign && campaignDetail && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Mindshare — {selectedCampaign.product_name}
              </h3>
              {campaignDetail.mindshare && (
                <MindshareGauge score={campaignDetail.mindshare.mindshare_index} level={campaignDetail.mindshare.level} size="sm" />
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gCamp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 11 }} />
                <Area type="monotone" dataKey="index" stroke="#6366f1" fill="url(#gCamp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Content Preview — 280 caractères style X */}
            {selectedCampaign.thread_content && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400">Aperçu (style feed X — 280 caractères max):</p>
                <div className="rounded-xl bg-slate-900/80 border border-slate-700/50 p-4 font-sans text-[15px] leading-relaxed text-slate-200">
                  {(selectedCampaign.thread_content.slice(0, 280) + (selectedCampaign.thread_content.length > 280 ? '…' : '')).split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

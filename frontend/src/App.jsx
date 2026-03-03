import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bot,
  CheckCircle2,
  ExternalLink,
  Feather,
  Gift,
  House,
  Leaf,
  ListChecks,
  Loader2,
  QrCode,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from './api';

const USER_KEY = 'workspace-default';
const NETWORKS = [
  ['X', 'https://cdn.simpleicons.org/x/ffffff', '#1d9bf0'],
  ['YouTube', 'https://cdn.simpleicons.org/youtube/ff0000', '#ff0033'],
  ['Instagram', 'https://cdn.simpleicons.org/instagram/e4405f', '#e4405f'],
  ['Twitch', 'https://cdn.simpleicons.org/twitch/9146ff', '#9146ff'],
  ['Meta', 'https://cdn.simpleicons.org/meta/0866ff', '#0866ff'],
];
const SUBSTACK_ICON = 'https://cdn.simpleicons.org/substack/ff6719';

function iconOf(network) {
  return Object.fromEntries([...NETWORKS, ['Substack', SUBSTACK_ICON]].map(([k, i]) => [k, i]))[network]
    || 'https://cdn.simpleicons.org/x/ffffff';
}
function n(value) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}
function preview180(value) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length <= 180 ? clean : `${clean.slice(0, 177).trimEnd()}...`;
}
function rel(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  const sec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
  if (abs < 60) return rtf.format(sec, 'second');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  return rtf.format(Math.round(sec / 86400), 'day');
}
function weekly(dateInput, days = 7) {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now() - days * 86400000;
}
function trend(row) {
  const m = row.metrics || {};
  if (row.network === 'X') {
    const i = Number(m.likes || 0) + Number(m.replies || 0) + Number(m.reposts || 0) + Number(m.quotes || 0);
    const imp = Number(m.impressions || row.views || 0);
    const v = imp > 0 ? (i / imp) * 100 : Number(row.engagementRate || 0);
    return { dir: v >= 1.5 ? 'up' : 'down', value: Number(v.toFixed(2)), unit: '%' };
  }
  if (row.network === 'YouTube') {
    const views = Number(m.views || row.views || 0);
    const i = Number(m.likes || 0) + Number(m.comments || 0);
    const v = views > 0 ? (i / views) * 100 : Number(row.engagementRate || 0);
    return { dir: v >= 2.5 ? 'up' : 'down', value: Number(v.toFixed(2)), unit: '%' };
  }
  if (row.network === 'Substack') {
    const v = Number(row.growthScore || m.growthScore || 0);
    return { dir: v >= 70 ? 'up' : 'down', value: v, unit: '' };
  }
  const v = Number(row.engagementRate || 0);
  return { dir: v >= 2 ? 'up' : 'down', value: Number(v.toFixed(2)), unit: '%' };
}
function metrics(row) {
  const m = row.metrics || {};
  if (row.network === 'X') {
    const i = Number(m.likes || 0) + Number(m.replies || 0) + Number(m.reposts || 0) + Number(m.quotes || 0);
    return [`Impressions ${n(m.impressions || row.views || 0)}`, `Interactions ${n(i)}`, `Likes ${n(m.likes || 0)}`];
  }
  if (row.network === 'YouTube') return [`Views ${n(m.views || row.views || 0)}`, `Likes ${n(m.likes || 0)}`, `Comments ${n(m.comments || 0)}`];
  if (row.network === 'Instagram') return [`Likes ${n(m.likes || 0)}`, `Comments ${n(m.comments || 0)}`, `Impact ${Math.round(Number(row.impactScore || 0))}`];
  if (row.network === 'Meta') return [`Likes ${n(m.likes || 0)}`, `Comments ${n(m.comments || 0)}`, `Shares ${n(m.shares || 0)}`];
  if (row.network === 'Twitch') return [`Views ${n(row.views || 0)}`, `Impact ${Math.round(Number(row.impactScore || 0))}`];
  return [`Signal ${Math.round(Number(row.growthScore || m.growthScore || 0))}`, `Publie ${rel(row.publishedAt)}`];
}

function Preview({ row }) {
  if (row.network === 'X' && row.url) {
    return (
      <iframe
        className="preview-frame preview-x"
        src={`https://twitframe.com/show?url=${encodeURIComponent(row.url)}`}
        title={`x-${row.id || row.url}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  const thumb = row.metrics?.thumbnailUrl;
  if (thumb) {
    const short = row.network === 'YouTube' && Boolean(row.metrics?.isShort);
    const className = ['preview-image', short || row.network === 'Instagram' ? 'vertical' : 'horizontal'].join(' ');
    return <img className={className} src={thumb} alt="preview" loading="lazy" />;
  }
  if (row.url) return <a className="preview-fallback" href={row.url} target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a>;
  return <div className="preview-empty">Apercu indisponible</div>;
}

function SideNav({ active, setActive }) {
  const tabs = [
    ['home', 'Home', House],
    ['copywriting', 'Copywriting', null],
    ['alerts', 'Alertes', Bell],
    ['tasks', 'Task', ListChecks],
    ['automation', 'Automation', Bot],
  ];
  return (
    <aside className="side-nav">
      <div className="side-brand">MaaS</div>
      {tabs.map(([key, label, Icon]) => (
        <button key={key} type="button" className={`side-item ${active === key ? 'active' : ''}`} onClick={() => setActive(key)}>
          {key === 'copywriting' ? <span className="copy-icon"><Leaf size={14} /><Feather size={15} /></span> : <Icon size={18} />}
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}

function Home({ activeNetwork, setActiveNetwork, rows, newsletters, connectors, error, totalKols, totalContent }) {
  return (
    <>
      <header className="hero">
        <h1>Leaderboard fusionne avec apercus media</h1>
        <div className="hero-chips"><span>{n(totalKols)} KOLs</span><span>{n(totalContent)} contenus</span><span>{activeNetwork} live</span></div>
      </header>

      <div className="network-tabs">
        {NETWORKS.map(([key, icon, accent]) => (
          <button
            key={key}
            type="button"
            className={`network-tab ${activeNetwork === key ? 'active' : ''}`}
            style={{ '--tab-accent': accent }}
            onClick={() => setActiveNetwork(key)}
            title={key}
          >
            <img src={icon} alt={key} loading="lazy" />
          </button>
        ))}
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {connectors && !connectors.x?.configured ? <div className="alert info">Ajoutez `X_BEARER_TOKEN` dans `.env`.</div> : null}

      <section className="deck-content">
        <section className="feed-list">
          {rows.length ? rows.map((row, idx) => {
            const t = trend(row);
            return (
              <article key={row.id || row.url || `${row.network}-${idx}`} className="feed-row">
                <div className="row-left">
                  <div className="row-head">
                    <span className="row-rank">#{idx + 1}</span>
                    <img className="row-network" src={iconOf(row.network)} alt={row.network} loading="lazy" />
                    {row.authorAvatarUrl ? <img className="row-avatar" src={row.authorAvatarUrl} alt="avatar" loading="lazy" /> : null}
                    <strong>{row.authorHandle || row.authorName || 'Source'}</strong>
                    <span className={`trend ${t.dir}`}>{t.dir === 'up' ? '^' : 'v'} {t.value}{t.unit}</span>
                  </div>
                  <p className="row-preview">{preview180(row.hook || row.preview || row.title || '')}</p>
                  <div className="row-metrics">{metrics(row).map((m) => <span key={m}>{m}</span>)}</div>
                  <div className="row-footer">
                    <span>{rel(row.publishedAt)}</span>
                    {row.url ? <a href={row.url} target="_blank" rel="noreferrer">Source officielle <ExternalLink size={13} /></a> : null}
                  </div>
                </div>
                <div className="row-right"><Preview row={row} /></div>
              </article>
            );
          }) : <div className="empty">Aucun contenu pour ce reseau.</div>}
        </section>

        <section className="newsletter-zone">
          <div className="newsletter-head">
            <div className="substack-pill"><img src={SUBSTACK_ICON} alt="Substack" loading="lazy" /><span>Substack</span><span className="premium">P</span></div>
            <div><h2>Les sujets de la semaine</h2><p>{newsletters.length} sujets (7 jours)</p></div>
          </div>
          <div className="newsletter-list">
            {newsletters.length ? newsletters.map((it) => (
              <article key={it.id || it.issueUrl} className="newsletter-item">
                <div className="newsletter-main">
                  <strong>{it.publication || 'Substack'}</strong>
                  {it.issueUrl ? <a href={it.issueUrl} target="_blank" rel="noreferrer">{preview180(it.topic || it.title || '')}</a> : <p>{preview180(it.topic || it.title || '')}</p>}
                </div>
                <div className="newsletter-meta"><span>Signal {Math.round(Number(it.growthScore || it.metrics?.growthScore || 0))}</span><span>{rel(it.publishedAt)}</span></div>
              </article>
            )) : <div className="empty">Aucun sujet hebdomadaire indexe.</div>}
          </div>
        </section>
      </section>
    </>
  );
}

function Copywriting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  async function run() {
    setLoading(true); setError('');
    try {
      setResult(await api.generateCopywritingRag({
        productName: 'Offre high ticket',
        productDescription: 'Prompts system internes + contexte vectoriel, sans saisie utilisateur additionnelle.',
        niche: 'intelligence artificielle fr',
        tone: 'informatif',
      }));
    } catch (e) { setError(e.message || 'Generation impossible.'); } finally { setLoading(false); }
  }
  return (
    <section className="utility-panel">
      <h2>Copywriting</h2>
      <p>Un seul bouton. Les prompts system restent invisibles et sont executes automatiquement.</p>
      <button type="button" className="action-btn" onClick={run} disabled={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Lancer
      </button>
      {error ? <div className="alert error">{error}</div> : null}
      {result?.result?.outputs ? (
        <div className="copy-output">
          <article><h3>Thread X</h3><pre>{result.result.outputs.thread.content}</pre></article>
          <article><h3>Post LinkedIn</h3><pre>{result.result.outputs.linkedin.content}</pre></article>
          <article><h3>Script short</h3><pre>{result.result.outputs.short.content}</pre></article>
        </div>
      ) : null}
    </section>
  );
}

function Alerts() {
  const [payload, setPayload] = useState(null);
  const [cfg, setCfg] = useState({ minImpactScore: 70, dailyDigest: true, networks: ['X', 'YouTube'] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setLoading(true); setError('');
    try {
      const p = await api.getTelegramAlertConfig(USER_KEY);
      setPayload(p);
      setCfg({
        minImpactScore: Number(p?.connection?.minImpactScore || 70),
        dailyDigest: Boolean(p?.connection?.dailyDigest),
        networks: p?.connection?.networks?.length ? p.connection.networks : ['X', 'YouTube'],
      });
    } catch (e) { setError(e.message || 'Chargement impossible.'); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function save() {
    setSaving(true); setError(''); setNotice('');
    try {
      const p = await api.updateTelegramAlertConfig({ userKey: USER_KEY, ...cfg });
      setPayload(p); setNotice('Configuration enregistree.');
    } catch (e) { setError(e.message || 'Sauvegarde impossible.'); } finally { setSaving(false); }
  }
  async function test() {
    setTesting(true); setError(''); setNotice('');
    try {
      await api.sendTelegramAlertTest({ userKey: USER_KEY, message: 'Alerte MaaS test: connexion active.' });
      setNotice('Alerte test envoyee sur Telegram.');
    } catch (e) { setError(e.message || 'Test impossible.'); } finally { setTesting(false); }
  }

  const connected = payload?.connection?.status === 'connected' && payload?.connection?.telegramChatId;
  return (
    <section className="utility-panel">
      <h2>Alertes Telegram</h2>
      <p>Chaque utilisateur dispose de son QR code unique pour relier Telegram au dashboard.</p>
      {loading ? <div className="inline-status"><Loader2 size={16} className="spin" /> Chargement...</div> : null}
      {error ? <div className="alert error">{error}</div> : null}
      {notice ? <div className="alert info">{notice}</div> : null}
      {payload ? (
        <div className="alerts-grid">
          <div className="qr-card">
            <div className="qr-head"><QrCode size={18} /><span>QR client unique</span></div>
            {payload.qrCodeUrl ? <img className="qr-image" src={payload.qrCodeUrl} alt="QR Telegram" loading="lazy" /> : <div className="empty">Ajoutez TELEGRAM_BOT_TOKEN et TELEGRAM_BOT_USERNAME.</div>}
            {payload.deepLink ? <a href={payload.deepLink} className="preview-fallback" target="_blank" rel="noreferrer">Lien Telegram <ExternalLink size={13} /></a> : null}
            <div className={`connection-status ${connected ? 'ok' : 'pending'}`}>{connected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{connected ? 'Connecte' : 'En attente de connexion'}</div>
          </div>
          <div className="alert-config">
            <label>Seuil impact
              <input type="range" min="1" max="99" value={cfg.minImpactScore} onChange={(e) => setCfg((s) => ({ ...s, minImpactScore: Number(e.target.value) }))} />
              <span>{cfg.minImpactScore}</span>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={cfg.dailyDigest} onChange={(e) => setCfg((s) => ({ ...s, dailyDigest: e.target.checked }))} />
              Digest quotidien
            </label>
            <div className="network-checks">
              {['X', 'YouTube', 'Instagram', 'Twitch', 'Meta'].map((net) => (
                <label key={net} className="checkbox">
                  <input
                    type="checkbox"
                    checked={cfg.networks.includes(net)}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setCfg((s) => ({ ...s, networks: on ? Array.from(new Set([...s.networks, net])) : s.networks.filter((i) => i !== net) }));
                    }}
                  />
                  {net}
                </label>
              ))}
            </div>
            <div className="button-row">
              <button type="button" className="action-btn" onClick={save} disabled={saving}>{saving ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Enregistrer</button>
              <button type="button" className="action-btn ghost" onClick={test} disabled={testing}>{testing ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Test Telegram</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Tasks() {
  const [survey, setSurvey] = useState({ niche: 'intelligence artificielle fr', objectif: 'high ticket b2b', canal: 'youtube x substack' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  async function run() {
    setLoading(true); setError('');
    try {
      const r = await api.getSubstackTopicsFromSurvey({ surveyAnswers: survey, limit: 8 });
      setTopics(r?.result?.topics || []);
    } catch (e) { setError(e.message || 'Recherche impossible.'); } finally { setLoading(false); }
  }
  return (
    <section className="utility-panel">
      <h2>Task: Sondage</h2>
      <p>Liaison landing page, sondage et recherche Substack.</p>
      <div className="utility-grid">
        <label>Niche<input value={survey.niche} onChange={(e) => setSurvey((s) => ({ ...s, niche: e.target.value }))} /></label>
        <label>Objectif<input value={survey.objectif} onChange={(e) => setSurvey((s) => ({ ...s, objectif: e.target.value }))} /></label>
        <label className="span-2">Canal<input value={survey.canal} onChange={(e) => setSurvey((s) => ({ ...s, canal: e.target.value }))} /></label>
      </div>
      <button type="button" className="action-btn" onClick={run} disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Lancer</button>
      {error ? <div className="alert error">{error}</div> : null}
      <div className="newsletter-list compact">
        {topics.length ? topics.map((t) => (
          <article key={`${t.publication}-${t.link}`} className="newsletter-item">
            <div className="newsletter-main"><strong>{t.publication}</strong>{t.link ? <a href={t.link} target="_blank" rel="noreferrer">{preview180(t.title)}</a> : <p>{preview180(t.title)}</p>}</div>
            <div className="newsletter-meta"><span>Score {t.combinedScore}</span><span>Hits {t.surveyHits}</span></div>
          </article>
        )) : <div className="empty">Aucun resultat.</div>}
      </div>
    </section>
  );
}

function Automation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  async function run() {
    setLoading(true); setError('');
    try {
      setResult(await api.runKolPromptTest({
        nicheKey: 'intelligence-artificielle-fr',
        objective: 'awareness',
        budget: 'mid',
        countryCode: 'FR',
        language: 'fr',
        surveyAnswers: { niche: 'intelligence artificielle fr', objectif: 'kols + contenus performants', canaux: ['X', 'YouTube'] },
      }));
    } catch (e) { setError(e.message || 'Test KOL impossible.'); } finally { setLoading(false); }
  }
  return (
    <section className="utility-panel">
      <h2>Automation</h2>
      <p>Suppression Make/n8n et alternative NEW, plus test du prompt KOL.</p>
      <div className="automation-scene">
        <div className="trash-visual"><div className="trash-lid" /><div className="trash-body"><Trash2 size={28} /><img className="falling-icon make" src="https://cdn.simpleicons.org/make/6d00cc" alt="Make" loading="lazy" /><img className="falling-icon n8n" src="https://cdn.simpleicons.org/n8n/ea4b71" alt="n8n" loading="lazy" /></div></div>
        <div className="gift-visual"><Gift size={28} /><span className="new-pop">NEW</span></div>
      </div>
      <button type="button" className="action-btn" onClick={run} disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Lancer test prompt KOL</button>
      {error ? <div className="alert error">{error}</div> : null}
      {result?.items?.length ? (
        <div className="kol-results">
          {result.items.map((i, idx) => (
            <article key={`${i.platform}-${i.handle}-${idx}`}>
              <strong>{i.platform} {i.handle}</strong>
              <p>{i.why_relevant || 'Raison non fournie'}</p>
              <span>Fit {i.niche_fit_score} | Engagement {i.engagement_score} | Reach {i.reach_score}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FooterLinks() {
  const links = [
    ['X', 'https://docs.x.com', iconOf('X')],
    ['YouTube', 'https://developers.google.com/youtube/v3', iconOf('YouTube')],
    ['Instagram', 'https://developers.facebook.com/docs/instagram-platform', iconOf('Instagram')],
    ['Twitch', 'https://dev.twitch.tv/docs/api', iconOf('Twitch')],
    ['Substack', 'https://substack.com', iconOf('Substack')],
    ['Meta', 'https://developers.facebook.com', iconOf('Meta')],
    ['Documentation', 'https://platform.openai.com/docs', 'https://cdn.simpleicons.org/readthedocs/ffffff'],
  ];
  return (
    <footer className="footer-links">
      {links.map(([label, href, icon]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer"><img src={icon} alt={label} loading="lazy" /><span>{label}</span></a>
      ))}
      <span className="disabled-link" aria-disabled="true">GitHub (inactif)</span>
    </footer>
  );
}

export default function App() {
  const [active, setActive] = useState('home');
  const [activeNetwork, setActiveNetwork] = useState('X');
  const [dashboards, setDashboards] = useState([]);
  const [connectors, setConnectors] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      setLoading(true); setError('');
      try {
        const [niches, status] = await Promise.all([api.getNiches(), api.getConnectorStatus()]);
        setConnectors(status?.connectors || null);
        const rows = await Promise.all((niches.items || []).map((niche) => api.getDashboard(niche.key)));
        setDashboards(rows);
      } catch (e) { setError(e.message || 'Chargement impossible.'); } finally { setLoading(false); }
    }
    boot();
  }, []);

  const socialRows = useMemo(() => dashboards.flatMap((d) => (d.socialHighlights || []).map((r) => ({ ...r, nicheLabel: d.niche?.label || 'Niche' }))), [dashboards]);
  const substackRows = useMemo(() => dashboards.flatMap((d) => (d.substackSignals || []).map((r) => ({ ...r, network: 'Substack', issueUrl: r.issueUrl || r.url, growthScore: Number(r.growthScore || 0), metrics: { growthScore: Number(r.growthScore || 0) } }))), [dashboards]);
  const rows = useMemo(() => socialRows.filter((r) => r.network === activeNetwork).sort((a, b) => Number(b.impactScore || 0) - Number(a.impactScore || 0)).slice(0, 8), [socialRows, activeNetwork]);
  const newsletters = useMemo(() => substackRows.filter((r) => weekly(r.publishedAt, 7)).sort((a, b) => Number(b.growthScore || 0) - Number(a.growthScore || 0)).slice(0, 6), [substackRows]);
  const totalKols = useMemo(() => new Set(socialRows.map((r) => String(r.authorHandle || r.authorName || '').toLowerCase()).filter(Boolean)).size, [socialRows]);
  const totalContent = socialRows.length + substackRows.length;

  return (
    <div className="page">
      <div className="background-mask" />
      <main className="dashboard-shell with-sidebar">
        <SideNav active={active} setActive={setActive} />
        <section className="main-panel">
          {active === 'home' ? <Home activeNetwork={activeNetwork} setActiveNetwork={setActiveNetwork} rows={rows} newsletters={newsletters} connectors={connectors} error={error} totalKols={totalKols} totalContent={totalContent} /> : null}
          {active === 'copywriting' ? <Copywriting /> : null}
          {active === 'alerts' ? <Alerts /> : null}
          {active === 'tasks' ? <Tasks /> : null}
          {active === 'automation' ? <Automation /> : null}
          <FooterLinks />
        </section>
      </main>
      {loading ? <div className="loading">Loading dashboard...</div> : null}
    </div>
  );
}

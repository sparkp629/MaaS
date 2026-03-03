import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ExternalLink,
  Feather,
  FlaskConical,
  Gift,
  House,
  Leaf,
  ListChecks,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from './api';

const USER_KEY = 'workspace-default';
const NETWORKS = Object.freeze([
  ['X', '/social-icons/x.svg', '#1d9bf0'],
  ['YouTube', '/social-icons/youtube.svg', '#ff0033'],
  ['Instagram', '/social-icons/instagram.svg', '#e4405f'],
  ['Twitch', 'https://cdn.simpleicons.org/twitch/9146ff', '#9146ff'],
  ['Meta', 'https://cdn.simpleicons.org/meta/0866ff', '#0866ff'],
]);
const SUBSTACK_ICON = '/social-icons/substack.svg';

const SURVEY_DEFAULT = {
  niche: 'intelligence-artificielle-fr',
  objective: 'generation-de-leads',
  channel: 'youtube',
  saasStage: 'acquisition',
  mainPain: 'manque-de-signaux-qualifies',
  email: '',
};

function normalizeNetworkName(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'youtube') return 'YouTube';
  if (raw === 'x' || raw === 'twitter') return 'X';
  if (raw === 'instagram') return 'Instagram';
  if (raw === 'twitch') return 'Twitch';
  if (raw === 'meta' || raw === 'facebook') return 'Meta';
  if (raw === 'substack') return 'Substack';
  return String(value || '');
}

function mapSurveyChannelToNetwork(channel) {
  const raw = String(channel || '').trim().toLowerCase();
  if (raw === 'youtube') return 'YouTube';
  if (raw === 'x' || raw === 'twitter') return 'X';
  if (raw === 'instagram') return 'Instagram';
  if (raw === 'twitch') return 'Twitch';
  return 'X';
}

function iconOf(network) {
  return Object.fromEntries([...NETWORKS, ['Substack', SUBSTACK_ICON]].map(([k, i]) => [k, i]))[network]
    || 'https://cdn.simpleicons.org/x/ffffff';
}
function avatarOf(row) {
  const direct = String(row?.authorAvatarUrl || '').trim();
  if (direct) return direct;
  const seed = encodeURIComponent(String(row?.authorHandle || row?.authorName || 'KOL').replace(/^@/, ''));
  return `https://ui-avatars.com/api/?name=${seed}&background=E8F3F8&color=0B3A4B&size=128&rounded=true`;
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

function extractYouTubeVideoId(urlValue) {
  const raw = String(urlValue || '').trim();
  if (!raw) return null;

  try {
    const u = new URL(raw);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const byQuery = u.searchParams.get('v');
      if (byQuery) return byQuery;
      const parts = u.pathname.split('/').filter(Boolean);
      const shortIdx = parts.findIndex((segment) => segment === 'shorts');
      if (shortIdx >= 0 && parts[shortIdx + 1]) return parts[shortIdx + 1];
      const embedIdx = parts.findIndex((segment) => segment === 'embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {
    return null;
  }

  return null;
}

function buildThumbnailCandidates(row) {
  const metricsThumb = row?.metrics?.thumbnailUrl;
  if (row.network !== 'YouTube') {
    return metricsThumb ? [metricsThumb] : [];
  }

  const videoId = row?.metrics?.videoId || extractYouTubeVideoId(row?.url);
  if (!videoId) {
    return metricsThumb ? [metricsThumb] : [];
  }

  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    metricsThumb,
  ];

  return candidates.filter(Boolean);
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
  const thumbCandidates = buildThumbnailCandidates(row);
  if (thumbCandidates.length) {
    const short = row.network === 'YouTube' && Boolean(row.metrics?.isShort);
    const className = ['preview-image', short || row.network === 'Instagram' ? 'vertical' : 'horizontal'].join(' ');
    return (
      <img
        className={className}
        src={thumbCandidates[0]}
        alt="preview"
        loading="lazy"
        data-src-idx="0"
        onError={(event) => {
          const idx = Number(event.currentTarget.getAttribute('data-src-idx') || '0') + 1;
          if (idx < thumbCandidates.length) {
            event.currentTarget.setAttribute('data-src-idx', String(idx));
            event.currentTarget.src = thumbCandidates[idx];
          }
        }}
      />
    );
  }
  if (row.url) return <a className="preview-fallback" href={row.url} target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a>;
  return <div className="preview-empty">Apercu indisponible</div>;
}

function Landing({ onStartSurvey, onOpenPayment, onOpenDashboard }) {
  return (
    <section className="funnel-screen">
      <div className="funnel-hero">
        <p className="funnel-kicker">Plateforme privee SaaS</p>
        <h1>Trouvez les signaux KOL qui convertissent, sans bruit.</h1>
        <p>
          Un diagnostic court, puis un dashboard prive avec contenus performants, profils pertinents et sujets
          newsletters relies a votre niche.
        </p>
        <div className="funnel-actions">
          <button type="button" className="action-btn" onClick={onStartSurvey}>
            Lancer le sondage
          </button>
          <button type="button" className="action-btn ghost" onClick={onOpenPayment}>
            Voir l'offre privee
          </button>
          <button type="button" className="action-btn ghost" onClick={onOpenDashboard}>
            Ouvrir le dashboard
          </button>
        </div>
      </div>

      <div className="mystery-list">
        <h2>Ce que l'offre contient</h2>
        <ul>
          <li>Selection KOL alignee sur votre avatar client</li>
          <li>Bibliotheque hebdomadaire de contenus qui performent</li>
          <li>Angles newsletters exploitables en vente B2B</li>
          <li>Matrice copywriting pour vos pages et messages</li>
          <li>Accompagnement strategique personnalise</li>
        </ul>
      </div>
    </section>
  );
}

function Survey({ value, onChange, onBack, onSubmit, loading }) {
  return (
    <section className="funnel-screen">
      <div className="survey-card">
        <h2>Sondage de qualification</h2>
        <p>Repondez en 60 secondes pour personnaliser votre espace prive.</p>

        <div className="survey-grid">
          <label>
            Niche
            <select value={value.niche} onChange={(e) => onChange({ ...value, niche: e.target.value })}>
              <option value="intelligence-artificielle-fr">Intelligence artificielle (FR)</option>
              <option value="saas">SaaS</option>
              <option value="startup">Startup</option>
              <option value="automation">Automation</option>
              <option value="tech">Tech</option>
            </select>
          </label>

          <label>
            Objectif prioritaire
            <select value={value.objective} onChange={(e) => onChange({ ...value, objective: e.target.value })}>
              <option value="generation-de-leads">Generer des leads qualifies</option>
              <option value="autorite-marche">Gagner en autorite de marche</option>
              <option value="acquisition-client">Accelerer l'acquisition client</option>
            </select>
          </label>

          <label>
            Canal prioritaire
            <select value={value.channel} onChange={(e) => onChange({ ...value, channel: e.target.value })}>
              <option value="youtube">YouTube</option>
              <option value="x">X</option>
              <option value="instagram">Instagram</option>
              <option value="twitch">Twitch</option>
            </select>
          </label>

          <label>
            Etape SaaS
            <select value={value.saasStage} onChange={(e) => onChange({ ...value, saasStage: e.target.value })}>
              <option value="acquisition">Acquisition</option>
              <option value="activation">Activation</option>
              <option value="retention">Retention</option>
              <option value="upsell">Expansion / Upsell</option>
            </select>
          </label>

          <label className="span-2">
            Blocage principal
            <select value={value.mainPain} onChange={(e) => onChange({ ...value, mainPain: e.target.value })}>
              <option value="manque-de-signaux-qualifies">Manque de signaux qualifies</option>
              <option value="angles-contenus-faibles">Angles contenus faibles</option>
              <option value="mauvais-fit-kol">Mauvais fit KOL</option>
            </select>
          </label>
        </div>

        <div className="mail-capture">
          <label>
            Email (capture non active pour le moment)
            <input
              type="email"
              placeholder="name@company.com"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
            />
          </label>
        </div>

        <div className="funnel-actions">
          <button type="button" className="action-btn ghost" onClick={onBack}>Retour</button>
          <button type="button" className="action-btn" onClick={onSubmit} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            Creer mon espace
          </button>
        </div>
      </div>
    </section>
  );
}

function PaymentPage({ onBack, onOpenDashboard }) {
  return (
    <section className="funnel-screen">
      <div className="payment-card">
        <h2>Offre privee High Ticket</h2>
        <p>Positionnement premium: acces reserve, sans prix public affiche.</p>

        <div className="offer-columns">
          <article>
            <h3>Ce qui est inclus</h3>
            <ul>
              <li>Dashboard prive avec signaux KOL verifies</li>
              <li>Selection de contenus performants par priorite business</li>
              <li>Sujets newsletters utiles pour closing et autorite</li>
              <li>Systeme copywriting alimente par votre base vectorielle</li>
              <li>Support strategique pour votre plan d'execution</li>
            </ul>
          </article>
          <article>
            <h3>Arbitrage commercial</h3>
            <ul>
              <li>Prix cache: filtre fort, mais baisse le taux de prise de rendez-vous</li>
              <li>Alternative recommandee: \"a partir de\" + call de qualification</li>
              <li>Concurrents: majorite d'offres self-serve low ticket</li>
              <li>Positionnement conseille: audit + plan + execution guidee, pas simple outil</li>
            </ul>
          </article>
          <article>
            <h3>Formats d'engagement possibles</h3>
            <ul>
              <li>Diagnostic intensif (court, decisif)</li>
              <li>Implementation assistee (90 jours)</li>
              <li>Partenariat continu (pilotage mensuel)</li>
            </ul>
          </article>
        </div>

        <div className="funnel-actions">
          <button type="button" className="action-btn ghost" onClick={onBack}>Retour</button>
          <button type="button" className="action-btn" onClick={onOpenDashboard}>Acceder au dashboard</button>
        </div>
      </div>
    </section>
  );
}

function SideNav({ active, setActive }) {
  const tabs = [
    ['home', 'Home', House],
    ['copywriting', 'Copywriting', null],
    ['substack', 'Substack', null],
    ['alerts', 'Alertes', Bell],
    ['tasks', 'Task', ListChecks],
    ['automation', 'Automation', Bot],
    ['tests', 'Tests', FlaskConical],
  ];
  return (
    <aside className="side-nav">
      <div className="side-brand">MaaS</div>
      {tabs.map(([key, label, Icon]) => (
        <button key={key} type="button" className={`side-item ${active === key ? 'active' : ''}`} onClick={() => setActive(key)}>
          {key === 'copywriting' ? <span className="copy-icon"><Leaf size={14} /><Feather size={15} /></span> : null}
          {key === 'substack' ? <img className="substack-side-icon" src={SUBSTACK_ICON} alt="Substack" loading="lazy" /> : null}
          {key !== 'copywriting' && key !== 'substack' ? <Icon size={18} /> : null}
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}

function Home({ activeNetwork, setActiveNetwork, rows, connectors, error }) {
  return (
    <>
      <header className="hero">
        <h1>Leaderboard fusionne avec apercus media</h1>
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
                    <img
                      className="row-avatar"
                      src={avatarOf(row)}
                      alt={row.authorHandle || row.authorName || 'avatar'}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = 'https://ui-avatars.com/api/?name=KOL&background=E8F3F8&color=0B3A4B&size=128&rounded=true';
                      }}
                    />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true); setError('');
    try {
      const p = await api.getTelegramAlertConfig(USER_KEY);
      setPayload(p);
    } catch (e) { setError(e.message || 'Chargement impossible.'); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  return (
    <section className="utility-panel">
      {loading ? <div className="inline-status"><Loader2 size={16} className="spin" /> Chargement...</div> : null}
      {error ? <div className="alert error">{error}</div> : null}
      {payload ? (
        <div className="alerts-single">
          <div className="qr-card qr-card-wide qr-only">
            {payload.qrCodeUrl ? (
              <img className="qr-image qr-image-large" src={payload.qrCodeUrl} alt="QR Telegram" loading="lazy" />
            ) : (
              <div className="empty">QR indisponible. Configuration Telegram incomplete.</div>
            )}
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

function SubstackTab() {
  return (
    <section className="utility-panel">
      <h2>Substack</h2>
      <p>Section en preparation.</p>
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

function TestLab({ selectedNiche, survey }) {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  async function runTest(label, fn) {
    const startedAt = new Date().toISOString();
    try {
      const output = await fn();
      setResults((prev) => [{ label, ok: true, startedAt, output: JSON.stringify(output).slice(0, 220) }, ...prev]);
    } catch (error) {
      setResults((prev) => [{ label, ok: false, startedAt, output: String(error.message || error).slice(0, 220) }, ...prev]);
    }
  }

  async function runAll() {
    setRunning(true);
    try {
      await runTest('Survey -> DB', () => api.saveOnboarding({
        nicheKey: selectedNiche,
        objective: survey.objective || 'generation-de-leads',
        budgetRange: 'high-ticket',
      }));
      await runTest('KOL prompt -> DB', () => api.runKolPromptSync({
        nicheKey: selectedNiche,
        surveyAnswers: survey,
        countryCode: 'FR',
        language: 'fr',
        limit: 10,
      }));
      await runTest('QR Telegram', () => api.getTelegramAlertConfig(USER_KEY));
      await runTest('Copywriting RAG', () => api.generateCopywritingRag({
        productName: 'Offre high ticket',
        productDescription: 'Test client',
        niche: selectedNiche,
        tone: 'informatif',
      }));
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="utility-panel">
      <h2>Tests parcours client</h2>
      <p>Validation du maillage interne et des fonctions critiques avant mise en production.</p>
      <button type="button" className="action-btn" onClick={runAll} disabled={running}>
        {running ? <Loader2 size={16} className="spin" /> : <FlaskConical size={16} />} Lancer les tests
      </button>
      <div className="test-list">
        {results.length ? results.map((row) => (
          <article key={`${row.label}-${row.startedAt}`} className={`test-item ${row.ok ? 'ok' : 'ko'}`}>
            <strong>{row.ok ? 'OK' : 'KO'} - {row.label}</strong>
            <p>{row.output}</p>
          </article>
        )) : <div className="empty">Aucun test lance.</div>}
      </div>
    </section>
  );
}

export default function App() {
  const [view, setView] = useState('landing');
  const [survey, setSurvey] = useState(SURVEY_DEFAULT);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [active, setActive] = useState('home');
  const [activeNetwork, setActiveNetwork] = useState('X');
  const [selectedNiche, setSelectedNiche] = useState(SURVEY_DEFAULT.niche);
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
        const keys = (niches.items || []).map((niche) => niche.key).filter(Boolean);
        const orderedKeys = ['intelligence-artificielle-fr', ...keys.filter((key) => key !== 'intelligence-artificielle-fr')];
        const settled = await Promise.allSettled(orderedKeys.map((key) => api.getDashboard(key)));
        const okRows = settled
          .filter((item) => item.status === 'fulfilled')
          .map((item) => item.value);

        if (okRows.length) {
          setDashboards(okRows);
        } else {
          const fallback = await api.getDashboard('intelligence-artificielle-fr');
          setDashboards([fallback]);
        }

        const savedSurveyRaw = localStorage.getItem('maas_survey_capture');
        if (savedSurveyRaw) {
          try {
            const savedSurvey = JSON.parse(savedSurveyRaw);
            setSurvey((prev) => ({ ...prev, ...savedSurvey }));
            if (savedSurvey?.niche) setSelectedNiche(savedSurvey.niche);
            if (savedSurvey?.channel) setActiveNetwork(mapSurveyChannelToNetwork(savedSurvey.channel));
          } catch {
            // ignore malformed cache
          }
        }
      } catch (e) { setError(e.message || 'Chargement impossible.'); } finally { setLoading(false); }
    }
    boot();
  }, []);

  const currentDashboard = useMemo(
    () => dashboards.find((d) => d.niche?.key === selectedNiche) || dashboards[0] || null,
    [dashboards, selectedNiche]
  );

  const socialRows = useMemo(
    () =>
      (currentDashboard?.socialHighlights || []).map((r) => ({
        ...r,
        network: normalizeNetworkName(r.network),
        nicheLabel: currentDashboard?.niche?.label || 'Niche',
      })),
    [currentDashboard]
  );
  const rows = useMemo(() => {
    const ordered = socialRows
      .filter((r) => normalizeNetworkName(r.network) === activeNetwork)
      .sort((a, b) => Number(b.impactScore || 0) - Number(a.impactScore || 0));
    const seen = new Set();
    const uniqueByKol = [];
    for (const row of ordered) {
      const key = String(row.authorHandle || row.authorName || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      uniqueByKol.push(row);
      if (uniqueByKol.length >= 5) break;
    }
    return uniqueByKol;
  }, [socialRows, activeNetwork]);

  async function handleSurveySubmit() {
    setSubmittingSurvey(true);
    setError('');
    try {
      const payload = {
        nicheKey: survey.niche,
        objective: survey.objective,
        budgetRange: 'high-ticket',
      };
      await api.saveOnboarding(payload);
      await api.runKolPromptSync({
        nicheKey: survey.niche,
        surveyAnswers: survey,
        countryCode: 'FR',
        language: 'fr',
        limit: 10,
      }).catch(() => null);
      localStorage.setItem('maas_survey_capture', JSON.stringify({
        ...survey,
        capturedAt: new Date().toISOString(),
      }));
      setSelectedNiche(survey.niche);
      setActiveNetwork(mapSurveyChannelToNetwork(survey.channel));
      setView('dashboard');
    } catch (e) {
      setError(e.message || 'Validation sondage impossible.');
    } finally {
      setSubmittingSurvey(false);
    }
  }

  return (
    <div className="page">
      {view === 'landing' ? (
        <main className="dashboard-shell">
          <Landing
            onStartSurvey={() => setView('survey')}
            onOpenPayment={() => setView('payment')}
            onOpenDashboard={() => setView('dashboard')}
          />
        </main>
      ) : null}

      {view === 'survey' ? (
        <main className="dashboard-shell">
          <Survey
            value={survey}
            onChange={setSurvey}
            onBack={() => setView('landing')}
            onSubmit={handleSurveySubmit}
            loading={submittingSurvey}
          />
        </main>
      ) : null}

      {view === 'payment' ? (
        <main className="dashboard-shell">
          <PaymentPage
            onBack={() => setView('landing')}
            onOpenDashboard={() => setView('dashboard')}
          />
        </main>
      ) : null}

      {view === 'dashboard' ? (
        <main className="dashboard-shell with-sidebar">
          <SideNav active={active} setActive={setActive} />
          <section className="main-panel">
            {active === 'home' ? <Home activeNetwork={activeNetwork} setActiveNetwork={setActiveNetwork} rows={rows} connectors={connectors} error={error} /> : null}
            {active === 'copywriting' ? <Copywriting /> : null}
            {active === 'substack' ? <SubstackTab /> : null}
            {active === 'alerts' ? <Alerts /> : null}
            {active === 'tasks' ? <Tasks /> : null}
            {active === 'automation' ? <Automation /> : null}
            {active === 'tests' ? <TestLab selectedNiche={selectedNiche} survey={survey} /> : null}
          </section>
        </main>
      ) : null}

      {loading ? <div className="loading">Loading dashboard...</div> : null}
    </div>
  );
}

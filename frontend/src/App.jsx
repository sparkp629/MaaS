import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  Building2,
  Check,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  Eye,
  ExternalLink,
  Feather,
  Gift,
  House,
  LineChart,
  Leaf,
  ListChecks,
  Loader2,
  Mail,
  MailCheck,
  PhoneCall,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from './api';

const USER_KEY = 'workspace-default';
const NETWORKS = Object.freeze([
  ['X', '/social-icons/x.svg', '#1d9bf0'],
  ['YouTube', '/social-icons/youtube.svg', '#ff0033'],
  ['Instagram', '/social-icons/instagram.svg', '#e4405f'],
  ['Twitch', '/social-icons/twitch.svg', '#9146ff'],
  ['Meta', '/social-icons/meta.svg', '#0866ff'],
]);
const SUBSTACK_ICON = '/social-icons/substack.svg';
const SAAS_NAME = 'NOCTIS SIGNAL';

const VIEW_PATHS = Object.freeze({
  landing: '/landing',
  survey: '/survey',
  offers: '/offers',
  payment: '/payment',
  dashboard: '/dashboard',
});

const SURVEY_DEFAULT = {
  niche: 'intelligence-artificielle-fr',
  objective: 'generation-de-leads',
  channel: 'youtube',
  saasStage: 'acquisition',
  mainPain: 'manque-de-signaux-qualifies',
  focusTasks: ['benchmark-concurrents'],
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

const SERVICE_PILLS = [
  { icon: ListChecks, title: 'Sondage onboarding' },
  { icon: LineChart, title: 'Etude SaaS client' },
  { icon: PhoneCall, title: 'Call qualification' },
  { icon: MailCheck, title: 'Reception mail' },
  { icon: Eye, title: 'Dashboard presence mediatique' },
];

function Landing({ onStartSurvey }) {
  return (
    <section className="funnel-screen">
      <div className="landing-brand">
        <h1>{SAAS_NAME}</h1>
      </div>

      <div className="journey-track" aria-label="Parcours utilisateur">
        {SERVICE_PILLS.map((service, idx) => {
          const Icon = service.icon;
          return (
            <div key={service.title} className="journey-step">
              <div className="journey-node" title={service.title} aria-label={service.title}>
                <Icon size={24} />
              </div>
              {idx < SERVICE_PILLS.length - 1 ? <span className="journey-arrow">-&gt;</span> : null}
            </div>
          );
        })}
      </div>

      <div className="funnel-actions">
        <button type="button" className="action-btn" onClick={onStartSurvey}>
          Lancer le sondage
        </button>
      </div>
    </section>
  );
}

const SURVEY_TASK_OPTIONS = [
  { value: 'benchmark-concurrents', label: 'Benchmark industry players' },
  { value: 'market-shifts', label: 'Track market share shifts and new players' },
  { value: 'audience-expansion', label: 'Understand and expand my audience' },
  { value: 'consumer-trends', label: 'Spot consumer and market trends' },
  { value: 'traffic-analysis', label: 'Analyser les sources de trafic concurrents' },
  { value: 'ai-signals', label: "Explorer les signaux concurrentiels de l'IA generative" },
];

const SURVEY_OBJECTIVE_OPTIONS = [
  { value: 'generation-de-leads', label: 'Analyser les concurrents et tendances du marche' },
  { value: 'autorite-marche', label: 'Optimiser autorite et strategie de croissance' },
  { value: 'acquisition-client', label: 'Accroitre acquisition et conversion client' },
];

function Survey({ value, onChange, onBack, onSubmit, loading }) {
  const totalSteps = 5;
  const [step, setStep] = useState(1);

  const completion = Math.round((step / totalSteps) * 100);

  function toggleTask(taskValue) {
    const current = Array.isArray(value.focusTasks) ? value.focusTasks : [];
    if (current.includes(taskValue)) {
      onChange({ ...value, focusTasks: current.filter((item) => item !== taskValue) });
      return;
    }
    onChange({ ...value, focusTasks: [...current, taskValue] });
  }

  function canContinue() {
    if (step === 1) return Boolean(value.objective);
    if (step === 2) return Array.isArray(value.focusTasks) && value.focusTasks.length > 0;
    if (step === 3) return Boolean(value.channel);
    if (step === 4) return Boolean(value.niche) && Boolean(value.saasStage);
    return true;
  }

  function handleBack() {
    if (step === 1) {
      onBack();
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep((s) => Math.min(totalSteps, s + 1));
      return;
    }
    onSubmit();
  }

  return (
    <section className="funnel-screen survey-screen">
      <div className="survey-wizard">
        <div className="survey-progress-track">
          <div className="survey-progress-value" style={{ width: `${completion}%` }} />
        </div>
        <div className="survey-topline">
          <button type="button" className="survey-back" onClick={handleBack}>
            <ChevronLeft size={18} /> Retour
          </button>
          <span>{step}/{totalSteps}</span>
        </div>

        {step === 1 ? (
          <div className="survey-step">
            <h2>Sur quoi souhaitez-vous vous concentrer en priorite ?</h2>
            <p>Nous personaliserons votre parcours en fonction de votre selection.</p>
            <div className="survey-options">
              {SURVEY_OBJECTIVE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`survey-option ${value.objective === option.value ? 'active' : ''}`}
                  onClick={() => onChange({ ...value, objective: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="survey-step">
            <h2>What's your focus within this area?</h2>
            <p>Choose the tasks that are most relevant to you.</p>
            <div className="survey-options">
              {SURVEY_TASK_OPTIONS.map((option) => {
                const active = (value.focusTasks || []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`survey-option checkbox ${active ? 'active' : ''}`}
                    onClick={() => toggleTask(option.value)}
                  >
                    <span className={`check-box ${active ? 'checked' : ''}`}>{active ? <Check size={14} /> : null}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="survey-step">
            <h2>Quel canal doit etre prioritaire dans votre dashboard ?</h2>
            <p>Ce choix pilotera le premier reseau affiche apres le sondage.</p>
            <div className="survey-options compact">
              {[
                ['youtube', 'YouTube'],
                ['x', 'X (Twitter)'],
                ['instagram', 'Instagram'],
                ['twitch', 'Twitch'],
              ].map(([valueKey, label]) => (
                <button
                  key={valueKey}
                  type="button"
                  className={`survey-option ${value.channel === valueKey ? 'active' : ''}`}
                  onClick={() => onChange({ ...value, channel: valueKey })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="survey-step">
            <h2>Cadrez votre contexte SaaS</h2>
            <p>Nous utiliserons ces informations pour affiner la selection KOL.</p>
            <div className="survey-inline-grid">
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
                Etape SaaS
                <select value={value.saasStage} onChange={(e) => onChange({ ...value, saasStage: e.target.value })}>
                  <option value="acquisition">Acquisition</option>
                  <option value="activation">Activation</option>
                  <option value="retention">Retention</option>
                  <option value="upsell">Expansion / Upsell</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="survey-step">
            <h2>Quelle est votre adresse de messagerie professionnelle ?</h2>
            <p>Vous pourrez la modifier plus tard.</p>
            <div className="survey-email-wrap">
              <Mail size={16} />
              <input
                type="email"
                placeholder="name@company.com"
                value={value.email}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
              />
            </div>
          </div>
        ) : null}

        <div className="survey-actions">
          {step === 5 ? (
            <button type="button" className="action-btn ghost" onClick={onSubmit} disabled={loading}>
              Ignorer
            </button>
          ) : null}
          <button type="button" className="action-btn" onClick={handleNext} disabled={!canContinue() || loading}>
            {loading ? <Loader2 size={16} className="spin" /> : null}
            {step < totalSteps ? 'Suivant' : 'Creer mon espace'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function OffersPage({ onBack, onOpenPayment }) {
  return (
    <section className="funnel-screen">
      <div className="offers-layout">
        <section className="offers-left">
          <p className="offers-brand">MaaS</p>
          <h2>MANAGE & GROW YOUR INFLUENCER PROGRAM</h2>
          <p>
            Positionnement high-ticket: accompagnement strategique + execution guidee.
            L'outil seul ne suffit pas, on pilote le plan avec vous.
          </p>
          <ul>
            <li><Check size={16} /> Find perfect-fit creators at scale</li>
            <li><Check size={16} /> Streamline influencer outreach</li>
            <li><Check size={16} /> Track campaign performance automatically</li>
            <li><Check size={16} /> Pay creators worldwide instantly</li>
          </ul>
          <div className="offer-tiers">
            <article>
              <h3>Diagnostic intensif</h3>
              <p>A partir de 2 500 EUR</p>
            </article>
            <article className="highlighted">
              <h3>Sprint high-ticket</h3>
              <p>A partir de 5 000 EUR</p>
            </article>
            <article>
              <h3>Pilotage mensuel</h3>
              <p>A partir de 9 000 EUR</p>
            </article>
          </div>
        </section>

        <section className="offers-right">
          <div className="request-card">
            <h3>Request a Demo</h3>
            <p>Enter your details and we'll find the best way to help you.</p>
            <label>Name *<input type="text" placeholder="Your name" /></label>
            <label>Business email *<input type="email" placeholder="you@company.com" /></label>
            <label>Company *<input type="text" placeholder="Company name" /></label>
            <button type="button" className="action-btn" onClick={onOpenPayment}>
              Continuer vers paiement <ArrowRight size={16} />
            </button>
            <button type="button" className="action-btn ghost" onClick={onBack}>Retour</button>
          </div>
        </section>
      </div>
    </section>
  );
}

function PaymentPage({ onBack, onOpenDashboard }) {
  const [cycle, setCycle] = useState('mensuel');
  return (
    <section className="funnel-screen">
      <div className="payment-split">
        <section className="payment-left">
          <h2>Try MaaS for free</h2>
          <p>Essai gratuit 7 jours - annulation a tout moment</p>
          <ol>
            <li>
              <CircleDollarSign size={18} />
              <div>
                <strong>Aujourd'hui: configurez votre essai gratuit</strong>
                <p>Ajoutez vos informations de paiement. 0 EUR aujourd'hui.</p>
              </div>
            </li>
            <li>
              <CreditCard size={18} />
              <div>
                <strong>Saisissez vos informations de paiement</strong>
                <p>Vous ne serez pas facture avant la fin de l'essai.</p>
              </div>
            </li>
            <li>
              <Building2 size={18} />
              <div>
                <strong>Activation de votre abonnement</strong>
                <p>Votre espace est active, vous pouvez entrer dans le dashboard prive.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="payment-right">
          <h3>Veille concurrentielle et SEO</h3>
          <ul>
            <li><Check size={16} /> 3 mois de donnees historiques</li>
            <li><Check size={16} /> Website analysis</li>
            <li><Check size={16} /> Backlink Analytics</li>
            <li><Check size={16} /> Rank Tracker</li>
            <li><Check size={16} /> Site Audit</li>
          </ul>
          <div className="billing-cycle">
            <p>Cycle de facturation</p>
            <label>
              <input type="radio" checked={cycle === 'annuel'} onChange={() => setCycle('annuel')} />
              <span>Annuel - meilleur ratio qualite/prix</span>
            </label>
            <label>
              <input type="radio" checked={cycle === 'mensuel'} onChange={() => setCycle('mensuel')} />
              <span>Mensuel</span>
            </label>
            <div className="billing-total">
              <span>Du aujourd'hui</span>
              <strong>0 EUR</strong>
            </div>
          </div>
          <div className="funnel-actions">
            <button type="button" className="action-btn ghost" onClick={onBack}>Retour</button>
            <button type="button" className="action-btn" onClick={onOpenDashboard}>
              Suivant <ArrowRight size={16} />
            </button>
          </div>
        </section>
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

function normalizeViewFromPath(pathname) {
  const raw = String(pathname || '/').trim().toLowerCase();
  if (raw === '/survey') return 'survey';
  if (raw === '/offers') return 'offers';
  if (raw === '/payment') return 'payment';
  if (raw === '/dashboard') return 'dashboard';
  return 'landing';
}

export default function App() {
  const [view, setView] = useState(() =>
    typeof window === 'undefined' ? 'landing' : normalizeViewFromPath(window.location.pathname)
  );
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetPath = VIEW_PATHS[view] || VIEW_PATHS.landing;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [view]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => {
      setView(normalizeViewFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
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
      const refreshed = await api.getDashboard(survey.niche).catch(() => null);
      if (refreshed?.niche?.key) {
        setDashboards((prev) => {
          const rest = prev.filter((item) => item?.niche?.key !== refreshed.niche.key);
          return [refreshed, ...rest];
        });
      }
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
          />
        </main>
      ) : null}

      {view === 'offers' ? (
        <main className="dashboard-shell">
          <OffersPage
            onBack={() => setView('landing')}
            onOpenPayment={() => setView('payment')}
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
            onBack={() => setView('offers')}
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
          </section>
        </main>
      ) : null}

      {loading ? <div className="loading">Loading dashboard...</div> : null}
    </div>
  );
}

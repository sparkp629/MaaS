import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  House,
  FilePenLine,
  Bell,
  ListChecks,
  Bot,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from './api';

const NETWORK_TABS = [
  {
    key: 'X',
    label: 'X',
    icon: 'https://cdn.simpleicons.org/x/ffffff',
    accent: '#1d9bf0',
  },
  {
    key: 'YouTube',
    label: 'YouTube',
    icon: 'https://cdn.simpleicons.org/youtube/ff0000',
    accent: '#ff0033',
  },
  {
    key: 'Instagram',
    label: 'Instagram',
    icon: 'https://cdn.simpleicons.org/instagram/e4405f',
    accent: '#e4405f',
  },
  {
    key: 'Twitch',
    label: 'Twitch',
    icon: 'https://cdn.simpleicons.org/twitch/9146ff',
    accent: '#9146ff',
  },
  {
    key: 'Substack',
    label: 'Substack',
    icon: 'https://cdn.simpleicons.org/substack/ff6719',
    accent: '#ff6719',
  },
  {
    key: 'Meta',
    label: 'Meta',
    icon: 'https://cdn.simpleicons.org/meta/0866ff',
    accent: '#0866ff',
  },
];

const SIDE_TABS = [
  { key: 'home', label: 'Home', icon: House },
  { key: 'copywriting', label: 'Copywriting', icon: FilePenLine },
  { key: 'alerts', label: 'Alertes', icon: Bell },
  { key: 'tasks', label: 'Task', icon: ListChecks },
  { key: 'automation', label: 'Automation', icon: Bot },
];

const DEFAULT_NETWORK = 'X';
const NETWORK_META = Object.fromEntries(NETWORK_TABS.map((tab) => [tab.key, tab]));

function compactNumber(value) {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function preview180(value) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trimEnd()}...`;
}

function relativeDate(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const locale = typeof navigator !== 'undefined' ? navigator.language || 'fr-FR' : 'fr-FR';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (abs < 60) return rtf.format(diffSeconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  return rtf.format(Math.round(diffSeconds / 86400), 'day');
}

function parseYoutubeVideoId(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim() || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v');
      if (fromQuery) return fromQuery;

      const parts = parsed.pathname.split('/').filter(Boolean);
      const embedIndex = parts.findIndex((p) => p === 'embed');
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeSocialRows(dashboards) {
  return dashboards.flatMap((dash) =>
    (dash.socialHighlights || []).map((item) => ({
      ...item,
      nicheKey: dash.niche?.key || 'unknown',
      nicheLabel: dash.niche?.label || 'Niche',
    }))
  );
}

function normalizeSubstackRows(dashboards) {
  return dashboards.flatMap((dash) =>
    (dash.substackSignals || []).map((item) => ({
      ...item,
      network: 'Substack',
      nicheKey: dash.niche?.key || 'unknown',
      nicheLabel: dash.niche?.label || 'Niche',
      authorName: item.publication,
      title: item.topic,
      hook: item.angle || item.topic,
      preview: preview180(item.angle || item.topic),
      url: item.issueUrl,
      metrics: {
        openRate: item.openRate,
        ctr: item.ctr,
        growthScore: item.growthScore,
      },
      impactScore: Number(item.growthScore || 0),
      publishedAt: item.publishedAt,
    }))
  );
}

function computeTrend(row) {
  const metrics = row.metrics || {};

  if (row.network === 'X') {
    const impressions = Number(metrics.impressions || row.views || 0);
    const interactions =
      Number(metrics.likes || 0) +
      Number(metrics.replies || 0) +
      Number(metrics.reposts || 0) +
      Number(metrics.quotes || 0);
    const rate = impressions > 0 ? (interactions / impressions) * 100 : Number(row.engagementRate || 0);
    return {
      direction: rate >= 1.5 ? 'up' : 'down',
      value: Number(rate.toFixed(2)),
      label: 'Engagement = interactions / impressions',
    };
  }

  if (row.network === 'YouTube') {
    const views = Number(metrics.views || row.views || 0);
    const interactions = Number(metrics.likes || 0) + Number(metrics.comments || 0);
    const rate = views > 0 ? (interactions / views) * 100 : Number(row.engagementRate || 0);
    return {
      direction: rate >= 2.5 ? 'up' : 'down',
      value: Number(rate.toFixed(2)),
      label: 'Engagement = (likes + comments) / views',
    };
  }

  if (row.network === 'Substack') {
    const growth = Number(row.metrics?.growthScore || row.growthScore || 0);
    return {
      direction: growth >= 70 ? 'up' : 'down',
      value: growth,
      label: 'Growth score compare la traction relative des sujets',
    };
  }

  const fallback = Number(row.engagementRate || 0);
  return {
    direction: fallback >= 2 ? 'up' : 'down',
    value: Number(fallback.toFixed(2)),
    label: 'Engagement rate',
  };
}

function getMetricsLine(row) {
  const metrics = row.metrics || {};

  if (row.network === 'X') {
    const interactions =
      Number(metrics.likes || 0) +
      Number(metrics.replies || 0) +
      Number(metrics.reposts || 0) +
      Number(metrics.quotes || 0);

    return [
      `Impressions: ${compactNumber(metrics.impressions || row.views || 0)}`,
      `Interactions: ${compactNumber(interactions)}`,
      `Likes: ${compactNumber(metrics.likes || 0)}`,
    ];
  }

  if (row.network === 'YouTube') {
    return [
      `Views: ${compactNumber(metrics.views || row.views || 0)}`,
      `Likes: ${compactNumber(metrics.likes || 0)}`,
      `Comments: ${compactNumber(metrics.comments || 0)}`,
    ];
  }

  if (row.network === 'Substack') {
    return [
      `Open rate: ${Number(metrics.openRate || row.openRate || 0).toFixed(1)}%`,
      `CTR: ${Number(metrics.ctr || row.ctr || 0).toFixed(1)}%`,
      `Growth score: ${Math.round(Number(metrics.growthScore || row.growthScore || 0))}`,
    ];
  }

  return [
    `Views: ${compactNumber(row.views || 0)}`,
    `Impact: ${Math.round(Number(row.impactScore || 0))}`,
    `Engagement: ${Number(row.engagementRate || 0).toFixed(2)}%`,
  ];
}

function PreviewInline({ row }) {
  if (row.network === 'YouTube') {
    const videoId = parseYoutubeVideoId(row.url);
    if (videoId) {
      return (
        <iframe
          className="preview-frame"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`YouTube-${row.id || videoId}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      );
    }
  }

  if (row.network === 'X' && row.url) {
    return (
      <iframe
        className="preview-frame x-frame"
        src={`https://twitframe.com/show?url=${encodeURIComponent(row.url)}`}
        title={`X-${row.id || row.url}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (row.metrics?.thumbnailUrl) {
    return <img className="preview-image" src={row.metrics.thumbnailUrl} alt="preview" loading="lazy" />;
  }

  if (row.network === 'Substack') {
    return (
      <div className="preview-substack">
        <strong>{row.authorName || 'Substack'}</strong>
        <p>{preview180(row.title || row.hook || '')}</p>
      </div>
    );
  }

  return <div className="preview-empty">Apercu indisponible</div>;
}

function NetworkTabs({ activeNetwork, onChange }) {
  return (
    <div className="network-tabs" role="tablist" aria-label="Reseaux">
      {NETWORK_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`network-tab ${activeNetwork === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
          title={tab.label}
          style={{ '--tab-accent': tab.accent }}
        >
          <img src={tab.icon} alt={tab.label} loading="lazy" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function SideNav({ activeSection, onChange }) {
  return (
    <aside className="side-nav">
      <div className="side-brand">MaaS</div>
      <div className="side-items" role="tablist" aria-label="Sections dashboard">
        {SIDE_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`side-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => onChange(item.key)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function FooterLinks() {
  return (
    <footer className="footer-links">
      <a href="https://docs.x.com" target="_blank" rel="noreferrer">Docs X</a>
      <a href="https://developers.google.com/youtube/v3" target="_blank" rel="noreferrer">Docs YouTube</a>
      <a href="https://developers.facebook.com/docs/instagram-platform" target="_blank" rel="noreferrer">Docs Instagram</a>
      <a href="https://dev.twitch.tv/docs/api" target="_blank" rel="noreferrer">Docs Twitch</a>
      <a href="https://substack.com" target="_blank" rel="noreferrer">Substack</a>
      <span className="disabled-link" aria-disabled="true">GitHub (bientot)</span>
    </footer>
  );
}

function HomeSection({
  activeNetwork,
  setActiveNetwork,
  rows,
  newsletters,
  connectors,
  error,
  totalKols,
  totalContent,
}) {
  return (
    <>
      <header className="hero compact-hero">
        <h1>Top contenus performants, regroupes et lisibles en un seul ecran</h1>
        <div className="hero-chips">
          <span>{compactNumber(totalKols)} KOLs tracked</span>
          <span>{compactNumber(totalContent)} contenus indexes</span>
          <span>{activeNetwork} live ranking</span>
        </div>
      </header>

      <NetworkTabs activeNetwork={activeNetwork} onChange={setActiveNetwork} />

      {error ? <div className="alert error">{error}</div> : null}
      {connectors && !connectors.x?.configured ? (
        <div className="alert info">
          X API not configured yet. Add `X_BEARER_TOKEN` in `.env` to enrich live ranking.
        </div>
      ) : null}

      <section className="merged-body-card">
        <div className="feed-shell" aria-live="polite">
          <section className="feed">
            {rows.length ? (
              rows.map((row, index) => {
                const trend = computeTrend(row);
                const metrics = getMetricsLine(row);

                return (
                  <article key={row.id || row.url || `${row.network}-${index}`} className="feed-row">
                    <div className="row-rank">#{index + 1}</div>

                    <div className="row-main">
                      <div className="row-head">
                        <div className="row-identity">
                          <img
                            className="row-network-icon"
                            src={NETWORK_META[row.network]?.icon || NETWORK_META.X.icon}
                            alt={row.network || 'network'}
                            loading="lazy"
                          />
                          {row.authorAvatarUrl ? (
                            <img
                              className="row-avatar"
                              src={row.authorAvatarUrl}
                              alt={row.authorHandle || row.authorName || 'profile'}
                              loading="lazy"
                            />
                          ) : null}
                          <strong>{row.authorHandle || row.authorName || row.publication || 'Source'}</strong>
                        </div>
                        <span className="row-niche">{row.nicheLabel}</span>
                        <span className={`trend ${trend.direction}`} title={trend.label}>
                          {trend.direction === 'up' ? '^' : 'v'} {trend.value}
                        </span>
                      </div>

                      <p className="row-preview">{preview180(row.hook || row.preview || row.title || row.topic || '')}</p>

                      <div className="row-metrics">
                        {metrics.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>

                      <div className="row-footer">
                        <span>{relativeDate(row.publishedAt)}</span>
                        {row.url ? (
                          <a href={row.url} target="_blank" rel="noreferrer">
                            Official source <ExternalLink size={13} />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="row-preview-pane">
                      <PreviewInline row={row} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty">Aucun contenu pour ce reseau.</div>
            )}
          </section>
        </div>

        <section className="newsletter-shell">
          <div className="newsletter-head">
            <h2>Sujets newsletters performants</h2>
            <span>Top signaux Substack</span>
          </div>

          <div className="newsletter-list">
            {newsletters.length ? (
              newsletters.map((item) => (
                <article key={item.id || item.issueUrl} className="newsletter-item">
                  <div>
                    <strong>{item.publication || item.authorName || 'Substack'}</strong>
                    <p>{preview180(item.topic || item.title || item.hook || '')}</p>
                  </div>
                  <div className="newsletter-metrics">
                    <span>Open {Number(item.openRate || item.metrics?.openRate || 0).toFixed(1)}%</span>
                    <span>CTR {Number(item.ctr || item.metrics?.ctr || 0).toFixed(1)}%</span>
                    <span>Score {Math.round(Number(item.growthScore || item.metrics?.growthScore || 0))}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">Aucun signal Substack dans la base locale.</div>
            )}
          </div>
        </section>
      </section>
    </>
  );
}

function CopywritingSection() {
  const [form, setForm] = useState({
    productName: 'Signal Sprint',
    productDescription: 'Plateforme de veille KOL et contenus performants',
    niche: 'intelligence artificielle fr',
    tone: 'informatif',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const payload = await api.generateCopywritingRag(form);
      setResult(payload);
    } catch (err) {
      setError(err.message || 'Generation impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="utility-panel">
      <h2>Copywriting RAG</h2>
      <p>Generation via prompts exacts + contexte vectoriel + OpenAI.</p>

      <div className="utility-grid">
        <label>
          Product
          <input value={form.productName} onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))} />
        </label>
        <label>
          Niche
          <input value={form.niche} onChange={(e) => setForm((s) => ({ ...s, niche: e.target.value }))} />
        </label>
        <label className="span-2">
          Description
          <textarea value={form.productDescription} onChange={(e) => setForm((s) => ({ ...s, productDescription: e.target.value }))} rows={3} />
        </label>
      </div>

      <button type="button" className="action-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Generer
      </button>

      {error ? <div className="alert error">{error}</div> : null}

      {result?.result?.outputs ? (
        <div className="copy-output">
          <article>
            <h3>Thread X</h3>
            <pre>{result.result.outputs.thread.content}</pre>
          </article>
          <article>
            <h3>LinkedIn</h3>
            <pre>{result.result.outputs.linkedin.content}</pre>
          </article>
          <article>
            <h3>Short Script</h3>
            <pre>{result.result.outputs.short.content}</pre>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function TasksSection() {
  const [survey, setSurvey] = useState({
    niche: 'intelligence artificielle fr',
    objectif: 'high ticket b2b',
    canal: 'youtube x substack',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);

  async function handleRunSurveyTopics() {
    setLoading(true);
    setError('');

    try {
      const response = await api.getSubstackTopicsFromSurvey({
        surveyAnswers: survey,
        limit: 8,
      });
      setTopics(response?.result?.topics || []);
    } catch (err) {
      setError(err.message || 'Recherche Substack impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="utility-panel">
      <h2>Sondage vers sujets Substack</h2>
      <p>Ce bloc preparera la liaison landing page/sondage avec la recherche Substack.</p>

      <div className="utility-grid">
        <label>
          Niche
          <input value={survey.niche} onChange={(e) => setSurvey((s) => ({ ...s, niche: e.target.value }))} />
        </label>
        <label>
          Objectif
          <input value={survey.objectif} onChange={(e) => setSurvey((s) => ({ ...s, objectif: e.target.value }))} />
        </label>
        <label className="span-2">
          Canal prioritaire
          <input value={survey.canal} onChange={(e) => setSurvey((s) => ({ ...s, canal: e.target.value }))} />
        </label>
      </div>

      <button type="button" className="action-btn" onClick={handleRunSurveyTopics} disabled={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Lancer
      </button>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="newsletter-list compact">
        {topics.length ? (
          topics.map((topic) => (
            <article key={`${topic.publication}-${topic.link}`} className="newsletter-item">
              <div>
                <strong>{topic.publication}</strong>
                <p>{preview180(topic.title)}</p>
              </div>
              <div className="newsletter-metrics">
                <span>Combined {topic.combinedScore}</span>
                <span>Hits {topic.surveyHits}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">Aucun resultat de sondage lance.</div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [activeNetwork, setActiveNetwork] = useState(DEFAULT_NETWORK);
  const [dashboards, setDashboards] = useState([]);
  const [connectors, setConnectors] = useState(null);

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError('');

      try {
        const [nichesResponse, connectorsStatus] = await Promise.all([
          api.getNiches(),
          api.getConnectorStatus(),
        ]);

        setConnectors(connectorsStatus?.connectors || null);

        const niches = nichesResponse.items || [];
        const results = await Promise.all(niches.map((niche) => api.getDashboard(niche.key)));
        setDashboards(results);
      } catch (err) {
        setError(err.message || 'Chargement impossible.');
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  const socialRows = useMemo(() => normalizeSocialRows(dashboards), [dashboards]);
  const substackRows = useMemo(() => normalizeSubstackRows(dashboards), [dashboards]);

  const filteredRows = useMemo(() => {
    if (activeNetwork === 'Substack') {
      return [...substackRows]
        .sort((a, b) => Number(b.growthScore || b.impactScore || 0) - Number(a.growthScore || a.impactScore || 0))
        .slice(0, 8);
    }

    if (activeNetwork === 'Twitch') {
      return [];
    }

    return socialRows
      .filter((row) => row.network === activeNetwork)
      .sort((a, b) => Number(b.impactScore || 0) - Number(a.impactScore || 0))
      .slice(0, 8);
  }, [activeNetwork, socialRows, substackRows]);

  const newsletterRows = useMemo(
    () => [...substackRows].sort((a, b) => Number(b.growthScore || 0) - Number(a.growthScore || 0)).slice(0, 6),
    [substackRows]
  );

  const totalKols = useMemo(() => {
    const handles = new Set();
    socialRows.forEach((row) => {
      const key = String(row.authorHandle || row.authorName || '').trim().toLowerCase();
      if (key) handles.add(key);
    });
    return handles.size;
  }, [socialRows]);

  const totalContent = useMemo(() => socialRows.length + substackRows.length, [socialRows, substackRows]);

  return (
    <div className="page">
      <div className="background-mask" />

      <main className="dashboard-shell with-sidebar">
        <SideNav activeSection={activeSection} onChange={setActiveSection} />

        <section className="main-panel">
          {activeSection === 'home' ? (
            <HomeSection
              activeNetwork={activeNetwork}
              setActiveNetwork={setActiveNetwork}
              rows={filteredRows}
              newsletters={newsletterRows}
              connectors={connectors}
              error={error}
              totalKols={totalKols}
              totalContent={totalContent}
            />
          ) : null}

          {activeSection === 'copywriting' ? <CopywritingSection /> : null}
          {activeSection === 'alerts' ? <section className="utility-panel"><h2>Alertes</h2><p>Module de notifications signal/baisse a activer.</p></section> : null}
          {activeSection === 'tasks' ? <TasksSection /> : null}
          {activeSection === 'automation' ? <section className="utility-panel"><h2>Automation</h2><p>Orchestration des workflows de sync et refresh.</p></section> : null}

          <FooterLinks />
        </section>
      </main>

      {loading ? <div className="loading">Loading dashboard...</div> : null}
    </div>
  );
}

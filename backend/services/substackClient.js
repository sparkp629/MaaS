/**
 * Substack feed client
 * Uses RSS feeds (public) to extract recent topic signals.
 */

function parseXmlTag(xml, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(re);
  return match ? decodeHtml(match[1].trim()) : '';
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTopic({ title, publishedAt }) {
  const text = String(title || '').toLowerCase();
  const recencyDays = Math.max(
    0,
    Math.round((Date.now() - new Date(publishedAt || Date.now()).getTime()) / 86400000)
  );

  const hookKeywords = [
    'how',
    'why',
    'playbook',
    'teardown',
    'framework',
    'mistake',
    'growth',
    'case study',
  ];

  const keywordHits = hookKeywords.reduce(
    (count, keyword) => count + (text.includes(keyword) ? 1 : 0),
    0
  );

  const recencyScore = Math.max(0, 35 - recencyDays * 2);
  const headlineScore = Math.min(45, text.length > 60 ? 45 : 20 + text.length / 3);
  const keywordScore = keywordHits * 8;

  return Math.max(1, Math.min(99, Math.round(recencyScore + headlineScore + keywordScore)));
}

function flattenSurveyAnswers(input) {
  if (input == null) return [];
  if (typeof input === 'string') return [input];
  if (Array.isArray(input)) return input.flatMap((item) => flattenSurveyAnswers(item));
  if (typeof input === 'object') {
    return Object.values(input).flatMap((item) => flattenSurveyAnswers(item));
  }
  return [String(input)];
}

function tokenizeSurveyAnswers(surveyAnswers) {
  const raw = flattenSurveyAnswers(surveyAnswers).join(' ').toLowerCase();

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'vous', 'avec', 'pour', 'dans', 'des', 'les',
    'une', 'sur', 'plus', 'sans', 'qui', 'what', 'how', 'why', 'quel', 'quelle', 'quels', 'quelles',
  ]);

  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreSurveyRelevance(item, tokens) {
  if (!tokens.length) return 0;
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();

  const hits = tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
  const density = Math.min(1, hits / Math.max(1, tokens.length));

  return {
    hits,
    density,
    score: Math.round(hits * 10 + density * 30),
  };
}

export function isConfigured() {
  const feeds = String(process.env.SUBSTACK_FEEDS || '').trim();
  return feeds.length > 0;
}

export function parseFeedList(input) {
  return String(input || process.env.SUBSTACK_FEEDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function fetchFeed(feedUrl) {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Substack feed ${response.status}: ${body.slice(0, 200)}`);
  }

  const xml = await response.text();
  const publication = parseXmlTag(xml, 'title') || feedUrl;

  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  const items = itemMatches.map((block) => {
    const title = parseXmlTag(block, 'title');
    const link = parseXmlTag(block, 'link');
    const description = parseXmlTag(block, 'description');
    const publishedAt = parseXmlTag(block, 'pubDate');

    return {
      title,
      link,
      description,
      publishedAt,
      growthScore: scoreTopic({ title, publishedAt }),
    };
  });

  return {
    publication,
    feedUrl,
    items,
  };
}

export async function fetchFeeds(feedUrls) {
  const feeds = parseFeedList(feedUrls);
  const results = [];

  for (const feedUrl of feeds) {
    try {
      const payload = await fetchFeed(feedUrl);
      results.push({ ok: true, ...payload });
    } catch (error) {
      results.push({ ok: false, feedUrl, error: error.message });
    }
  }

  return results;
}

export async function getTopicsForSurvey({ surveyAnswers, feedUrls, limit = 10 }) {
  const tokens = tokenizeSurveyAnswers(surveyAnswers);
  const feeds = await fetchFeeds(feedUrls);

  const topics = [];

  for (const feed of feeds) {
    if (!feed.ok) continue;

    for (const item of feed.items || []) {
      const relevance = scoreSurveyRelevance(item, tokens);
      const combinedScore = Math.round((item.growthScore || 0) * 0.6 + relevance.score * 0.4);

      topics.push({
        publication: feed.publication,
        feedUrl: feed.feedUrl,
        title: item.title,
        link: item.link,
        description: item.description,
        publishedAt: item.publishedAt,
        growthScore: item.growthScore || 0,
        surveyHits: relevance.hits,
        surveyDensity: relevance.density,
        relevanceScore: relevance.score,
        combinedScore,
      });
    }
  }

  const ranked = topics
    .sort((a, b) => {
      if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
      return (b.growthScore || 0) - (a.growthScore || 0);
    })
    .slice(0, Math.max(1, Number(limit || 10)));

  return {
    configured: isConfigured(),
    tokenCount: tokens.length,
    tokens,
    feedsChecked: feeds.length,
    feedErrors: feeds.filter((feed) => !feed.ok).map((feed) => ({ feedUrl: feed.feedUrl, error: feed.error })),
    topics: ranked,
  };
}

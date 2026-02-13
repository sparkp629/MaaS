/**
 * MaaS — Types partagés (Lego)
 * Source de vérité pour le matching, l'intelligence et l'orchestration.
 */

// ============ 1. KOL MATCHING ============

export type NetworkId = 'twitter' | 'linkedin' | 'youtube' | 'newsletter' | 'twitch' | 'facebook' | 'tiktok' | 'instagram';

export interface EngagementMetrics {
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  opens?: number;   // Newsletter
  ctr?: number;    // Click-through rate %
  engagementRate?: number;  // (likes+comments+shares)/impressions
}

export interface KOL {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  niche: string;
  networks: Partial<Record<NetworkId, { url: string; metrics: EngagementMetrics }>>;
  conversionScore: number;  // 0-100
  mindshareIndex: number;  // 0-100
  isMicroKOL?: boolean;  // <10k followers
}

export interface Founder {
  id: string;
  name: string;
  email: string;
  productName: string;
  niche: string;
  budgetTier?: 'setup' | 'retainer';
}

export interface MatchScore {
  kolId: string;
  founderId: string;
  score: number;  // 0-100
  factors: {
    audienceOverlap: number;
    nicheAlignment: number;
    conversionPotential: number;
  };
}

// ============ 2. INTELLIGENCE LAYER ============

export interface MindshareIndex {
  value: number;  // 0-100
  breakdown: {
    engagementRate: number;
    audienceOverlap: number;
    noiseFactor: number;
  };
  level: 'Invisible' | 'Émergent' | 'Croissant' | 'Fort' | 'Dominant';
}

export interface ConversionCapabilityScore {
  value: number;  // 0-100
  factors: {
    technicalSentiment: number;
    growthVelocity: number;
    microKOLImpact: number;
  };
}

export type WeaknessDimension = 'technical_depth' | 'roi_tracking' | 'pricing_rigidity' | 'content_freshness' | 'audience_quality';

export interface CompetitorWeakness {
  competitorId: string;
  name: string;
  dimensions: Partial<Record<WeaknessDimension, number>>;  // 0-100, higher = weaker
}

// ============ 3. CAMPAIGN ORCHESTRATOR ============

export type ContentFormat = 'thread' | 'linkedin_post' | 'short_script';

export type ContentTone = 'sarcastic' | 'academic' | 'hype';

export interface Hook {
  id: string;
  sourceContentId?: string;
  text: string;
  platform: NetworkId;
  performanceScore?: number;
}

export interface GeneratedContent {
  id: string;
  hookId: string;
  format: ContentFormat;
  tone: ContentTone;
  content: string;
  platform: NetworkId;
  kolId?: string;
}

// ============ 4. PENALTY / ACCOUNTABILITY ============

export type PenaltyType = 'economic' | 'reputational';

export interface CampaignAgreement {
  id: string;
  campaignId: string;
  kolId: string;
  founderId: string;
  penaltyType: PenaltyType;
  penaltyAmount?: number;
  agreedAt: string;  // ISO date
}

/** v2 Agentic : attestation on-chain (ERC-8004) */
export interface Attestation {
  id: string;
  agreementId: string;
  chainId?: string;
  txHash?: string;
  attestedAt: string;
}

// ============ 5. ROI / ATTRIBUTION ============

export interface Click {
  id: string;
  campaignId: string;
  kolId: string;
  timestamp: string;
  source: NetworkId;
}

export interface Impression {
  id: string;
  campaignId: string;
  kolId: string;
  timestamp: string;
  count: number;
  source: NetworkId;
}

export interface MindshareGrowth {
  period: string;
  before: number;
  after: number;
  delta: number;
}

export interface Spend {
  campaignId: string;
  amount: number;
  currency: string;
  category: 'kol' | 'ads' | 'tools';
}

// ============ DTOs (réponses API plates) ============

export interface KOLPreviewDTO {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  conversionScore: number;
  mindshareIndex: number;
  preview?: string;  // 280 chars ou thumbnail
}

export interface ContextRichPreview {
  platform: NetworkId;
  text?: string;      // 280 chars X, post LinkedIn...
  thumbnailUrl?: string;
  url?: string;
}

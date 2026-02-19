// Normalize environment variable aliases to canonical names used across the codebase
export function normalizeEnv() {
  const map = {
    // Supabase
    URL_SUPABASE: ['URL_SUPABASE', 'VITE_SUPABASE_URL', 'SUPABASE_URL'],
    API_KEY_SUPABASE: ['API_KEY_SUPABASE', 'VITE_SUPABASE_ANON_KEY', 'PUBLISHABLE_KEY_SUPABASE', 'PUBLIC_ANON_KEY_SUPABASE', 'publishableKey_SUPABASE', 'VITE_SUPABASE_ANON'],
    // YouTube / Google
    YOUTUBE_API_KEY: ['YOUTUBE_API_KEY', 'API_KEY_YOUTUBE', 'GOOGLE_API_KEY'],
    // Twitter / X
    X_BEARER_TOKEN: ['X_BEARER_TOKEN', 'TWITTER_BEARER_TOKEN'],
    // Cloudflare
    CLOUDFLARE_API_KEY: ['CLOUDFLARE_API_KEY', 'CF_API_TOKEN', 'CLOUDFLARE_API_TOKEN'],
    STORE_ID_CLOUDFLARE: ['STORE_ID_CLOUDFLARE'],
    // Vercel / AI Gateway
    AI_GATEWAY_API_KEY: ['AI_GATEWAY_API_KEY', 'VERCEL_AI_KEY', 'VERCEL_AI_GATEWAY_KEY'],
    // OpenAI / Anthropic
    OPENAI_API_KEY: ['OPENAI_API_KEY', 'OPENAI_KEY'],
    ANTHROPIC_API_KEY: ['ANTHROPIC_API_KEY', 'ANTHROPIC_KEY'],
    // OAuth / Google
    OAUTH_CLIENT_ID: ['OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_ID'],
    OAUTH_CLIENT_SECRET: ['OAUTH_CLIENT_SECRET', 'GOOGLE_OAUTH_CLIENT_SECRET'],
    // Stripe
    STRIPE_WEBHOOK_SECRET: ['STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK'],
    STRIPE_SECRET_KEY: ['STRIPE_SECRET_KEY', 'STRIPE_SECRET', 'STRIPE_SECRET_KEY'],
    // AWS
    AWS_ACCESS_KEY_ID: ['AWS_ACCESS_KEY_ID'],
    AWS_SECRET_ACCESS_KEY: ['AWS_SECRET_ACCESS_KEY'],
    AWS_ARN_SECRET: ['AWS_ARN_SECRET', 'AWS_SECRET_ARN'],
    AWS_REGION: ['AWS_REGION', 'AWS_DEFAULT_REGION'],
    // LinkedIn / TikTok
    LINKEDIN_CLIENT_ID: ['LINKEDIN_CLIENT_ID'],
    LINKEDIN_CLIENT_SECRET: ['LINKEDIN_CLIENT_SECRET'],
    TIKTOK_CLIENT_KEY: ['TIKTOK_CLIENT_KEY'],
    TIKTOK_CLIENT_SECRET: ['TIKTOK_CLIENT_SECRET'],
    // Meta / Facebook
    META_APP_ID: ['META_APP_ID', 'FACEBOOK_APP_ID'],
    META_APP_SECRET: ['META_APP_SECRET', 'FACEBOOK_APP_SECRET'],
    // Database path / local storage
    DB_PATH: ['DB_PATH', 'SQLITE_DB_PATH', 'MAAS_DB_PATH'],
    // Availability checker toggle
    ENABLE_AVAILABILITY_CHECKER: ['ENABLE_AVAILABILITY_CHECKER'],
    AVAILABILITY_CHECK_INTERVAL_MINUTES: ['AVAILABILITY_CHECK_INTERVAL_MINUTES'],
    // Stripe price id
    STRIPE_PRICE_ID: ['STRIPE_PRICE_ID', 'STRIPE_MONTHLY_PRICE_ID', 'STRIPE_ANNUAL_PRICE_ID'],
  };

  Object.entries(map).forEach(([canonical, aliases]) => {
    if (process.env[canonical]) return; // already set
    for (const a of aliases) {
      if (process.env[a]) {
        process.env[canonical] = process.env[a];
        // console.debug to show mapping (kept minimal)
        console.log(`[envNormalize] mapped ${a} -> ${canonical}`);
        break;
      }
    }
  });
}

export default normalizeEnv;

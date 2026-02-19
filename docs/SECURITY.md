**Security & Secrets Guide**

Short recommendations to reduce risk and rotate secrets safely.

- Never commit `.env` to the repository. Use `.env.example` only (no real values).
- Use your cloud provider secret store (AWS Secrets Manager, Vercel/GCP secret manager) for production values.
- Rotate keys immediately if accidentally exposed. For each provider follow their rotation flow:
  - Cloudflare: create a new API token, update the secret store, then revoke the old token.
  - OpenAI / Anthropic: create new key, update secret store and app config, delete old key.
  - Supabase: rotate anon/public keys via project settings and update frontend config.

Quick steps to audit and rotate locally:

1. Run the audit script to find local-only keys and code references:

```bash
node ./backend/scripts/audit_env.mjs
```

2. Identify secrets in your local `.env` that are not present in `.env.example`.
3. For each secret: create a new key/token in provider console, store it in Secrets Manager or Vercel/GitHub secrets, update deployment configuration, then revoke the old key.

Deployment notes (availability checker scheduler):
- To enable the availability checker scheduler in production, set `ENABLE_AVAILABILITY_CHECKER=true` and `AVAILABILITY_CHECK_INTERVAL_MINUTES=60` in your environment (or secret store). Ensure the backend process is long-lived (not serverless stateless functions) or run the scheduler as a separate worker/cron job.

If you want, I can produce a one-click rotation checklist per provider you use.

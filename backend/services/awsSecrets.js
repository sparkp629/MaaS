import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function initAwsSecrets() {
  const arn = process.env.AWS_ARN_SECRET || process.env.AWS_SECRET_ARN || null;
  if (!arn) return;

  const regionMatch = arn.match(/secretsmanager:([a-z0-9-]+):/i);
  const region = regionMatch ? regionMatch[1] : process.env.AWS_REGION || 'us-east-1';

  const clientConfig = { region };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  const client = new SecretsManagerClient(clientConfig);
  try {
    const cmd = new GetSecretValueCommand({ SecretId: arn });
    const resp = await client.send(cmd);
    const secret = resp.SecretString || null;
    if (!secret) {
      console.warn('[awsSecrets] Secret fetched, but no SecretString present.');
      return;
    }

    // Try parse as JSON — common pattern: store multiple keys in a JSON secret
    try {
      const parsed = JSON.parse(secret);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => {
          if (!process.env[k]) {
            process.env[k] = String(v);
            console.log(`[awsSecrets] Set env ${k} from Secrets Manager (ARN ${arn})`);
          }
        });
        return;
      }
    } catch (e) {
      // not JSON, fallthrough
    }

    // Fallback: expose as RETRIEVED_SECRET or try to map common target names
    if (!process.env.CLOUDFLARE_API_KEY) {
      process.env.CLOUDFLARE_API_KEY = secret;
      console.log('[awsSecrets] Set CLOUDFLARE_API_KEY from Secrets Manager');
    } else {
      console.log('[awsSecrets] Secret retrieved but CLOUDFLARE_API_KEY already set; skipping overwrite.');
    }
  } catch (err) {
    console.error('[awsSecrets] Failed to fetch secret:', err.message || err);
  }
}

/**
 * Middleware Auth Supabase — vérifie le JWT dans le header Authorization
 * Si Supabase n'est pas configuré, passe en mode ouvert (dev)
 */

const SUPABASE_URL = process.env.URL_SUPABASE || null;
const SUPABASE_KEY = process.env.API_KEY_SUPABASE || null;

/**
 * Vérifie le token Supabase via l'endpoint /auth/v1/user
 * Ajoute req.user si valide
 */
export async function requireAuth(req, res, next) {
  // Mode dev : pas de Supabase configuré → tout passe
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    req.user = { id: 'dev-user', email: 'dev@local' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis (Authorization: Bearer <token>)' });
  }

  const token = authHeader.slice(7);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_KEY,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const user = await response.json();
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(500).json({ error: 'Erreur vérification auth' });
  }
}

/**
 * Optionnel : attache req.user si token présent, sinon continue sans user
 */
export async function optionalAuth(req, _res, next) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    req.user = null;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_KEY,
      },
    });

    if (response.ok) {
      const user = await response.json();
      req.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

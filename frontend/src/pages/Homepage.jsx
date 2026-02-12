import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Loader2, Brain } from 'lucide-react';
import { api } from '../api';

const SLOGAN = 'Match votre repo GitHub avec des KOLs ciblés — Génération de contenu différenciateur pour votre SaaS.';

export default function Homepage() {
  const [connecting, setConnecting] = useState(false);
  const [charterAccepted, setCharterAccepted] = useState(false);
  const navigate = useNavigate();

  const handleConnectGithub = async () => {
    if (!charterAccepted) return;
    setConnecting(true);
    try {
      // Placeholder OAuth: en production, redirection vers GitHub OAuth
      await new Promise(r => setTimeout(r, 800));
      localStorage.setItem('maas_github_connected', 'true');
      await api.analyzeGithub({ repo_owner: 'demo', repo_name: 'maas-client' });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      localStorage.setItem('maas_github_connected', 'true');
      navigate('/dashboard');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-2xl gradient-maas flex items-center justify-center mb-6">
        <Brain className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold gradient-text text-center mb-4">
        MaaS
      </h1>
      <p className="text-xl text-slate-400 text-center max-w-xl mb-10 leading-relaxed">
        {SLOGAN}
      </p>

      <div className="w-full max-w-md space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={charterAccepted}
            onChange={e => setCharterAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
          />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
            J'accepte la <strong className="text-indigo-400">charte d'utilisation</strong> : MaaS analyse uniquement la nature de mon SaaS via des agents IA pour identifier des KOLs compatibles, sans stockage des contenus de mon dépôt.
          </span>
        </label>
        <button
          onClick={handleConnectGithub}
          disabled={!charterAccepted || connecting}
          className="w-full px-8 py-4 rounded-2xl gradient-maas text-white font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {connecting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Github className="w-6 h-6" />
          )}
          {connecting ? 'Connexion en cours...' : 'Connecter GitHub'}
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center max-w-sm">
        Une fois connecté, votre code sera analysé par une IA pour identifier votre niche, vos différenciateurs et les KOLs les plus pertinents.
      </p>
    </div>
  );
}

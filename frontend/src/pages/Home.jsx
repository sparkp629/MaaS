import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { t } = useTranslation();
  const { connect } = useAuth();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  const handleConnectGithub = async () => {
    setConnecting(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      connect();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center space-y-8 max-w-xl">
        <h1 className="text-4xl font-bold gradient-text">MaaS</h1>
        <p className="text-slate-400 text-lg leading-relaxed">{t('slogan')}</p>
        <button
          onClick={handleConnectGithub}
          disabled={connecting}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl gradient-maas text-white font-semibold text-lg hover:opacity-90 disabled:opacity-70 transition-opacity"
        >
          {connecting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Github className="w-6 h-6" />
          )}
          {connecting ? t('connecting') : t('connectGithub')}
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Linkedin, Video } from 'lucide-react';
import { api } from '../api';

export default function CampaignEngine() {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('informatif');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result?.hook && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleGenerate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    try {
      const data = await api.generateContent({
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        niche: niche.trim(),
        tone,
      });
      setResult(data);
    } catch (e) {
      const msg = e.message || 'Erreur de connexion au serveur. Vérifiez que le backend tourne sur le port 3001.';
      setResult({ error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/40">
      <header className="border-b border-slate-700/30 px-6 py-4">
        <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white">Moteur de campagne</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Hook → Thread X, Post LinkedIn, Script Short
        </p>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Nom du produit *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Mon SaaS"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="En une phrase..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Niche</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Dev Tools, No-code..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Ton</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="informatif">Informatif</option>
                <option value="technique">Technique</option>
                <option value="sarcastique">Sarcastique</option>
                <option value="inspirant">Inspirant</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !productName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Génération...' : 'Générer les contenus'}
          </button>
        </div>

        {result?.error && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {result.error}
          </div>
        )}

        {result?.hook && (
          <div ref={resultRef} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-indigo-500/20">
              <h3 className="text-sm font-medium text-indigo-400 mb-2">Hook</h3>
              <p className="text-white">{result.hook.text}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ContentBlock
                icon={FileText}
                title="Thread X"
                content={result.outputs?.thread?.content}
              />
              <ContentBlock
                icon={Linkedin}
                title="Post LinkedIn"
                content={result.outputs?.linkedin?.content}
              />
              <ContentBlock
                icon={Video}
                title="Script Short (60s)"
                content={result.outputs?.short?.content}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ContentBlock({ icon: Icon, title, content }) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      <pre className="text-slate-400 text-sm whitespace-pre-wrap font-sans">{content}</pre>
    </div>
  );
}

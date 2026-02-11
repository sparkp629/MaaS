import { useState } from 'react';
import { MessageSquarePlus, Send, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = [
  { value: 'feature', label: 'Nouvelle fonctionnalité' },
  { value: 'improvement', label: 'Amélioration' },
  { value: 'bug', label: 'Signaler un bug' },
  { value: 'general', label: 'Autre' },
];

export default function SuggestionBox() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 10) return;

    setStatus('sending');
    try {
      await api.submitSuggestion(content, category);
      setStatus('sent');
      setContent('');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-indigo-400 transition-colors"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Suggérer une amélioration (anonyme)</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 glass rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Vos suggestions sont 100% anonymes. Identification par empreinte numérique (hash SHA-256 de votre IP + navigateur) — aucune donnée personnelle stockée. Max 3 suggestions/jour.
          </p>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décrivez votre idée ou suggestion..."
              rows={2}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
            <button
              type="submit"
              disabled={content.trim().length < 10 || status === 'sending'}
              className="self-end px-4 py-2 rounded-lg gradient-maas text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {status === 'sending' ? '...' : <Send className="w-4 h-4" />}
            </button>
          </div>

          {status === 'sent' && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4" />
              Suggestion envoyée anonymement. Merci !
            </div>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-xs">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

const API_BASE = '/api';

export default function SuggestionBox() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setSent(true);
      setText('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        <MessageSquare className="w-4 h-4" />
        Une idée à partager ?
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Suggestion anonyme..."
          maxLength={500}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium"
        >
          {sent ? 'Envoyé ✓' : 'Envoyer'}
        </button>
      </form>
      {error && (
        <p className="text-amber-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}

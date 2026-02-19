import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('admin_api_key') || '');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [validated, setValidated] = useState(false);

  function saveKey(k) {
    setAdminKey(k);
    try { localStorage.setItem('admin_api_key', k); } catch {}
  }

  async function validateKeyAndFetch() {
    try {
      const key = localStorage.getItem('admin_api_key');
      if (!key) {
        alert('Clé admin manquante.');
        return navigate('/app');
      }
      const res = await fetch('/api/admin/validate', { headers: { 'x-admin-key': key } });
      const j = await res.json();
      if (!j || !j.ok) {
        alert('Clé admin invalide.');
        return navigate('/app');
      }
      setValidated(true);
      fetchContents();
    } catch (e) {
      console.error(e);
      alert('Erreur de validation.');
      navigate('/app');
    }
  }

  async function fetchContents() {
    setLoading(true);
    try {
      const q = adminKey ? `?adminKey=${encodeURIComponent(adminKey)}` : '';
      const res = await fetch(`/api/admin/contents${q}`);
      const json = await res.json();
      if (json.ok) setContents(json.items || []);
      else alert(json.error || 'Erreur');
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally { setLoading(false); }
  }

  async function runCheck() {
    setRunning(true);
    try {
      const headers = {};
      if (adminKey) headers['x-admin-key'] = adminKey;
      const res = await fetch('/api/admin/run-availability-check', { method: 'POST', headers });
      const json = await res.json();
      if (json.ok) {
        alert(`Check terminé — checked ${json.result.checked}, removed ${json.result.removed}`);
        fetchContents();
      } else {
        alert(json.error || 'Erreur');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally { setRunning(false); }
  }

  async function removeContent(id) {
    if (!confirm('Supprimer cet enregistrement ?')) return;
    try {
      const headers = {};
      if (adminKey) headers['x-admin-key'] = adminKey;
      const res = await fetch(`/api/admin/contents/${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (json.ok) fetchContents(); else alert(json.error || 'Erreur');
    } catch (e) { alert('Erreur réseau'); }
  }

  useEffect(() => { validateKeyAndFetch(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Admin — Availability Checker</h2>
      <div className="mb-4">
        <label className="block text-sm">Admin API Key (optionnel)</label>
        <input value={adminKey} onChange={(e) => saveKey(e.target.value)} className="border p-2 w-full" />
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={runCheck} disabled={running || !validated} className="px-3 py-2 bg-sky-600 text-white rounded">{running ? 'En cours...' : 'Lancer vérification'}</button>
        <button onClick={fetchContents} disabled={loading || !validated} className="px-3 py-2 bg-gray-200 rounded">{loading ? 'Chargement...' : 'Rafraîchir la liste'}</button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b"><th>ID</th><th>Platform</th><th>Content ID</th><th>URL</th><th>Status</th><th>Last checked</th><th></th></tr>
        </thead>
        <tbody>
          {contents.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">{c.id}</td>
              <td>{c.platform}</td>
              <td>{c.platform_content_id}</td>
              <td><a href={c.url} target="_blank" rel="noreferrer" className="text-sky-600">{c.url}</a></td>
              <td>{c.status}</td>
              <td>{c.last_checked_at || '—'}</td>
              <td><button onClick={() => removeContent(c.id)} className="text-red-600">Supprimer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

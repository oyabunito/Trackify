import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCode } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get('code');
    const err = params.get('error');
    if (err) { setError(err); return; }
    if (!code) { setError('Code manquant'); return; }
    (async () => {
      try {
        await exchangeCode(code);
        await refreshUser();
        navigate('/dashboard', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090a', color: '#e9efe9', fontFamily: "'Figtree', sans-serif" }}>
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 12, color: '#f87171' }}>Connexion échouée</div>
          <div style={{ fontSize: 14, color: '#8a958d', marginBottom: 24 }}>{error}</div>
          <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#1ed760', color: '#052a16', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Retour</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.1)', borderTopColor: '#1ed760', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 14, color: '#8a958d' }}>Connexion à Spotify…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}

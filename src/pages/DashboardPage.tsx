import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTopArtists, getTopTracks, getRecentlyPlayed, type SpotifyArtist, type SpotifyTrack, type PlayHistory } from '../api/spotify';
import { fetchLyrics } from '../api/lyrics';

const GENRE_COLORS = ['#1ed760', '#19b14e', '#7ef29a', '#0e8f43', '#b6f24a', '#34d399'];
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg,#1ed760,#0b6b3a)',
  'linear-gradient(135deg,#22d3ee,#0e5a6b)',
  'linear-gradient(135deg,#a78bfa,#4c1d95)',
  'linear-gradient(135deg,#fb7185,#7f1d3a)',
  'linear-gradient(135deg,#fbbf24,#92400e)',
  'linear-gradient(135deg,#94a3b8,#334155)',
  'linear-gradient(135deg,#f472b6,#831843)',
  'linear-gradient(135deg,#34d399,#065f46)',
];

function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}

function Cover({ imageUrl, gradient, label, size, radius }: { imageUrl?: string; gradient?: string; label: string; size: number; radius: number | string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={label} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flex: '0 0 auto', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.07)' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: gradient || gradientFor(label), flex: '0 0 auto', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.07)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 120% at 22% 12%, rgba(255,255,255,.22), transparent 46%)' }} />
      <span style={{ position: 'absolute', right: size * 0.09, bottom: size * 0.04, fontWeight: 800, fontSize: size * 0.32, color: 'rgba(255,255,255,.9)', fontFamily: 'Montserrat, sans-serif', letterSpacing: '-.03em' }}>{label}</span>
    </div>
  );
}

const keyframes = `
@keyframes tkfade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes tkOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes tkModalIn { from { opacity: 0; transform: translate(-50%,-50%) scale(.92); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
@keyframes tkPulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes spin { to { transform: rotate(360deg); } }
`;

interface AggGenre { name: string; count: number; pct: number; color: string; }

function aggregateGenres(artists: SpotifyArtist[]): AggGenre[] {
  const counts: Record<string, number> = {};
  artists.forEach(a => (a.genres ?? []).forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({
      name: name.replace(/\b\w/g, c => c.toUpperCase()),
      count,
      pct: Math.round((count / total) * 100),
      color: GENRE_COLORS[i],
    }));
}

function groupRecent(items: PlayHistory[]): { label: string; items: { play: PlayHistory; time: string; date: string }[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;

  const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const fmtDate = (d: Date) => `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;

  const groups: Record<string, { play: PlayHistory; time: string; date: string }[]> = {
    "Aujourd'hui": [],
    'Hier': [],
    'Plus tôt cette semaine': [],
  };
  items.forEach(play => {
    const d = new Date(play.played_at);
    const time = fmtTime(d);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    let group: string;
    let date: string;
    if (dayStart === today) { group = "Aujourd'hui"; date = "Aujourd'hui"; }
    else if (dayStart === yesterday) { group = 'Hier'; date = 'Hier'; }
    else { group = 'Plus tôt cette semaine'; date = fmtDate(d); }
    groups[group].push({ play, time, date });
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// --- Fuzzy search ---
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
  }
  return d[m][n];
}
function sim(a: string, b: string): number {
  if (a === b) return 1;
  const ml = Math.max(a.length, b.length);
  return ml ? 1 - lev(a, b) / ml : 0;
}

interface SearchHit {
  track: SpotifyTrack;
  words: string[];
  matchedIndices: Set<number>;
  displayScore: string;
  score: number;
}

function searchInLyrics(query: string, tracksWithLyrics: { track: SpotifyTrack; lyrics: string }[]): SearchHit[] {
  const qTokens = query.split(/\s+/).map(norm).filter(Boolean);
  if (!qTokens.length) return [];

  type Best = { words: string[]; idx: Set<number>; coverage: number; avg: number; score: number };
  const out: { track: SpotifyTrack; best: Best }[] = [];

  tracksWithLyrics.forEach(({ track, lyrics }) => {
    let best: Best | null = null;
    lyrics.split('\n').forEach(line => {
      const words = line.split(/\s+/);
      const normW = words.map(norm);
      let totalSim = 0, matched = 0;
      const idx = new Set<number>();
      qTokens.forEach(qt => {
        let bs = 0, bi = -1;
        normW.forEach((nw, wi) => { if (!nw) return; const s = sim(qt, nw); if (s > bs) { bs = s; bi = wi; } });
        if (bs >= 0.6) { totalSim += bs; matched++; idx.add(bi); }
      });
      const coverage = matched / qTokens.length;
      const score = totalSim + coverage * 0.5;
      if (!best || score > best.score) best = { words, idx, coverage, avg: matched ? totalSim / matched : 0, score };
    });
    const b = best as Best | null;
    if (b && b.coverage >= 0.5) out.push({ track, best: b });
  });

  return out
    .sort((a, b) => b.best.score - a.best.score)
    .slice(0, 6)
    .map(({ track, best }) => ({
      track,
      words: best.words,
      matchedIndices: best.idx,
      displayScore: Math.round((best.avg * 0.7 + best.coverage * 0.3) * 100) + '%',
      score: best.score,
    }));
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<'profil' | 'historique' | 'recherche'>('profil');
  const [query, setQuery] = useState('');
  const [genreStyle, setGenreStyle] = useState<'donut' | 'radar' | 'bubble' | 'bars'>('donut');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'infos' | 'apparence' | 'langue' | 'deconnex'>('infos');
  const [displayName, setDisplayName] = useState('');
  const [historyDuration, setHistoryDuration] = useState('7 jours');
  const [language, setLanguage] = useState('fr');

  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [recent, setRecent] = useState<PlayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lyricsMap, setLyricsMap] = useState<Record<string, string | null>>({});
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.display_name || user.id);
  }, [user]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [artists, tracks, recents] = await Promise.all([
          getTopArtists(10),
          getTopTracks(10),
          getRecentlyPlayed(50),
        ]);
        if (cancel) return;
        setTopArtists(artists.items);
        setTopTracks(tracks.items);
        setRecent(recents.items);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Lazy-load lyrics for unique tracks in recent plays when search tab opens
  useEffect(() => {
    if (section !== 'recherche' || !recent.length) return;
    const unique: Record<string, SpotifyTrack> = {};
    recent.forEach(r => { unique[r.track.id] = r.track; });
    const missing = Object.values(unique).filter(t => !(t.id in lyricsMap));
    if (!missing.length) return;
    setLyricsLoading(true);
    (async () => {
      const next: Record<string, string | null> = {};
      await Promise.all(missing.map(async t => {
        const text = await fetchLyrics(t.id, t.artists[0]?.name || '', t.name, t.duration_ms);
        next[t.id] = text;
      }));
      setLyricsMap(prev => ({ ...prev, ...next }));
      setLyricsLoading(false);
    })();
  }, [section, recent]);

  const aggregatedGenres = useMemo(() => aggregateGenres(topArtists), [topArtists]);

  const stats = useMemo(() => {
    const uniqueArtists = new Set<string>();
    let totalMs = 0;
    recent.forEach(r => {
      (r.track?.artists ?? []).forEach(a => uniqueArtists.add(a.id));
      totalMs += r.track?.duration_ms ?? 0;
    });
    return {
      minutes: Math.round(totalMs / 60000).toLocaleString('fr-FR'),
      uniqueCount: uniqueArtists.size || topArtists.length,
      topGenre: aggregatedGenres[0]?.name || '—',
      topArtist: topArtists[0]?.name || '—',
    };
  }, [recent, topArtists, aggregatedGenres]);

  const groupedHistory = useMemo(() => groupRecent(recent), [recent]);

  const searchTracks = useMemo(() => {
    const unique: Record<string, SpotifyTrack> = {};
    recent.forEach(r => { unique[r.track.id] = r.track; });
    return Object.values(unique)
      .map(track => ({ track, lyrics: lyricsMap[track.id] }))
      .filter((x): x is { track: SpotifyTrack; lyrics: string } => !!x.lyrics);
  }, [recent, lyricsMap]);

  const results = useMemo(() => query.trim() ? searchInLyrics(query, searchTracks) : [], [query, searchTracks]);

  const cardBg = '#14181a';
  const cardBorder = '1px solid rgba(255,255,255,.05)';
  const green = '#1ed760';
  const muted = '#9aa39b';
  const dimmed = '#8a958d';
  const dark = '#6b746c';
  const mono = "'Space Mono', monospace";
  const mont = "'Montserrat', sans-serif";

  function renderDonut() {
    if (!aggregatedGenres.length) return <div style={{ color: dark, fontSize: 13 }}>Pas assez de données.</div>;
    const total = aggregatedGenres.reduce((s, g) => s + g.pct, 0) || 100;
    let cum = 0;
    const sz = 188, cx = sz / 2, cy = sz / 2, r = 70, sw = 32;
    const arcs = aggregatedGenres.map((g, i) => {
      const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
      cum += g.pct;
      const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
      const large = (g.pct / total) > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`} fill="none" stroke={g.color} strokeWidth={sw} />;
    });
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
          {arcs}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontFamily={mont} fontWeight={800} fontSize={22}>{aggregatedGenres[0].pct}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={dimmed} fontFamily={mont} fontSize={11}>{aggregatedGenres[0].name}</text>
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
          {aggregatedGenres.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flex: '0 0 auto' }} />
              <span style={{ color: '#ccc', fontSize: 13 }}>{g.name}</span>
              <span style={{ color: dark, fontSize: 12, fontFamily: mono }}>{g.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRadar() {
    if (!aggregatedGenres.length) return null;
    const sz = 280, cx = sz / 2, cy = sz / 2, maxR = 110, levels = 4;
    const n = aggregatedGenres.length;
    const max = Math.max(...aggregatedGenres.map(g => g.pct));
    const angleStep = (Math.PI * 2) / n;
    const pt = (i: number, r: number) => ({ x: cx + r * Math.sin(i * angleStep), y: cy - r * Math.cos(i * angleStep) });
    return (
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {Array.from({ length: levels }, (_, l) => {
          const r = maxR * ((l + 1) / levels);
          const pts = Array.from({ length: n }, (_, i) => pt(i, r));
          return <polygon key={l} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={1} />;
        })}
        {aggregatedGenres.map((_, i) => { const p = pt(i, maxR); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,.06)" strokeWidth={1} />; })}
        <polygon
          points={aggregatedGenres.map((g, i) => { const p = pt(i, (g.pct / max) * maxR); return `${p.x},${p.y}`; }).join(' ')}
          fill="rgba(30,215,96,.15)" stroke={green} strokeWidth={2}
        />
        {aggregatedGenres.map((g, i) => {
          const p = pt(i, maxR + 16);
          return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={dimmed} fontSize={10} fontFamily={mont}>{g.name}</text>;
        })}
      </svg>
    );
  }

  function renderBubble() {
    if (!aggregatedGenres.length) return null;
    const sz = 280;
    const max = Math.max(...aggregatedGenres.map(g => g.pct));
    const positions = [{ x: 100, y: 100 }, { x: 190, y: 90 }, { x: 140, y: 185 }, { x: 60, y: 180 }, { x: 220, y: 170 }, { x: 210, y: 240 }];
    return (
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {aggregatedGenres.map((g, i) => {
          const r = (g.pct / max) * 48 + 12;
          const p = positions[i] || { x: 140, y: 140 };
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={r} fill={g.color} opacity={0.7} />
              <text x={p.x} y={p.y - 2} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={700} fontFamily={mont}>{g.pct}%</text>
              <text x={p.x} y={p.y + 10} textAnchor="middle" fill="rgba(255,255,255,.7)" fontSize={7} fontFamily={mont}>{g.name}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  function renderBars() {
    if (!aggregatedGenres.length) return <div style={{ color: dark, fontSize: 13 }}>Pas de données.</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {aggregatedGenres.map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 100, fontSize: 13, color: '#ccc', fontWeight: 600, textAlign: 'right' }}>{g.name}</span>
            <div style={{ flex: 1, height: 11, borderRadius: 6, background: 'rgba(255,255,255,.06)' }}>
              <div style={{ width: `${g.pct}%`, height: '100%', borderRadius: 6, background: g.color, transition: 'width .4s' }} />
            </div>
            <span style={{ width: 36, fontSize: 12, color: dark, fontFamily: mono }}>{g.pct}%</span>
          </div>
        ))}
      </div>
    );
  }

  const tabItems = [
    { key: 'profil' as const, label: 'Profil' },
    { key: 'historique' as const, label: 'Récemment écoutés' },
    { key: 'recherche' as const, label: 'Retrouve ton son' },
  ];
  const settingsNavItems = [
    { key: 'infos' as const, label: 'Infos personnelles' },
    { key: 'apparence' as const, label: 'Apparence' },
    { key: 'langue' as const, label: 'Langue' },
    { key: 'deconnex' as const, label: 'Déconnexion', red: true },
  ];
  const durationOptions = ['7 jours', '1 mois', '2 mois', '3 mois', '6 mois', '1 an', '2 ans', '3 ans', 'Depuis le début'];
  const languages = [
    { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', name: 'Français' },
    { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', name: 'English' },
    { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', name: 'Español' },
    { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' },
    { code: 'pt', flag: '\u{1F1F5}\u{1F1F9}', name: 'Português' },
    { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italiano' },
  ];
  const genreStyleOptions = [
    { key: 'donut' as const, label: 'Camembert', icon: '◑' },
    { key: 'radar' as const, label: 'Cartographie', icon: '⬡' },
    { key: 'bubble' as const, label: 'Bulles', icon: '⬤' },
    { key: 'bars' as const, label: 'Barres', icon: '▬' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090a' }}>
        <style>{keyframes}</style>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.1)', borderTopColor: green, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090a', color: '#fff', fontFamily: "'Figtree', sans-serif", textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 24, marginBottom: 12, color: '#f87171' }}>Erreur de chargement</div>
          <div style={{ color: dimmed, fontSize: 14, marginBottom: 24 }}>{error}</div>
          <button onClick={logout} style={{ padding: '10px 20px', borderRadius: 10, background: green, border: 'none', color: '#052a16', fontWeight: 700, cursor: 'pointer' }}>Se reconnecter</button>
        </div>
      </div>
    );
  }

  const avatarUrl = user?.images?.[0]?.url;

  return (
    <>
      <style>{keyframes}</style>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 28px 90px', animation: 'tkfade .4s', background: '#08090a', minHeight: '100vh', fontFamily: "'Figtree', sans-serif", color: '#e2e8e0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1ed760,#0b6b3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 22, color: '#052a16' }}>{displayName[0]?.toUpperCase() || 'U'}</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: dimmed }}>Bonsoir {displayName}</div>
            <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 26, letterSpacing: '-.02em' }}>Ton profil d&apos;auditeur</div>
          </div>
          <button onClick={() => { setShowSettings(true); setSettingsTab('infos'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Paramètres
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'rgba(30,215,96,.1)', border: '1px solid rgba(30,215,96,.25)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: green, animation: 'tkPulse 2s infinite' }} />
            <span style={{ color: green, fontSize: 12, fontWeight: 600 }}>Connecté à Spotify</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'inline-flex', background: cardBg, borderRadius: 999, padding: 4, border: '1px solid rgba(255,255,255,.05)', marginTop: 22, marginBottom: 28 }}>
          {tabItems.map(t => (
            <button key={t.key} onClick={() => setSection(t.key)} style={{
              padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: section === t.key ? 700 : 600,
              background: section === t.key ? green : 'transparent',
              color: section === t.key ? '#052a16' : muted,
              transition: 'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab 1: Profil */}
        {section === 'profil' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'Minutes (50 dernières)', value: stats.minutes, sub: 'à partir des écoutes récentes' },
                { label: 'Artistes uniques', value: String(stats.uniqueCount), sub: 'dans tes 50 dernières écoutes' },
                { label: 'Genre n°1', value: stats.topGenre, sub: aggregatedGenres[0] ? `${aggregatedGenres[0].pct}% de tes top artistes` : null, valueColor: green },
                { label: 'Artiste favori', value: stats.topArtist, sub: 'tes derniers mois', valueColor: green },
              ].map((s, i) => (
                <div key={i} style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, color: dark, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 22, color: s.valueColor || '#fff' }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: 11, color: dimmed, marginTop: 4 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
              <div style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: '20px 22px' }}>
                <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Top artistes</div>
                {topArtists.slice(0, 6).map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', transition: 'background .15s' }}
                    onClick={() => window.open(a.external_urls.spotify, '_blank')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 16, color: i === 0 ? green : dark, width: 22, textAlign: 'right' }}>{i + 1}</span>
                    <Cover imageUrl={a.images?.[0]?.url} label={a.name?.[0] || '?'} size={42} radius="50%" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                      {a.genres?.[0] && <div style={{ fontSize: 12, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.genres[0]}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                      <div style={{ fontSize: 12, fontFamily: mono, color: dark }}>{(a.followers?.total ?? 0).toLocaleString('fr-FR')}</div>
                      <div style={{ fontSize: 10, color: dark }}>followers</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: '20px 22px' }}>
                <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Top titres</div>
                {topTracks.slice(0, 6).map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderRadius: 10, transition: 'background .15s', cursor: 'pointer' }}
                    onClick={() => window.open(t.external_urls.spotify, '_blank')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 16, color: i === 0 ? green : dark, width: 22, textAlign: 'right' }}>{i + 1}</span>
                    <Cover imageUrl={t.album?.images?.[t.album.images.length - 1]?.url} label={t.name?.[0] || '?'} size={42} radius={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artists.map(a => a.name).join(', ')}</div>
                    </div>
                    <div style={{ fontSize: 12, color: dark, fontFamily: mono }}>{t.popularity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: cardBg, border: cardBorder, borderRadius: 18, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 18 }}>Répartition des genres</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {genreStyleOptions.map(o => (
                    <button key={o.key} onClick={() => setGenreStyle(o.key)} style={{
                      padding: '5px 10px', borderRadius: 8,
                      border: genreStyle === o.key ? `1px solid ${green}` : '1px solid rgba(255,255,255,.08)',
                      background: genreStyle === o.key ? 'rgba(30,215,96,.12)' : 'transparent',
                      color: genreStyle === o.key ? green : dark, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{o.icon} {o.label}</button>
                  ))}
                </div>
              </div>
              {genreStyle === 'donut' && renderDonut()}
              {genreStyle === 'radar' && renderRadar()}
              {genreStyle === 'bubble' && renderBubble()}
              {genreStyle === 'bars' && renderBars()}
            </div>
          </div>
        )}

        {/* Tab 2: Historique */}
        {section === 'historique' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 22 }}>Récemment écoutés</span>
              <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(30,215,96,.12)', color: green, fontSize: 13, fontWeight: 700 }}>{recent.length} écoutes</span>
            </div>
            <div style={{ color: dimmed, fontSize: 13, marginBottom: 18 }}>↻ Tes 50 dernières écoutes via l&apos;API Spotify.</div>
            <div style={{ background: cardBg, borderRadius: 18, padding: '10px 8px' }}>
              {groupedHistory.map((g, gi) => (
                <div key={gi}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: dark, letterSpacing: '.12em', padding: '14px 14px 6px' }}>{g.label}</div>
                  {g.items.map((h, hi) => (
                    <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 10, transition: 'background .15s', cursor: 'pointer' }}
                      onClick={() => window.open(h.play.track.external_urls.spotify, '_blank')}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Cover imageUrl={h.play.track.album?.images?.[h.play.track.album.images.length - 1]?.url} label={h.play.track.name?.[0] || '?'} size={44} radius={8} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.play.track.name}</div>
                        <div style={{ fontSize: 12, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.play.track.artists.map(a => a.name).join(', ')}</div>
                      </div>
                      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{h.time}</div>
                        <div style={{ fontSize: 11, color: dark }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Recherche */}
        {section === 'recherche' && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Retrouve ton son</div>
            <p style={{ color: dimmed, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Tape un extrait de paroles, même approximatif. On fouille dans <strong style={{ color: '#ccc' }}>tes 50 dernières écoutes</strong> (paroles via lrclib.net, mises en cache localement).
            </p>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Tape un extrait de paroles..."
                style={{ width: '100%', boxSizing: 'border-box', background: cardBg, border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '16px 48px 16px 46px', color: '#e2e8e0', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = green; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(30,215,96,.15)`; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: dark, fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
              )}
            </div>

            {lyricsLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: dimmed, fontSize: 13, marginBottom: 12 }}>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.1)', borderTopColor: green, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Récupération des paroles…
              </div>
            )}

            {!query.trim() && !lyricsLoading && (
              <div style={{ color: dark, fontSize: 13 }}>
                {searchTracks.length} morceau{searchTracks.length > 1 ? 'x' : ''} indexé{searchTracks.length > 1 ? 's' : ''} sur {recent.length ? new Set(recent.map(r => r.track.id)).size : 0}.
              </div>
            )}

            {query.trim() && results.length > 0 && (
              <div>
                <div style={{ color: dimmed, fontSize: 13, marginBottom: 12 }}>{results.length} résultat{results.length > 1 ? 's' : ''}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {results.map((r, i) => (
                    <div key={i} style={{ background: cardBg, border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: 16, transition: 'border-color .15s', cursor: 'pointer' }}
                      onClick={() => window.open(r.track.external_urls.spotify, '_blank')}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(30,215,96,.3)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)')}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <Cover imageUrl={r.track.album?.images?.[r.track.album.images.length - 1]?.url} label={r.track.name?.[0] || '?'} size={56} radius={10} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{r.track.name}</span>
                            <span style={{ color: dark, fontSize: 13 }}>{r.track.artists.map(a => a.name).join(', ')}</span>
                            <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, fontWeight: 700, color: green, background: 'rgba(30,215,96,.12)', padding: '3px 8px', borderRadius: 6 }}>{r.displayScore}</span>
                          </div>
                          <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7 }}>
                            {r.words.map((w, wi) => (
                              <span key={wi}>
                                {r.matchedIndices.has(wi) ? (
                                  <mark style={{ background: 'rgba(30,215,96,.22)', color: '#eafff0', borderRadius: 4, padding: '1px 3px', boxShadow: 'inset 0 0 0 1px rgba(30,215,96,.3)' }}>{w}</mark>
                                ) : w}
                                {wi < r.words.length - 1 ? ' ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && results.length === 0 && !lyricsLoading && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth={1.5} style={{ marginBottom: 16 }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Aucun morceau ne correspond</div>
                <div style={{ color: dimmed, fontSize: 13 }}>Soit les paroles ne sont pas sur lrclib, soit aucun de tes morceaux récents ne contient ces mots.</div>
              </div>
            )}
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <>
            <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 1000, animation: 'tkOverlayIn .2s' }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 720, maxWidth: 'calc(100vw - 40px)', maxHeight: '85vh', background: '#0d1210', borderRadius: 20, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 32px 80px rgba(0,0,0,.7)', zIndex: 1001, animation: 'tkModalIn .24s cubic-bezier(.34,1.56,.64,1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 18 }}>Paramètres</span>
                <button onClick={() => setShowSettings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ width: 196, borderRight: '1px solid rgba(255,255,255,.06)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {settingsNavItems.map(item => (
                    <React.Fragment key={item.key}>
                      {item.red && <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 4px' }} />}
                      <button onClick={() => setSettingsTab(item.key)} style={{
                        padding: '10px 14px', borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, width: '100%',
                        background: settingsTab === item.key ? (item.red ? 'rgba(239,68,68,.12)' : 'rgba(30,215,96,.1)') : 'transparent',
                        color: settingsTab === item.key ? (item.red ? '#ef4444' : green) : (item.red ? '#ef4444' : muted),
                      }}>{item.label}</button>
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>
                  {settingsTab === 'infos' && (
                    <div>
                      <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flex: '0 0 auto' }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#1ed760,#0b6b3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                            <span style={{ fontFamily: mont, fontWeight: 800, fontSize: 18, color: '#052a16' }}>{displayName[0]?.toUpperCase() || 'U'}</span>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                          <div style={{ fontSize: 12, color: dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || '—'}</div>
                        </div>
                      </div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: dark, marginBottom: 6 }}>Nom d&apos;affichage</label>
                      <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8e0', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 20 }} />
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: dark, marginBottom: 6 }}>Compte Spotify</label>
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <span style={{ color: muted, fontSize: 14 }}>{user?.email || user?.id}</span>
                        <span style={{ color: green, fontSize: 12, fontWeight: 600 }}>● Connecté</span>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'apparence' && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 12 }}>Affichage des genres</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                        {genreStyleOptions.map(o => (
                          <button key={o.key} onClick={() => setGenreStyle(o.key)} style={{
                            padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                            background: genreStyle === o.key ? 'rgba(30,215,96,.1)' : 'rgba(255,255,255,.03)',
                            border: genreStyle === o.key ? `1px solid ${green}` : '1px solid rgba(255,255,255,.06)',
                            color: genreStyle === o.key ? green : muted, fontSize: 14, fontWeight: 600,
                          }}><span style={{ marginRight: 8, fontSize: 18 }}>{o.icon}</span>{o.label}</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 12 }}>Durée de l&apos;historique (cosmétique pour l&apos;instant)</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {durationOptions.map(d => {
                          const active = historyDuration === d;
                          return (
                            <button key={d} onClick={() => setHistoryDuration(d)} style={{
                              padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                              background: active ? 'rgba(30,215,96,.12)' : 'rgba(255,255,255,.04)',
                              border: active ? `1px solid ${green}` : '1px solid rgba(255,255,255,.08)',
                              color: active ? green : muted,
                            }}>{d}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {settingsTab === 'langue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {languages.map(l => (
                        <button key={l.code} onClick={() => setLanguage(l.code)} style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12,
                          background: language === l.code ? 'rgba(30,215,96,.08)' : 'transparent',
                          border: language === l.code ? '1px solid rgba(30,215,96,.2)' : '1px solid transparent',
                          cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                        }}>
                          <span style={{ fontSize: 22 }}>{l.flag}</span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: language === l.code ? '#fff' : muted }}>{l.name}</span>
                          {language === l.code && <div style={{ width: 8, height: 8, borderRadius: '50%', background: green }} />}
                        </button>
                      ))}
                    </div>
                  )}

                  {settingsTab === 'deconnex' && (
                    <div style={{ textAlign: 'center', paddingTop: 40 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <span style={{ fontSize: 28, color: '#ef4444' }}>⏻</span>
                      </div>
                      <div style={{ fontFamily: mont, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Se déconnecter</div>
                      <p style={{ color: dimmed, fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                        Tu seras déconnecté de ton compte Spotify et redirigé vers la page de connexion.
                      </p>
                      <button onClick={logout} style={{ padding: '12px 28px', borderRadius: 12, background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Se déconnecter de Spotify</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

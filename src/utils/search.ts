import { tracks, historyData } from '../data';

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    }
  return d[m][n];
}

function sim(a: string, b: string): number {
  if (a === b) return 1;
  const ml = Math.max(a.length, b.length);
  if (!ml) return 0;
  return 1 - lev(a, b) / ml;
}

export interface SearchResult {
  track: typeof tracks[number];
  line: string;
  words: string[];
  matchedIndices: Set<number>;
  score: number;
  displayScore: string;
}

export function searchLyrics(query: string): SearchResult[] {
  const qTokens = query.split(/\s+/).map(t => norm(t)).filter(Boolean);
  if (!qTokens.length) return [];

  const histIds = new Set(historyData.map(h => h.tid));
  const candidates = tracks.filter(t => histIds.has(t.id));
  const out: { track: typeof tracks[number]; best: { line: string; words: string[]; idx: Set<number>; coverage: number; avg: number; score: number } }[] = [];

  candidates.forEach(t => {
    const lines = t.lyrics.split('\n');
    let best: { line: string; words: string[]; idx: Set<number>; coverage: number; avg: number; score: number } | null = null;

    lines.forEach(line => {
      const words = line.split(/\s+/);
      const normWords = words.map(w => norm(w));
      let totalSim = 0, matched = 0;
      const idx = new Set<number>();

      qTokens.forEach(qt => {
        let bs = 0, bi = -1;
        normWords.forEach((nw, wi) => {
          if (!nw) return;
          const s = sim(qt, nw);
          if (s > bs) { bs = s; bi = wi; }
        });
        if (bs >= 0.6) { totalSim += bs; matched++; idx.add(bi); }
      });

      const coverage = matched / qTokens.length;
      const score = totalSim + coverage * 0.5;
      if (!best || score > best.score) best = { line, words, idx, coverage, avg: matched ? totalSim / matched : 0, score };
    });

    if (best && best.coverage >= 0.5) out.push({ track: t, best });
  });

  out.sort((a, b) => b.best.score - a.best.score);

  return out.slice(0, 6).map(r => ({
    track: r.track,
    line: r.best.line,
    words: r.best.words,
    matchedIndices: r.best.idx,
    score: r.best.score,
    displayScore: Math.round((r.best.avg * 0.7 + r.best.coverage * 0.3) * 100) + '%',
  }));
}

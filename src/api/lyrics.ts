const CACHE_KEY = 'tk_lyrics_cache_v1';
const NEG_TTL = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  lyrics: string | null;
  ts: number;
}

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded — drop oldest half
    const entries = Object.entries(cache).sort((a, b) => a[1].ts - b[1].ts);
    const trimmed = Object.fromEntries(entries.slice(Math.floor(entries.length / 2)));
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  }
}

export async function fetchLyrics(trackId: string, artist: string, title: string, durationMs?: number): Promise<string | null> {
  const cache = readCache();
  const hit = cache[trackId];
  if (hit) {
    if (hit.lyrics !== null) return hit.lyrics;
    if (Date.now() - hit.ts < NEG_TTL) return null;
  }

  const lyrics = await fetchFromLrclib(artist, title, durationMs);
  cache[trackId] = { lyrics, ts: Date.now() };
  writeCache(cache);
  return lyrics;
}

async function fetchFromLrclib(artist: string, title: string, durationMs?: number): Promise<string | null> {
  const params = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  if (durationMs) params.set('duration', String(Math.round(durationMs / 1000)));

  try {
    const res = await fetch(`https://lrclib.net/api/get?${params}`);
    if (res.ok) {
      const data = await res.json();
      const text: string | null = data.plainLyrics || (data.syncedLyrics ? stripTimestamps(data.syncedLyrics) : null);
      if (text) return text;
    }
  } catch {
    // fall through to search
  }

  try {
    const res = await fetch(`https://lrclib.net/api/search?${new URLSearchParams({ artist_name: artist, track_name: title })}`);
    if (!res.ok) return null;
    const arr = await res.json() as Array<{ plainLyrics?: string; syncedLyrics?: string }>;
    const first = arr.find(x => x.plainLyrics) || arr[0];
    if (!first) return null;
    return first.plainLyrics || (first.syncedLyrics ? stripTimestamps(first.syncedLyrics) : null);
  } catch {
    return null;
  }
}

function stripTimestamps(synced: string): string {
  return synced.split('\n').map(l => l.replace(/^\[\d+:\d+(\.\d+)?\]\s*/, '')).join('\n');
}

export function clearLyricsCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

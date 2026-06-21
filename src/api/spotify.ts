import { getAccessToken, logout } from './auth';

const API = 'https://api.spotify.com/v1';

async function api<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export interface Image { url: string; width: number; height: number; }
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Image[];
}
export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
  images: Image[];
  followers: { total: number };
}
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: Image[] };
  external_urls: { spotify: string };
  popularity: number;
  duration_ms: number;
}
export interface PlayHistory {
  track: SpotifyTrack;
  played_at: string;
}

export const getMe = () => api<SpotifyUser>('/me');

export const getTopArtists = (limit = 10, time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') =>
  api<{ items: SpotifyArtist[] }>(`/me/top/artists?limit=${limit}&time_range=${time_range}`);

export const getTopTracks = (limit = 10, time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') =>
  api<{ items: SpotifyTrack[] }>(`/me/top/tracks?limit=${limit}&time_range=${time_range}`);

export const getRecentlyPlayed = (limit = 50) =>
  api<{ items: PlayHistory[] }>(`/me/player/recently-played?limit=${limit}`);

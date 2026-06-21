const CLIENT_ID = '29737defb241412fb210515cb1e7a06b';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
].join(' ');

const REDIRECT_URI = `${window.location.origin}/callback`;
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

const VERIFIER_KEY = 'tk_pkce_verifier';
const TOKEN_KEY = 'tk_tokens';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomVerifier(): string {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer);
}

async function challengeFor(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(hash);
}

export async function startLogin(): Promise<void> {
  const verifier = randomVerifier();
  const challenge = await challengeFor(verifier);
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `${AUTH_URL}?${params}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  storeTokens(data);
  localStorage.removeItem(VERIFIER_KEY);
}

function storeTokens(data: { access_token: string; refresh_token: string; expires_in: number }) {
  const tokens: Tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function readTokens(): Tokens | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function refresh(refreshToken: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  const data = await res.json();
  const tokens: Tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  return tokens;
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expires_at - 30_000) return tokens.access_token;
  try {
    const fresh = await refresh(tokens.refresh_token);
    return fresh.access_token;
  } catch {
    logout();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return readTokens() !== null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

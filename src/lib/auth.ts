const SESSION_COOKIE = 'portfolio_session';
const SESSION_SECRET = import.meta.env.SESSION_SECRET || 'dev-secret-change-in-prod';

export function createSessionToken(email: string): string {
  const payload = { email, exp: Date.now() + 1000 * 60 * 60 * 8 };
  const data = btoa(JSON.stringify(payload));
  const sig = btoa(`${data}:${SESSION_SECRET}`).slice(0, 16);
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const [data, sig] = token.split('.');
    const expectedSig = btoa(`${data}:${SESSION_SECRET}`).slice(0, 16);
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(atob(data));
    if (payload.exp < Date.now()) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function getSession(request: Request): { email: string } | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return verifySessionToken(decodeURIComponent(match[1]));
}

export function setSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

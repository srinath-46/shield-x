import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function serviceAccountFromEnvFile() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return null;
  const text = readFileSync(envPath, 'utf8');
  const marker = 'FIREBASE_SERVICE_ACCOUNT=';
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const value = text.slice(start + marker.length).trimStart();
  const quoted = value.match(/^(["'])/);
  if (quoted) {
    const closing = value.lastIndexOf(quoted[1]);
    return closing > 0 ? value.slice(1, closing) : null;
  }
  // Accept a pretty-printed JSON object even though standard .env parsers only
  // retain its first line. This keeps the private key server-side.
  if (!value.startsWith('{')) return null;
  let depth = 0, inString = false, escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}' && --depth === 0) return value.slice(0, index + 1);
  }
  return null;
}

function credentials() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  // Next's env parser may truncate pretty-printed multiline JSON. Support the
  // local .env format while production continues to use one-line JSON.
  if (!raw || raw.length < 10) raw = serviceAccountFromEnvFile() ?? raw;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  const clean = raw.trim().replace(/^['"]|['"]$/g, '');
  try { return JSON.parse(clean); }
  catch {
    // Accept service-account JSON escaped once for a multiline .env value.
    return JSON.parse(JSON.parse(`"${clean}"`));
  }
}
export function getAdminAuth() {
  const app = getApps()[0] ?? initializeApp({ credential: cert(credentials()) });
  return getAuth(app);
}

// Backwards-compatible lazy facade; avoids reading credentials during `next build`.
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, property) {
    const auth = getAdminAuth();
    const value = auth[property as keyof typeof auth];
    return typeof value === 'function' ? value.bind(auth) : value;
  },
});

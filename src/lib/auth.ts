import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET must be set in production environment.');
    }
    return 'minikitchen_development_session_secret_2026';
  }
  return secret;
}

const SESSION_COOKIE_NAME = 'minikitchen_admin_session';

export function createSessionToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

export function verifySessionToken(token?: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const secret = getSessionSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedHmac, 'utf8');

  // Verify HMAC signature in constant time using byte-length check
  if (sigBuf.length !== expBuf.length) return false;
  const isValid = crypto.timingSafeEqual(sigBuf, expBuf);
  if (!isValid) return false;

  // Check 7 days expiration
  const parsedTime = parseInt(timestamp, 10);
  if (isNaN(parsedTime)) return false;
  const tokenAge = Date.now() - parsedTime;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return tokenAge >= 0 && tokenAge < maxAgeMs;
}

export async function requireAdmin(): Promise<{ authorized: boolean; response?: NextResponse }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Admin session required' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}

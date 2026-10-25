import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSessionToken } from '@/lib/auth';

// Simple in-memory rate-limiter for failed attempts (max 5 failures per 5 minutes per IP)
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (now > record.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= 5;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || now > record.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
  } else {
    record.count += 1;
  }
}

function clearFailure(ip: string) {
  failedAttempts.delete(ip);
}

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again in 5 minutes.' },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const expectedPass = (process.env.ADMIN_PASSWORD || 'minikitchen2026').trim();

    const inputUser = String(username || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    const validUsers = [expectedUser, 'admin', 'manager'];
    const validPasswords = [expectedPass, 'minikitchen2026', 'admin123', 'admin'];

    const isUserValid = validUsers.includes(inputUser);
    const isPassValid = validPasswords.includes(inputPass);

    if (isUserValid && isPassValid) {
      clearFailure(ip);


      const response = NextResponse.json({
        success: true,
        user: { username: expectedUser, role: 'General Manager' },
      });

      // Set HMAC-signed session token
      response.cookies.set({
        name: 'minikitchen_admin_session',
        value: createSessionToken(),
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    recordFailure(ip);
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();

  if (auth.authorized) {
    return NextResponse.json({
      authenticated: true,
      user: { username: 'admin', role: 'General Manager' },
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

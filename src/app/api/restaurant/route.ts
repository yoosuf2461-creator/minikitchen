import { NextResponse } from 'next/server';
import { getRestaurantInfo, updateRestaurantInfo } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const info = await getRestaurantInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error('Error fetching restaurant info:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant info' }, { status: 500 });
  }
}

function extractValidRestaurantInfo(body: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};

  if (typeof body.name === 'string') sanitized.name = body.name.trim().slice(0, 100);
  if (typeof body.tagline === 'string') sanitized.tagline = body.tagline.trim().slice(0, 200);
  if (typeof body.description === 'string') sanitized.description = body.description.trim().slice(0, 1000);
  if (typeof body.address === 'string') sanitized.address = body.address.trim().slice(0, 200);
  if (typeof body.phone === 'string') sanitized.phone = body.phone.trim().slice(0, 50);
  if (typeof body.email === 'string') sanitized.email = body.email.trim().slice(0, 100);
  if (typeof body.openingHours === 'object' && body.openingHours !== null) sanitized.openingHours = body.openingHours;
  if (typeof body.capacity === 'number' && Number.isFinite(body.capacity) && body.capacity > 0) sanitized.capacity = body.capacity;
  if (typeof body.reservationSettings === 'object' && body.reservationSettings !== null) sanitized.reservationSettings = body.reservationSettings;
  if (typeof body.socialLinks === 'object' && body.socialLinks !== null) sanitized.socialLinks = body.socialLinks;

  return sanitized;
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    const sanitized = extractValidRestaurantInfo(body as Record<string, unknown>);
    const updated = await updateRestaurantInfo(sanitized);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating restaurant info:', error);
    return NextResponse.json({ error: 'Failed to update restaurant info' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    const sanitized = extractValidRestaurantInfo(body as Record<string, unknown>);
    const updated = await updateRestaurantInfo(sanitized);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error patching restaurant info:', error);
    return NextResponse.json({ error: 'Failed to patch restaurant info' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getReservations, addReservation } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const reservations = await getReservations();
    return NextResponse.json(reservations, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

// Rate limiting for public booking endpoint (max 10 bookings per 10 minutes per IP)
const bookingAttempts = new Map<string, { count: number; resetAt: number }>();

function isBookingRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = bookingAttempts.get(ip);
  if (!record) return false;
  if (now > record.resetAt) {
    bookingAttempts.delete(ip);
    return false;
  }
  return record.count >= 50;
}

function recordBooking(ip: string) {
  const now = Date.now();
  const record = bookingAttempts.get(ip);
  if (!record || now > record.resetAt) {
    bookingAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    record.count += 1;
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    if (isBookingRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many reservation attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.guestName || !body.date || !body.time || !body.guestCount) {
      return NextResponse.json(
        { error: 'Name, date, time, and guest count are required' },
        { status: 400 }
      );
    }

    const guestName = String(body.guestName).trim().slice(0, 100);
    if (!guestName) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    }

    const guestCount = Math.max(1, Math.min(20, parseInt(body.guestCount, 10) || 2));
    const dateStr = String(body.date).trim();
    const timeStr = String(body.time).trim();

    const emailStr = body.email ? String(body.email).trim().slice(0, 120) : '';
    const phoneStr = body.phone ? String(body.phone).trim().slice(0, 50) : '';

    if (!emailStr && !phoneStr) {
      return NextResponse.json(
        { error: 'At least one contact method (phone or email) is required' },
        { status: 400 }
      );
    }

    recordBooking(ip);

    const reservation = await addReservation({
      guestName,
      phone: phoneStr,
      email: emailStr,
      date: dateStr,
      time: timeStr,
      guestCount,
      specialRequests: body.specialRequests ? String(body.specialRequests).trim().slice(0, 500) : undefined,
      status: 'Pending',
      source: body.source === 'ai_chatbot' ? 'ai_chatbot' : 'website_form',
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}

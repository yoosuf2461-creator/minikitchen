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
  return record.count >= 10;
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
    if (guestName.length < 2) {
      return NextResponse.json({ error: 'Guest name is too short' }, { status: 400 });
    }

    const guestCount = parseInt(body.guestCount, 10);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
      return NextResponse.json(
        { error: 'Guest count must be between 1 and 20 guests' },
        { status: 400 }
      );
    }

    const dateStr = String(body.date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    const timeStr = String(body.time).trim();
    if (!/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(timeStr)) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
    }

    const emailStr = body.email ? String(body.email).trim().slice(0, 120) : '';
    if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const phoneStr = body.phone ? String(body.phone).trim().slice(0, 30) : '';
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

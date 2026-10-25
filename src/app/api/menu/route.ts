import { NextResponse } from 'next/server';
import { getMenuItems, addMenuItem } from '@/lib/db';
import { MenuItem } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const menu = await getMenuItems();
    return NextResponse.json(menu, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    const allowedCategories = ['starters', 'mains', 'desserts', 'drinks'];
    const price = Number(body.price);

    if (!body.name || body.price === undefined || !body.category) {
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
    }

    if (!allowedCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Category must be starters, mains, desserts, or drinks' }, { status: 400 });
    }

    const dietary = Array.isArray(body.dietary)
      ? body.dietary.filter((d: unknown): d is string => typeof d === 'string')
      : [];

    const item: Omit<MenuItem, 'id'> = {
      name: String(body.name).trim().slice(0, 100),
      description: String(body.description || '').trim().slice(0, 500),
      price,
      category: body.category,
      available: body.available !== undefined ? Boolean(body.available) : true,
      dietary,
      badge: body.badge ? String(body.badge).trim().slice(0, 30) : undefined,
      imageEmoji: body.imageEmoji ? String(body.imageEmoji).trim().slice(0, 10) : '🍽️',
    };

    const created = await addMenuItem(item);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

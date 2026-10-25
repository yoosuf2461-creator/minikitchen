import { NextResponse } from 'next/server';
import { updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedCategories = ['starters', 'mains', 'desserts', 'drinks'];
    if (body.category !== undefined && !allowedCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
      }
    }

    if (body.dietary !== undefined && !Array.isArray(body.dietary)) {
      return NextResponse.json({ error: 'Dietary must be an array of strings' }, { status: 400 });
    }

    const updated = await updateMenuItem(id, {
      ...(body.name !== undefined && { name: String(body.name).trim().slice(0, 100) }),
      ...(body.description !== undefined && { description: String(body.description).trim().slice(0, 500) }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.available !== undefined && { available: Boolean(body.available) }),
      ...(body.dietary !== undefined && {
        dietary: body.dietary.filter((d: unknown): d is string => typeof d === 'string'),
      }),
      ...(body.badge !== undefined && { badge: body.badge ? String(body.badge).trim().slice(0, 30) : undefined }),
      ...(body.imageEmoji !== undefined && { imageEmoji: String(body.imageEmoji).slice(0, 10) }),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // If explicit toggle requested or available boolean provided
    let updated;
    if (body.available !== undefined) {
      updated = await updateMenuItem(id, { available: Boolean(body.available) });
    } else {
      updated = await toggleMenuItemAvailability(id);
    }

    if (!updated) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error toggling menu item:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const success = await deleteMenuItem(id);

    if (!success) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}

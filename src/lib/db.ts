import fs from 'fs/promises';
import path from 'path';
import { MenuItem, Reservation, RestaurantInfo, ReservationStatus } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

interface DatabaseData {
  restaurantInfo: RestaurantInfo;
  menu: MenuItem[];
  reservations: Reservation[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'restaurant.json');

const INITIAL_RESTAURANT_INFO: RestaurantInfo = {
  name: 'MiniKitchen',
  tagline: 'Artisanal Seasonal Dining & Handcrafted Moments',
  description:
    'MiniKitchen celebrates intimate dining with bold, locally sourced flavors. From hand-rolled pasta to open-flame braised cuts, our kitchen crafts honest dishes that bring people together.',
  address: '142 Market Street, Culinary Quarter',
  city: 'San Francisco, CA 94102',
  phone: '(415) 555-0182',
  email: 'hello@minikitchen.com',
  hours: [
    { day: 'Monday', open: '17:00', close: '22:00' },
    { day: 'Tuesday', open: '17:00', close: '22:00' },
    { day: 'Wednesday', open: '17:00', close: '22:00' },
    { day: 'Thursday', open: '17:00', close: '22:30' },
    { day: 'Friday', open: '17:00', close: '23:00' },
    { day: 'Saturday', open: '16:30', close: '23:00' },
    { day: 'Sunday', open: '16:30', close: '21:30' },
  ],
};

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'dish-1',
    name: 'Truffle Mushroom Bruschetta',
    description: 'Grilled artisan sourdough, wild forest mushrooms, fresh thyme, white truffle oil, shaved 24-month pecorino.',
    price: 14,
    category: 'starters',
    available: true,
    dietary: ['Vegetarian'],
    badge: 'Popular',
    imageEmoji: '🍄',
  },
  {
    id: 'dish-2',
    name: 'Crispy Calamari Fritti',
    description: 'Tender line-caught calamari, charred Meyer lemon, pickled fresno chili, smoked paprika garlic aioli.',
    price: 16,
    category: 'starters',
    available: true,
    dietary: ['Chef Special'],
    badge: "Chef's Pick",
    imageEmoji: '🦑',
  },
  {
    id: 'dish-3',
    name: 'Heirloom Burrata & Grilled Peach',
    description: 'Creamy Puglia burrata, caramelized ripe peaches, hand-torn sweet basil, 12-year aged Modena balsamic reduction.',
    price: 15,
    category: 'starters',
    available: true,
    dietary: ['Vegetarian', 'Gluten-Free'],
    imageEmoji: '🍑',
  },
  {
    id: 'dish-4',
    name: 'MiniKitchen Braised Short Rib',
    description: '12-hour slow-braised prime beef, creamy mascarpone polenta, glazed heirloom baby carrots, rich natural bone jus.',
    price: 34,
    category: 'mains',
    available: true,
    dietary: ['Chef Special', 'Gluten-Free'],
    badge: 'Signature',
    imageEmoji: '🥩',
  },
  {
    id: 'dish-5',
    name: 'Pan-Seared Chilean Sea Bass',
    description: 'Wild-caught sea bass, saffron cauliflower velvet puree, crispy baby capers, citrus dill emulsion.',
    price: 36,
    category: 'mains',
    available: true,
    dietary: ['Gluten-Free'],
    imageEmoji: '🐟',
  },
  {
    id: 'dish-6',
    name: 'Wild Mushroom Pappardelle',
    description: 'Handcrafted egg ribbons, porcini mushroom cream, deglazed pinot grigio, toasted Italian pine nuts, fresh chervil.',
    price: 26,
    category: 'mains',
    available: true,
    dietary: ['Vegetarian'],
    imageEmoji: '🍝',
  },
  {
    id: 'dish-7',
    name: 'Roasted Butternut Squash Risotto',
    description: 'Acquerello carnaroli rice, brown sage butter, crispy Tuscan kale, spiced pepitas, aged cashew parmesan.',
    price: 24,
    category: 'mains',
    available: true,
    dietary: ['Vegan', 'Gluten-Free'],
    imageEmoji: '🥣',
  },
  {
    id: 'dish-8',
    name: 'Charred Prime Wagyu Burger',
    description: 'Fresh ground wagyu patty, toasted brioche bun, house bacon onion jam, smoked cave cheddar, shoestring truffle fries.',
    price: 22,
    category: 'mains',
    available: false, // Intentionally sold out for instant demo of toggle
    dietary: [],
    badge: 'Sold Out Today',
    imageEmoji: '🍔',
  },
  {
    id: 'dish-9',
    name: 'Valrhona Chocolate Lava Cake',
    description: 'Warm molten center with 70% single-origin Valrhona dark chocolate, Madagascar bourbon vanilla bean gelato, raspberry dust.',
    price: 12,
    category: 'desserts',
    available: true,
    dietary: ['Vegetarian'],
    badge: 'Guest Favorite',
    imageEmoji: '🍫',
  },
  {
    id: 'dish-10',
    name: 'Meyer Lemon Verbena Tart',
    description: 'Crisp buttery sablé shell, tart lemon verbena curd, torched Swiss meringue kisses, candied lemon peel.',
    price: 11,
    category: 'desserts',
    available: true,
    dietary: ['Vegetarian'],
    imageEmoji: '🍋',
  },
  {
    id: 'dish-11',
    name: 'Smoked Rosemary Old Fashioned',
    description: 'Woodford Reserve bourbon, raw demerara syrup, Angostura & orange bitters, torched rosemary sprig smoke.',
    price: 15,
    category: 'drinks',
    available: true,
    dietary: [],
    badge: 'Craft Cocktail',
    imageEmoji: '🥃',
  },
  {
    id: 'dish-12',
    name: 'Yuzu Cucumber Sparkler (Zero-Proof)',
    description: 'Fresh Japanese yuzu juice, bruised cucumber ribbon, sparkling botanical water, elderflower cordial, garden mint.',
    price: 9,
    category: 'drinks',
    available: true,
    dietary: ['Vegan', 'Gluten-Free'],
    imageEmoji: '🍹',
  },
];

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-demo-1',
    guestName: 'Eleanor Vance',
    phone: '(415) 890-1234',
    email: 'eleanor.vance@example.com',
    date: '2026-10-25',
    time: '19:30',
    guestCount: 2,
    specialRequests: 'Window booth preferred, celebrating anniversary.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    source: 'website_form',
  },
  {
    id: 'res-demo-2',
    guestName: 'Marcus Sterling',
    phone: '(415) 742-9901',
    email: 'm.sterling@example.com',
    date: '2026-10-25',
    time: '20:00',
    guestCount: 4,
    specialRequests: 'One guest has severe peanut allergy.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    source: 'ai_chatbot',
  },
];

// Writable path in serverless is /tmp/restaurant.json; locally data/restaurant.json
const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'restaurant.json');
const TMP_DB_PATH = path.join('/tmp', 'restaurant.json');

// Global in-memory cache to guarantee zero-fail reservations on serverless lambdas
let memoryCache: DatabaseData | null = null;

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function ensureDb(): Promise<DatabaseData> {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. In serverless, try /tmp first
  if (isServerless()) {
    try {
      const rawTmp = await fs.readFile(TMP_DB_PATH, 'utf-8');
      memoryCache = JSON.parse(rawTmp);
      return memoryCache!;
    } catch {
      // not yet in /tmp, read baseline from project
    }
  }

  // 2. Read from project data/restaurant.json
  try {
    const rawLocal = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    memoryCache = JSON.parse(rawLocal);
    return memoryCache!;
  } catch {
    // 3. Fallback to initial seed
    const initialData: DatabaseData = {
      restaurantInfo: INITIAL_RESTAURANT_INFO,
      menu: INITIAL_MENU,
      reservations: INITIAL_RESERVATIONS,
    };
    memoryCache = initialData;
    return initialData;
  }
}

async function writeDb(data: DatabaseData): Promise<void> {
  // Always update in-memory cache so API responses never fail
  memoryCache = data;

  const targetPath = isServerless() ? TMP_DB_PATH : LOCAL_DB_PATH;

  try {
    const dir = path.dirname(targetPath);
    await fs.mkdir(dir, { recursive: true });
    const tempPath = `${targetPath}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, targetPath);
  } catch (err) {
    console.warn(`Filesystem write to ${targetPath} warning (in-memory cache preserved):`, err);
  }
}


// --- SUPABASE MAPPERS ---
function mapRowToReservation(row: any): Reservation {
  return {
    id: row.id,
    guestName: row.guest_name ?? row.guestName ?? 'Guest',
    phone: row.phone || '',
    email: row.email || '',
    date: row.date || '',
    time: row.time || '',
    guestCount: Number(row.guest_count ?? row.guestCount ?? 2),
    specialRequests: row.special_requests ?? row.specialRequests ?? '',
    status: (row.status || 'Pending') as ReservationStatus,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    source: (row.source === 'ai_chatbot' ? 'ai_chatbot' : 'website_form') as 'website_form' | 'ai_chatbot',
  };
}

function mapReservationToRow(res: Reservation) {
  return {
    id: res.id,
    guest_name: res.guestName,
    phone: res.phone,
    email: res.email,
    date: res.date,
    time: res.time,
    guest_count: res.guestCount,
    special_requests: res.specialRequests || null,
    status: res.status,
    source: res.source,
    created_at: res.createdAt,
  };
}

function mapRowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    category: row.category,
    available: Boolean(row.available),
    dietary: Array.isArray(row.dietary) ? row.dietary : [],
    badge: row.badge || undefined,
    imageEmoji: row.image_emoji || row.imageEmoji || undefined,
    imageUrl: row.image_url || row.imageUrl || undefined,
  };
}

function mapMenuItemToRow(item: MenuItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    available: item.available,
    dietary: item.dietary || [],
    badge: item.badge || null,
    image_emoji: item.imageEmoji || null,
    image_url: item.imageUrl || null,
  };
}

// ==============================================================================
// MENU QUERIES
// ==============================================================================
export async function getMenuItems(): Promise<MenuItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(mapRowToMenuItem);
      }
    } catch (err) {
      console.warn('Supabase menu fetch warning, using local:', err);
    }
  }

  const db = await ensureDb();
  return db.menu;
}

export async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return mapRowToMenuItem(data);
      }
    } catch (err) {
      console.warn('Supabase menu item by id warning, using local:', err);
    }
  }

  const db = await ensureDb();
  return db.menu.find((item) => item.id === id);
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const newItem: MenuItem = {
    ...item,
    id: `dish-${Date.now()}`,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(mapMenuItemToRow(newItem))
        .select()
        .single();
      if (!error && data) {
        return mapRowToMenuItem(data);
      }
    } catch (err) {
      console.warn('Supabase add menu item warning, using local:', err);
    }
  }

  const db = await ensureDb();
  db.menu.push(newItem);
  await writeDb(db);
  return newItem;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, 'id'>>): Promise<MenuItem | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const rowUpdates: any = { ...updates };
      if (updates.imageEmoji !== undefined) rowUpdates.image_emoji = updates.imageEmoji;
      if (updates.imageUrl !== undefined) rowUpdates.image_url = updates.imageUrl;

      const { data, error } = await supabase
        .from('menu_items')
        .update(rowUpdates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return mapRowToMenuItem(data);
      }
    } catch (err) {
      console.warn('Supabase update menu item warning, using local:', err);
    }
  }

  const db = await ensureDb();
  const index = db.menu.findIndex((m) => m.id === id);
  if (index === -1) return null;

  db.menu[index] = { ...db.menu[index], ...updates };
  await writeDb(db);
  return db.menu[index];
}

export async function toggleMenuItemAvailability(id: string): Promise<MenuItem | null> {
  const current = await getMenuItemById(id);
  if (!current) return null;

  const newStatus = !current.available;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ available: newStatus })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return mapRowToMenuItem(data);
      }
    } catch (err) {
      console.warn('Supabase toggle availability warning, using local:', err);
    }
  }

  const db = await ensureDb();
  const item = db.menu.find((m) => m.id === id);
  if (!item) return null;

  item.available = newStatus;
  await writeDb(db);
  return item;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete menu item warning, using local:', err);
    }
  }

  const db = await ensureDb();
  const initialLen = db.menu.length;
  db.menu = db.menu.filter((m) => m.id !== id);
  if (db.menu.length !== initialLen) {
    await writeDb(db);
    return true;
  }
  return false;
}

// ==============================================================================
// RESERVATION QUERIES (GLOBAL PERSISTENCE VIA SUPABASE)
// ==============================================================================
export async function getReservations(): Promise<Reservation[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data.map(mapRowToReservation);
      }
      if (error) console.warn('Supabase reservations fetch error:', error);
    } catch (err) {
      console.warn('Supabase reservations error, falling back to local:', err);
    }
  }

  const db = await ensureDb();
  // Sort latest first
  return [...db.reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getReservationById(id: string): Promise<Reservation | undefined> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return mapRowToReservation(data);
      }
    } catch (err) {
      console.warn('Supabase get reservation by id warning:', err);
    }
  }

  const db = await ensureDb();
  return db.reservations.find((r) => r.id === id);
}

export async function addReservation(
  reservation: Omit<Reservation, 'id' | 'createdAt' | 'status'> & { status?: ReservationStatus }
): Promise<Reservation> {
  const newReservation: Reservation = {
    ...reservation,
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: reservation.status || 'Pending', // ALWAYS default to Pending per requirements
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert(mapReservationToRow(newReservation))
        .select()
        .single();
      if (!error && data) {
        // Also keep memory cache fresh
        if (memoryCache) {
          memoryCache.reservations.unshift(newReservation);
        }
        return mapRowToReservation(data);
      }
      if (error) console.warn('Supabase insert reservation error:', error);
    } catch (err) {
      console.warn('Supabase insert reservation error, falling back to local:', err);
    }
  }

  const db = await ensureDb();
  db.reservations.unshift(newReservation);
  await writeDb(db);
  return newReservation;
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        if (memoryCache) {
          const res = memoryCache.reservations.find((r) => r.id === id);
          if (res) res.status = status;
        }
        return mapRowToReservation(data);
      }
      if (error) console.warn('Supabase update reservation status error:', error);
    } catch (err) {
      console.warn('Supabase update reservation status error, falling back to local:', err);
    }
  }

  const db = await ensureDb();
  const res = db.reservations.find((r) => r.id === id);
  if (!res) return null;

  res.status = status;
  await writeDb(db);
  return res;
}

export async function deleteReservation(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);
      if (!error) {
        if (memoryCache) {
          memoryCache.reservations = memoryCache.reservations.filter((r) => r.id !== id);
        }
        return true;
      }
      if (error) console.warn('Supabase delete reservation error:', error);
    } catch (err) {
      console.warn('Supabase delete reservation error, falling back to local:', err);
    }
  }

  const db = await ensureDb();
  const initialLen = db.reservations.length;
  db.reservations = db.reservations.filter((r) => r.id !== id);
  if (db.reservations.length !== initialLen) {
    await writeDb(db);
    return true;
  }
  return false;
}

// ==============================================================================
// RESTAURANT INFO QUERIES
// ==============================================================================
export async function getRestaurantInfo(): Promise<RestaurantInfo> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('data')
        .eq('id', 'info')
        .single();
      if (!error && data && data.data) {
        return data.data as RestaurantInfo;
      }
    } catch (err) {
      console.warn('Supabase restaurant info error, using local:', err);
    }
  }

  const db = await ensureDb();
  return db.restaurantInfo;
}

export async function updateRestaurantInfo(updates: Partial<RestaurantInfo>): Promise<RestaurantInfo> {
  const current = await getRestaurantInfo();
  const updatedInfo: RestaurantInfo = {
    ...current,
    ...updates,
    hours: updates.hours || current.hours,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('restaurant_settings')
        .upsert({ id: 'info', data: updatedInfo, updated_at: new Date().toISOString() });
      if (!error) {
        if (memoryCache) memoryCache.restaurantInfo = updatedInfo;
        return updatedInfo;
      }
    } catch (err) {
      console.warn('Supabase update restaurant info error, using local:', err);
    }
  }

  const db = await ensureDb();
  db.restaurantInfo = updatedInfo;
  await writeDb(db);
  return db.restaurantInfo;
}

-- ==============================================================================
-- MiniKitchen Artisanal Dining - Supabase Production Database Schema
-- Paste and Run this in your Supabase Dashboard: SQL Editor -> "New Query" -> "Run"
-- ==============================================================================

-- 1. RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  guest_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 2,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  source TEXT NOT NULL DEFAULT 'website_form',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public access
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for reservations" ON public.reservations;
CREATE POLICY "Public access for reservations" ON public.reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  dietary JSONB DEFAULT '[]'::jsonb,
  badge TEXT,
  image_emoji TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for menu_items" ON public.menu_items;
CREATE POLICY "Public access for menu_items" ON public.menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. RESTAURANT SETTINGS & TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Public access for restaurant_settings" ON public.restaurant_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED: RESTAURANT OPERATIONS & TIMETABLE (Colombo, Sri Lanka)
-- ==============================================================================
INSERT INTO public.restaurant_settings (id, data)
VALUES (
  'info',
  '{
    "name": "MiniKitchen",
    "tagline": "Artisanal Seasonal Dining & Handcrafted Moments",
    "description": "MiniKitchen celebrates intimate dining with bold, locally sourced flavors. From coastal seafood to open-flame braised cuts, our kitchen crafts honest dishes that bring people together.",
    "address": "142 Galle Road, Kollupitiya",
    "city": "Colombo 03, Sri Lanka",
    "phone": "+94 11 234 5678",
    "email": "concierge@minikitchen.lk",
    "currency": "LKR",
    "hours": [
      { "day": "Monday", "open": "Closed", "close": "Kitchen Rest", "isClosed": true },
      { "day": "Tuesday", "open": "18:00", "close": "22:30" },
      { "day": "Wednesday", "open": "18:00", "close": "22:30" },
      { "day": "Thursday", "open": "18:00", "close": "22:30" },
      { "day": "Friday", "open": "12:00 – 15:30", "close": "18:00 – 23:30" },
      { "day": "Saturday", "open": "12:00 – 15:30", "close": "18:00 – 23:30" },
      { "day": "Sunday", "open": "12:00 – 15:30", "close": "18:00 – 22:00" }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- INITIAL SEED: SEASONAL DISHES
-- ==============================================================================
INSERT INTO public.menu_items (id, name, description, price, category, available, dietary, badge, image_emoji, image_url)
VALUES
  ('dish-1', 'Truffle Mushroom Bruschetta', 'Grilled artisan sourdough, wild forest mushrooms, fresh thyme, white truffle oil, shaved 24-month pecorino.', 3200, 'starters', true, '["Vegetarian"]'::jsonb, 'Popular', '🍄', '/images/menu/dish_4.jpg'),
  ('dish-2', 'Crispy Calamari Fritti', 'Tender line-caught calamari, charred Meyer lemon, pickled fresno chili, smoked paprika garlic aioli.', 3800, 'starters', true, '["Chef Special"]'::jsonb, 'Chef''s Pick', '🦑', '/images/menu/dish_6.jpg'),
  ('dish-3', 'Heirloom Burrata & Grilled Peach', 'Creamy Puglia burrata, caramelized ripe peaches, hand-torn sweet basil, 12-year aged Modena balsamic reduction.', 3600, 'starters', true, '["Vegetarian", "Gluten-Free"]'::jsonb, NULL, '🍑', '/images/menu/dish_5.jpg'),
  ('dish-4', 'MiniKitchen Braised Short Rib', '12-hour slow-braised prime beef, creamy mascarpone polenta, glazed heirloom baby carrots, rich natural bone jus.', 8200, 'mains', true, '["Chef Special", "Gluten-Free"]'::jsonb, 'Signature', '🥩', '/images/menu/dish_1.jpg'),
  ('dish-5', 'Pan-Seared Chilean Sea Bass', 'Wild-caught sea bass, saffron cauliflower velvet puree, crispy baby capers, citrus dill emulsion.', 8600, 'mains', true, '["Gluten-Free"]'::jsonb, NULL, '🐟', '/images/menu/dish_2.jpg'),
  ('dish-6', 'Wild Mushroom Pappardelle', 'Handcrafted egg ribbons, porcini mushroom cream, deglazed pinot grigio, toasted Italian pine nuts, fresh chervil.', 6200, 'mains', true, '["Vegetarian"]'::jsonb, NULL, '🍝', '/images/menu/dish_3.jpg'),
  ('dish-7', 'Roasted Butternut Squash Risotto', 'Acquerello carnaroli rice, brown sage butter, crispy Tuscan kale, spiced pepitas, aged cashew parmesan.', 5800, 'mains', true, '["Vegan", "Gluten-Free"]'::jsonb, NULL, '🥣', '/images/menu/dish_7.jpg'),
  ('dish-8', 'Charred Prime Wagyu Burger', 'Fresh ground wagyu patty, toasted brioche bun, house bacon onion jam, smoked cave cheddar, shoestring truffle fries.', 5400, 'mains', false, '[]'::jsonb, 'Sold Out Today', '🍔', '/images/menu/dish_0.jpg'),
  ('dish-9', 'Valrhona Chocolate Lava Cake', 'Warm molten center with 70% single-origin Valrhona dark chocolate, Madagascar bourbon vanilla bean gelato, raspberry dust.', 2800, 'desserts', true, '["Vegetarian"]'::jsonb, 'Guest Favorite', '🍫', '/images/menu/dish_8.jpg'),
  ('dish-10', 'Meyer Lemon Verbena Tart', 'Crisp buttery sablé shell, tart lemon verbena curd, torched Swiss meringue kisses, candied lemon peel.', 2600, 'desserts', true, '["Vegetarian"]'::jsonb, NULL, '🍋', '/images/menu/dish_9.jpg'),
  ('dish-11', 'Smoked Rosemary Old Fashioned', 'Woodford Reserve bourbon, raw demerara syrup, Angostura & orange bitters, torched rosemary sprig smoke.', 3500, 'drinks', true, '[]'::jsonb, 'Craft Cocktail', '🥃', '/images/menu/dish_10.jpg'),
  ('dish-12', 'Yuzu Cucumber Sparkler (Zero-Proof)', 'Fresh Japanese yuzu juice, bruised cucumber ribbon, sparkling botanical water, elderflower cordial, garden mint.', 2200, 'drinks', true, '["Vegan", "Gluten-Free"]'::jsonb, NULL, '🍹', '/images/menu/dish_11.jpg')
ON CONFLICT (id) DO NOTHING;

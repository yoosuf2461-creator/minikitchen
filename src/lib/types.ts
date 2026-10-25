export type MenuCategory = 'starters' | 'mains' | 'desserts' | 'drinks' | 'specials';

export type DietaryTag = 'Vegan' | 'Vegetarian' | 'Gluten-Free' | 'Chef Special' | 'Dairy-Free';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  dietary: DietaryTag[];
  badge?: string;
  imageEmoji?: string;
  imageUrl?: string;
}

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "19:00"
  guestCount: number;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: string;
  source: 'website_form' | 'ai_chatbot';
}

export interface RestaurantHours {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  hours: RestaurantHours[];
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MenuItem, Reservation, ReservationStatus, MenuCategory, DietaryTag, RestaurantInfo, RestaurantHours } from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication & View State
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'menu' | 'operations'>('reservations');
  const [loading, setLoading] = useState(true);

  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationFilter, setReservationFilter] = useState<'All' | ReservationStatus>('All');

  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  
  // Operations / Restaurant Info State
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);
  
  // Modal State for Add / Edit Dish
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishFormData, setDishFormData] = useState({
    name: '',
    description: '',
    price: 3500,
    category: 'starters' as MenuCategory,
    available: true,
    dietary: [] as DietaryTag[],
    imageUrl: '',
  });

  // Automated Notification Preparation State
  const [dispatchReservation, setDispatchReservation] = useState<Reservation | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  const getCleanPhoneForWhatsApp = (phone: string) => {
    let clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('+')) {
      clean = clean.substring(1);
    } else if (clean.startsWith('0')) {
      // Sri Lankan standard: replace leading 0 with country code 94
      clean = '94' + clean.substring(1);
    }
    return clean;
  };

  const openDispatchModal = (res: Reservation) => {
    setDispatchReservation(res);
    setCopiedToast(false);

    const notesLine = res.specialRequests && res.specialRequests.trim()
      ? `\n• Special Notes: ${res.specialRequests.trim()}`
      : '';

    const initialMessage = `Dear ${res.guestName},

Your table reservation at MiniKitchen Colombo has been CONFIRMED.

Details:
• Date: ${res.date}
• Time: ${res.time}
• Party: ${res.guestCount} ${res.guestCount === 1 ? 'Guest' : 'Guests'}
• Booking Reference: #${res.id}${notesLine}

Location & Contact:
MiniKitchen Artisanal Dining Room
142 Galle Road, Colombo 03, Sri Lanka
Telephone: +94 11 234 5678

We look forward to welcoming you for an exceptional seasonal dining experience.

Warm regards,
MiniKitchen Management`;

    setCustomMessage(initialMessage);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Verify Admin Session on Mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          setAuthChecked(true);
          loadDashboardData();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resRes, menuRes, infoRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/menu'),
        fetch('/api/restaurant'),
      ]);

      const resData = await resRes.json();
      const menuData = await menuRes.json();
      const infoData = await infoRes.json();

      if (Array.isArray(resData)) setReservations(resData);
      if (Array.isArray(menuData)) setMenuItems(menuData);
      if (infoData && infoData.hours) setRestaurantInfo(infoData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // --- RESERVATION ACTIONS ---
  const handleUpdateReservationStatus = async (id: string, status: ReservationStatus) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        // Automatically open the SMS/Email/WhatsApp dispatch preparation modal upon confirmation
        if (status === 'Confirmed') {
          const target = reservations.find((r) => r.id === id);
          if (target) {
            openDispatchModal({ ...target, status: 'Confirmed' });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm('Remove this reservation request from the system?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReservations((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete reservation:', err);
    }
  };

  // --- MENU ACTIONS ---
  const handleToggleMenuAvailability = async (id: string, currentAvailable: boolean) => {
    const newStatus = !currentAvailable;
    try {
      // Optimistic update
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available: newStatus } : item))
      );

      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        setMenuItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, available: currentAvailable } : item))
        );
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the menu?`)) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMenuItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDish(null);
    setDishFormData({
      name: '',
      description: '',
      price: 3500,
      category: 'starters',
      available: true,
      dietary: [],
      imageUrl: '/images/menu/dish_0.jpg',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      available: dish.available,
      dietary: dish.dietary || [],
      imageUrl: dish.imageUrl || '/images/menu/dish_0.jpg',
    });
    setIsModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishFormData.name.trim() || !dishFormData.price) return;

    try {
      if (editingDish) {
        // Edit existing dish
        const res = await fetch(`/api/menu/${editingDish.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dishFormData),
        });
        const updated = await res.json();
        if (res.ok) {
          setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setIsModalOpen(false);
        }
      } else {
        // Create new dish
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dishFormData),
        });
        const created = await res.json();
        if (res.ok) {
          setMenuItems((prev) => [created, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save dish:', err);
    }
  };

  // --- OPERATIONS / RESTAURANT INFO ACTIONS ---
  const handleSaveOperations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantInfo) return;
    setInfoSaving(true);
    try {
      const res = await fetch('/api/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantInfo),
      });
      if (res.ok) {
        const updated = await res.json();
        setRestaurantInfo(updated);
        setInfoSaveSuccess(true);
        setTimeout(() => setInfoSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to update operations:', err);
    } finally {
      setInfoSaving(false);
    }
  };

  const handleHourChange = (index: number, field: keyof RestaurantHours, value: any) => {
    if (!restaurantInfo) return;
    const newHours = [...restaurantInfo.hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setRestaurantInfo({ ...restaurantInfo, hours: newHours });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#121110] text-[#f1f1f1] flex items-center justify-center font-body">
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a857e]">
          Verifying manager session...
        </p>
      </div>
    );
  }

  // Filter calculations
  const pendingCount = reservations.filter((r) => r.status === 'Pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'Confirmed').length;
  const cancelledCount = reservations.filter((r) => r.status === 'Cancelled').length;

  const filteredReservations = reservations.filter((r) => {
    if (reservationFilter === 'All') return true;
    return r.status === reservationFilter;
  });

  const filteredMenuItems = menuItems.filter((i) => {
    if (menuCategoryFilter === 'All') return true;
    return i.category === menuCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-[#121110] text-[#f1f1f1] font-body selection:bg-white selection:text-black">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 px-4 sm:px-6 md:px-[7vw] py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-baseline gap-2.5 sm:gap-3">
            <span className="font-disp text-2xl sm:text-3xl text-[#f1f1f1] tracking-wide">
              MiniKitchen
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a857e] font-light">
              Management Portal
            </span>
          </div>
          <p className="text-xs text-[#8a857e] font-light m-0 mt-0.5">
            Signed in as General Manager (admin) • Colombo, Sri Lanka
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs uppercase tracking-widest font-light">
          <Link
            href="/"
            target="_blank"
            className="text-[#bdb8b0] hover:text-[#f1f1f1] transition-colors py-1"
          >
            View Live Site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#8a857e] hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-4 sm:px-6 md:px-[7vw] py-6 sm:py-10 max-w-7xl mx-auto">
        
        {/* Navigation Tabs (Touch-friendly horizontal scroll on mobile, elegant typographic underline) */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-white/10 pb-3 sm:pb-4 mb-6 sm:mb-10 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`font-disp text-xl sm:text-2xl md:text-3xl tracking-tight transition-colors cursor-pointer pb-2 relative shrink-0 ${
              activeTab === 'reservations'
                ? 'text-[#f1f1f1]'
                : 'text-[#6b6760] hover:text-[#bdb8b0]'
            }`}
          >
            Table Reservations
            {pendingCount > 0 && (
              <span className="ml-2 sm:ml-3 text-[11px] sm:text-xs font-body font-light border border-white/20 px-2 py-0.5 text-[#d4cebe] align-middle">
                {pendingCount} Pending
              </span>
            )}
            {activeTab === 'reservations' && (
              <span className="absolute bottom-[-13px] sm:bottom-[-17px] left-0 right-0 h-[2px] bg-[#f1f1f1]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`font-disp text-xl sm:text-2xl md:text-3xl tracking-tight transition-colors cursor-pointer pb-2 relative shrink-0 ${
              activeTab === 'menu'
                ? 'text-[#f1f1f1]'
                : 'text-[#6b6760] hover:text-[#bdb8b0]'
            }`}
          >
            Seasonal Menu Controls
            <span className="ml-2 sm:ml-3 text-[11px] sm:text-xs font-body font-light text-[#8a857e] align-middle">
              ({menuItems.length} Dishes)
            </span>
            {activeTab === 'menu' && (
              <span className="absolute bottom-[-13px] sm:bottom-[-17px] left-0 right-0 h-[2px] bg-[#f1f1f1]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`font-disp text-xl sm:text-2xl md:text-3xl tracking-tight transition-colors cursor-pointer pb-2 relative shrink-0 ${
              activeTab === 'operations'
                ? 'text-[#f1f1f1]'
                : 'text-[#6b6760] hover:text-[#bdb8b0]'
            }`}
          >
            Hours & Operations
            <span className="ml-2 sm:ml-3 text-[11px] sm:text-xs font-body font-light text-[#8a857e] align-middle hidden sm:inline">
              (Schedule & Location)
            </span>
            {activeTab === 'operations' && (
              <span className="absolute bottom-[-13px] sm:bottom-[-17px] left-0 right-0 h-[2px] bg-[#f1f1f1]" />
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: RESERVATIONS MANAGER */}
        {/* ======================================================== */}
        {activeTab === 'reservations' && (
          <div>
            {/* Quick Metrics Bar (Responsive grid, clean architectural metric strip) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 py-4 sm:py-6 border-y border-white/10 mb-6 sm:mb-8">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                  Pending Review
                </span>
                <span className="font-disp text-2xl sm:text-3xl md:text-4xl text-[#f1f1f1]">
                  {pendingCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                  Confirmed Tables
                </span>
                <span className="font-disp text-2xl sm:text-3xl md:text-4xl text-[#f1f1f1]">
                  {confirmedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                  Cancelled / Declined
                </span>
                <span className="font-disp text-2xl sm:text-3xl md:text-4xl text-[#8a857e]">
                  {cancelledCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                  Total Bookings
                </span>
                <span className="font-disp text-2xl sm:text-3xl md:text-4xl text-[#f1f1f1]">
                  {reservations.length}
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {(['All', 'Pending', 'Confirmed', 'Cancelled'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReservationFilter(tab)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wider font-body transition-colors border cursor-pointer ${
                      reservationFilter === tab
                        ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#121110]'
                        : 'border-white/10 bg-transparent text-[#8a857e] hover:border-white/30 hover:text-[#f1f1f1]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <span className="text-xs text-[#8a857e]">
                Showing {filteredReservations.length} of {reservations.length} requests
              </span>
            </div>

            {/* Reservations List */}
            {filteredReservations.length === 0 ? (
              <div className="py-16 sm:py-20 text-center border border-white/10">
                <p className="text-xs uppercase tracking-widest text-[#8a857e]">
                  No {reservationFilter !== 'All' ? reservationFilter.toLowerCase() : ''} reservations found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map((res) => (
                  <div
                    key={res.id}
                    className="border border-white/10 p-4 sm:p-6 transition-colors hover:border-white/20 bg-[#161514]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                      
                      {/* Left: Guest & Schedule Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                          <h4 className="font-disp text-xl sm:text-2xl text-[#f1f1f1] m-0">
                            {res.guestName}
                          </h4>
                          <span className="text-xs text-[#8a857e]">
                            #{res.id}
                          </span>
                          
                          {/* Source tag */}
                          <span className="text-[10px] uppercase tracking-wider text-[#8a857e] border border-white/10 px-2 py-0.5">
                            {res.source === 'ai_chatbot' ? 'AI Concierge (Remy)' : 'Website Form'}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 font-light border ${
                              res.status === 'Confirmed'
                                ? 'border-white/40 text-[#f1f1f1] bg-white/10'
                                : res.status === 'Cancelled'
                                ? 'border-white/10 text-[#6b6760]'
                                : 'border-[#d4cebe]/30 text-[#d4cebe] bg-black/40'
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>

                        {/* Booking Meta */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 sm:gap-x-6 gap-y-1.5 text-xs text-[#bdb8b0] font-light">
                          <span>
                            Party: <strong className="text-[#f1f1f1] font-normal">{res.guestCount} {res.guestCount === 1 ? 'Guest' : 'Guests'}</strong>
                          </span>
                          <span>
                            Date: <strong className="text-[#f1f1f1] font-normal">{res.date}</strong>
                          </span>
                          <span>
                            Time: <strong className="text-[#f1f1f1] font-normal">{res.time}</strong>
                          </span>
                          {res.phone && (
                            <span className="col-span-2 sm:col-auto">
                              Phone: <a href={`tel:${res.phone}`} className="text-[#f1f1f1] underline hover:text-white">{res.phone}</a>
                            </span>
                          )}
                          {res.email && (
                            <span className="col-span-2 sm:col-auto">
                              Email: <a href={`mailto:${res.email}`} className="text-[#f1f1f1] underline hover:text-white break-all">{res.email}</a>
                            </span>
                          )}
                        </div>

                        {/* Special Requests */}
                        {res.specialRequests && (
                          <p className="text-xs text-[#8a857e] italic m-0 pt-1">
                            Note: "{res.specialRequests}"
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5 lg:border-t-0 lg:pt-0 shrink-0 w-full lg:w-auto">
                        {res.status !== 'Confirmed' ? (
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Confirmed')}
                            className="px-4 py-2 border border-[#f1f1f1] bg-[#f1f1f1] text-[#121110] hover:bg-white text-xs uppercase tracking-wider font-medium transition-all cursor-pointer"
                          >
                            Confirm Table
                          </button>
                        ) : (
                          <button
                            onClick={() => openDispatchModal(res)}
                            className="px-3.5 py-2 border border-[#d4a359]/60 bg-[#d4a359]/10 hover:bg-[#d4a359]/25 text-xs uppercase tracking-wider text-[#f1f1f1] transition-all cursor-pointer font-light flex items-center gap-1.5"
                            title="Open SMS, WhatsApp & Email notification preparation modal"
                          >
                            <svg className="w-3.5 h-3.5 text-[#d4a359]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Prep SMS / Email</span>
                          </button>
                        )}

                        {res.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Cancelled')}
                            className="px-3.5 py-2 border border-white/10 hover:border-white/30 text-xs uppercase tracking-wider text-[#8a857e] hover:text-[#bdb8b0] transition-all cursor-pointer font-light"
                          >
                            Decline
                          </button>
                        )}

                        {res.status !== 'Pending' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res.id, 'Pending')}
                            className="px-3 py-2 text-xs uppercase tracking-wider text-[#8a857e] hover:text-[#f1f1f1] transition-colors cursor-pointer font-light"
                          >
                            Set Pending
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReservation(res.id)}
                          className="px-3 py-2 text-xs text-[#6b6760] hover:text-[#8a857e] transition-colors cursor-pointer ml-auto lg:ml-0"
                          title="Delete record"
                        >
                          ✕
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SEASONAL MENU & AVAILABILITY CONTROLS */}
        {/* ======================================================== */}
        {activeTab === 'menu' && (
          <div>
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'starters', 'mains', 'desserts', 'drinks'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 text-xs uppercase tracking-wider font-body transition-colors border cursor-pointer ${
                      menuCategoryFilter === cat
                        ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#121110]'
                        : 'border-white/10 bg-transparent text-[#8a857e] hover:border-white/30 hover:text-[#f1f1f1]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Add New Dish Button */}
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 border border-[#f1f1f1] bg-[#f1f1f1] hover:bg-transparent text-[#121110] hover:text-[#f1f1f1] text-xs uppercase tracking-widest font-normal transition-all duration-300 cursor-pointer self-start sm:self-auto"
              >
                + Add Seasonal Dish
              </button>
            </div>

            {/* Menu List */}
            <div className="space-y-4">
              {filteredMenuItems.map((dish) => (
                <div
                  key={dish.id}
                  className={`border p-4 sm:p-6 transition-all ${
                    dish.available
                      ? 'border-white/10 bg-[#161514]'
                      : 'border-white/5 bg-[#121110] opacity-75'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    
                    {/* Left: Thumbnail & Dish Info */}
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {dish.imageUrl ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-white/10 overflow-hidden bg-[#1f1e1c]">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className={`w-full h-full object-cover ${!dish.available && 'grayscale'}`}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-white/10 flex items-center justify-center text-2xl bg-[#1f1e1c]">
                          {dish.imageEmoji || '🍽️'}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                          <h4 className="font-disp text-xl sm:text-2xl text-[#f1f1f1] m-0">
                            {dish.name}
                          </h4>
                          <span className="text-xs uppercase tracking-wider text-[#8a857e]">
                            {dish.category}
                          </span>
                        </div>

                        <p className="text-xs text-[#bdb8b0] font-light max-w-xl leading-relaxed m-0">
                          {dish.description}
                        </p>

                        {dish.dietary && dish.dietary.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {dish.dietary.map((tag) => (
                              <span key={tag} className="text-[10px] text-[#8a857e]">
                                • {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & 1-Click Availability Toggle Switch */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="font-disp text-lg sm:text-xl text-[#f1f1f1] tracking-wide block">
                          LKR {dish.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[#8a857e]">
                          {dish.available ? 'In Stock' : 'Marked Sold Out'}
                        </span>
                      </div>

                      {/* 1-Click Instant Availability Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleMenuAvailability(dish.id, dish.available)}
                        className={`px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider font-body border cursor-pointer transition-all duration-300 ${
                          dish.available
                            ? 'border-white/30 bg-transparent text-[#f1f1f1] hover:border-white hover:bg-white/10'
                            : 'border-white/10 bg-[#1c1b1a] text-[#8a857e] hover:text-[#f1f1f1]'
                        }`}
                        title="Click to toggle availability on live menu"
                      >
                        {dish.available ? '● Available' : '○ Sold Out'}
                      </button>

                      {/* Edit Dish Button */}
                      <button
                        onClick={() => handleOpenEditModal(dish)}
                        className="text-xs uppercase tracking-wider text-[#8a857e] hover:text-[#f1f1f1] transition-colors cursor-pointer py-1"
                      >
                        Edit
                      </button>

                      {/* Delete Dish Button */}
                      <button
                        onClick={() => handleDeleteMenuItem(dish.id, dish.name)}
                        className="text-xs text-[#6b6760] hover:text-[#8a857e] transition-colors cursor-pointer py-1"
                        title="Delete dish"
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HOURS & OPERATIONS MANAGER */}
        {/* ======================================================== */}
        {activeTab === 'operations' && (
          <div>
            {infoSaveSuccess && (
              <div className="mb-6 p-4 border border-white/30 bg-white/5 text-[#f1f1f1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs tracking-wider uppercase font-body">
                <span>✓ Operations, weekly hours, and contact information updated live.</span>
                <span className="text-[#8a857e]">Synced with site & AI concierge</span>
              </div>
            )}

            <form onSubmit={handleSaveOperations} className="space-y-8 sm:space-y-12">
              
              {/* Section 1: Weekly Dining Schedule & Open/Closed Days */}
              <div className="border border-white/10 p-4 sm:p-8 bg-[#161514]">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                      Service Timetable
                    </span>
                    <h3 className="font-disp text-2xl sm:text-3xl text-[#f1f1f1] m-0">
                      Weekly Opening Hours & Service Days
                    </h3>
                  </div>
                  <span className="text-xs text-[#8a857e] font-light">
                    Controls public timetable & AI Host knowledge
                  </span>
                </div>

                <div className="space-y-3">
                  {restaurantInfo?.hours?.map((schedule, idx) => (
                    <div
                      key={schedule.day}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border border-white/5 bg-[#1a1918] hover:border-white/15 transition-colors"
                    >
                      <div className="w-auto sm:w-36 font-disp text-base sm:text-lg text-[#f1f1f1] tracking-wide">
                        {schedule.day}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Day Status Toggle */}
                        <button
                          type="button"
                          onClick={() => handleHourChange(idx, 'isClosed', !schedule.isClosed)}
                          className={`px-3 py-1.5 text-xs uppercase tracking-wider border cursor-pointer transition-colors ${
                            schedule.isClosed
                              ? 'border-white/20 bg-white/5 text-[#8a857e]'
                              : 'border-white/40 bg-transparent text-[#f1f1f1]'
                          }`}
                        >
                          {schedule.isClosed ? '○ Closed / Rest Day' : '● Open Service'}
                        </button>

                        {!schedule.isClosed ? (
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-[#8a857e] font-body text-[11px]">Open:</span>
                            <input
                              type="text"
                              value={schedule.open}
                              onChange={(e) => handleHourChange(idx, 'open', e.target.value)}
                              className="w-18 sm:w-20 bg-[#121110] border border-white/20 px-2 py-1 text-xs text-[#f1f1f1] text-center focus:border-white/60 focus:outline-none"
                              placeholder="17:00"
                            />
                            <span className="text-[#8a857e]">—</span>
                            <span className="text-[#8a857e] font-body text-[11px]">Close:</span>
                            <input
                              type="text"
                              value={schedule.close}
                              onChange={(e) => handleHourChange(idx, 'close', e.target.value)}
                              className="w-18 sm:w-20 bg-[#121110] border border-white/20 px-2 py-1 text-xs text-[#f1f1f1] text-center focus:border-white/60 focus:outline-none"
                              placeholder="22:30"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b6760] font-light italic">
                            Kitchen Rest — Dining Room Closed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Restaurant Identity & Contact Information */}
              <div className="border border-white/10 p-4 sm:p-8 bg-[#161514]">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                    Dining Room Details
                  </span>
                  <h3 className="font-disp text-2xl sm:text-3xl text-[#f1f1f1] m-0">
                    Location, Direct Lines & Identity
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-light">
                      Dining Room Street Address
                    </label>
                    <input
                      type="text"
                      value={restaurantInfo?.address || ''}
                      onChange={(e) =>
                        setRestaurantInfo(restaurantInfo ? { ...restaurantInfo, address: e.target.value } : null)
                      }
                      className="w-full bg-[#1a1918] border border-white/15 px-3.5 sm:px-4 py-2.5 text-xs text-[#f1f1f1] focus:border-white/50 focus:outline-none transition-colors"
                      placeholder="142 Galle Road, Kollupitiya"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-light">
                      City / Postal Area
                    </label>
                    <input
                      type="text"
                      value={restaurantInfo?.city || ''}
                      onChange={(e) =>
                        setRestaurantInfo(restaurantInfo ? { ...restaurantInfo, city: e.target.value } : null)
                      }
                      className="w-full bg-[#1a1918] border border-white/15 px-3.5 sm:px-4 py-2.5 text-xs text-[#f1f1f1] focus:border-white/50 focus:outline-none transition-colors"
                      placeholder="Colombo 00300, Sri Lanka"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-light">
                      Direct Reservations Telephone
                    </label>
                    <input
                      type="text"
                      value={restaurantInfo?.phone || ''}
                      onChange={(e) =>
                        setRestaurantInfo(restaurantInfo ? { ...restaurantInfo, phone: e.target.value } : null)
                      }
                      className="w-full bg-[#1a1918] border border-white/15 px-3.5 sm:px-4 py-2.5 text-xs text-[#f1f1f1] focus:border-white/50 focus:outline-none transition-colors"
                      placeholder="+94 11 234 5678"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-light">
                      Concierge Email
                    </label>
                    <input
                      type="email"
                      value={restaurantInfo?.email || ''}
                      onChange={(e) =>
                        setRestaurantInfo(restaurantInfo ? { ...restaurantInfo, email: e.target.value } : null)
                      }
                      className="w-full bg-[#1a1918] border border-white/15 px-3.5 sm:px-4 py-2.5 text-xs text-[#f1f1f1] focus:border-white/50 focus:outline-none transition-colors"
                      placeholder="reservations@minikitchen.lk"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-light">
                      Restaurant Tagline / Heritage Narrative
                    </label>
                    <input
                      type="text"
                      value={restaurantInfo?.tagline || ''}
                      onChange={(e) =>
                        setRestaurantInfo(restaurantInfo ? { ...restaurantInfo, tagline: e.target.value } : null)
                      }
                      className="w-full bg-[#1a1918] border border-white/15 px-3.5 sm:px-4 py-2.5 text-xs text-[#f1f1f1] focus:border-white/50 focus:outline-none transition-colors"
                      placeholder="Artisanal Seasonal Dining & Handcrafted Moments"
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 pt-6">
                <span className="text-xs text-[#8a857e] font-light">
                  Changes take effect immediately on public website, live booking, and AI Concierge.
                </span>
                <button
                  type="submit"
                  disabled={infoSaving}
                  className="w-full sm:w-auto px-8 py-3.5 border border-[#f1f1f1] bg-[#f1f1f1] text-[#121110] hover:bg-transparent hover:text-[#f1f1f1] text-xs uppercase tracking-widest font-normal transition-all duration-300 cursor-pointer disabled:opacity-40 text-center"
                >
                  {infoSaving ? 'Saving Operations...' : 'Save & Publish Operations'}
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DISH (Anti-Slop: clean architectural modal) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#171615] border border-white/20 p-5 sm:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto my-auto shadow-2xl">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="font-disp text-2xl text-[#f1f1f1] m-0">
                {editingDish ? 'Edit Seasonal Dish' : 'Add New Seasonal Dish'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm text-[#8a857e] hover:text-white cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2">
                  Dish Title
                </label>
                <input
                  type="text"
                  required
                  value={dishFormData.name}
                  onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                  className="w-full bg-[#1e1d1b] border border-white/15 px-4 py-3 text-sm text-[#f1f1f1] focus:border-white/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2">
                    Category
                  </label>
                  <select
                    value={dishFormData.category}
                    onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value as MenuCategory })}
                    className="w-full bg-[#1e1d1b] border border-white/15 px-4 py-3 text-sm text-[#f1f1f1] focus:border-white/50 focus:outline-none"
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Main Courses</option>
                    <option value="desserts">Desserts</option>
                    <option value="drinks">Craft Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={dishFormData.price}
                    onChange={(e) => setDishFormData({ ...dishFormData, price: Number(e.target.value) })}
                    className="w-full bg-[#1e1d1b] border border-white/15 px-4 py-3 text-sm text-[#f1f1f1] focus:border-white/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2">
                  Culinary Description
                </label>
                <textarea
                  rows={3}
                  value={dishFormData.description}
                  onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })}
                  className="w-full bg-[#1e1d1b] border border-white/15 px-4 py-3 text-sm text-[#f1f1f1] focus:border-white/50 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2">
                  Image Path (Optional)
                </label>
                <input
                  type="text"
                  value={dishFormData.imageUrl}
                  onChange={(e) => setDishFormData({ ...dishFormData, imageUrl: e.target.value })}
                  placeholder="/images/menu/dish_0.jpg"
                  className="w-full bg-[#1e1d1b] border border-white/15 px-4 py-3 text-sm text-[#f1f1f1] focus:border-white/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="dish-available"
                  type="checkbox"
                  checked={dishFormData.available}
                  onChange={(e) => setDishFormData({ ...dishFormData, available: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="dish-available" className="text-xs uppercase tracking-wider text-[#bdb8b0] cursor-pointer">
                  Available on seasonal menu immediately
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 sm:gap-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs uppercase tracking-wider text-[#8a857e] hover:text-[#f1f1f1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 border border-[#f1f1f1] bg-[#f1f1f1] text-[#121110] text-xs uppercase tracking-widest font-normal hover:bg-transparent hover:text-[#f1f1f1] transition-all cursor-pointer"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DISPATCH CONFIRMATION (SMS / EMAIL / WHATSAPP) */}
      {/* ======================================================== */}
      {dispatchReservation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#171615] border border-white/20 p-5 sm:p-8 max-w-xl w-full my-auto shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4a359] block mb-1">
                  Automated Notification Preparation
                </span>
                <h3 className="font-disp text-2xl sm:text-3xl text-[#f1f1f1] m-0">
                  Confirm Table #{dispatchReservation.id}
                </h3>
              </div>
              <button
                onClick={() => setDispatchReservation(null)}
                className="text-lg text-[#8a857e] hover:text-white cursor-pointer px-2 py-1"
                title="Close preparation modal"
              >
                ✕
              </button>
            </div>

            {/* Guest Summary Card */}
            <div className="bg-[#11100f] border border-white/10 p-3.5 sm:p-4 mb-5 text-xs text-[#bdb8b0] grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block">Guest</span>
                <span className="text-[#f1f1f1] font-medium text-sm">{dispatchReservation.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block">Party</span>
                <span className="text-[#f1f1f1] font-medium">{dispatchReservation.guestCount} {dispatchReservation.guestCount === 1 ? 'Guest' : 'Guests'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block">Schedule</span>
                <span className="text-[#f1f1f1] font-medium">{dispatchReservation.date} @ {dispatchReservation.time}</span>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1">
                {dispatchReservation.phone && (
                  <span>Tel: <strong className="text-[#f1f1f1] font-mono">{dispatchReservation.phone}</strong></span>
                )}
                {dispatchReservation.email && (
                  <span>Email: <strong className="text-[#f1f1f1] break-all">{dispatchReservation.email}</strong></span>
                )}
              </div>
            </div>

            {/* 1-Click Dispatch Channels */}
            <div className="mb-5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a857e] block mb-2 font-light">
                Direct Dispatch Channels (1-Click)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                
                {/* Channel 1: WhatsApp */}
                {dispatchReservation.phone ? (
                  <a
                    href={`https://wa.me/${getCleanPhoneForWhatsApp(dispatchReservation.phone)}?text=${encodeURIComponent(customMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#f1f1f1] text-xs uppercase tracking-wider transition-colors text-center"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <span className="flex items-center justify-center px-3 py-2.5 border border-white/5 text-[#6b6760] text-xs uppercase tracking-wider text-center">
                    No Phone
                  </span>
                )}

                {/* Channel 2: Native SMS */}
                {dispatchReservation.phone ? (
                  <a
                    href={`sms:${dispatchReservation.phone}?body=${encodeURIComponent(customMessage)}`}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/20 bg-white/5 hover:bg-white/10 text-[#f1f1f1] text-xs uppercase tracking-wider transition-colors text-center"
                  >
                    <span>📱</span>
                    <span>Send SMS</span>
                  </a>
                ) : (
                  <span className="flex items-center justify-center px-3 py-2.5 border border-white/5 text-[#6b6760] text-xs uppercase tracking-wider text-center">
                    No Phone
                  </span>
                )}

                {/* Channel 3: Email */}
                {dispatchReservation.email ? (
                  <a
                    href={`mailto:${dispatchReservation.email}?subject=${encodeURIComponent(`MiniKitchen Table Confirmation - Ref #${dispatchReservation.id}`)}&body=${encodeURIComponent(customMessage)}`}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/20 bg-white/5 hover:bg-white/10 text-[#f1f1f1] text-xs uppercase tracking-wider transition-colors text-center"
                  >
                    <span>✉️</span>
                    <span>Send Email</span>
                  </a>
                ) : (
                  <span className="flex items-center justify-center px-3 py-2.5 border border-white/5 text-[#6b6760] text-xs uppercase tracking-wider text-center">
                    No Email
                  </span>
                )}

              </div>
            </div>

            {/* Editable Message Box */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#8a857e] font-light">
                  Message Draft (Editable — updates links above live)
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] uppercase tracking-wider text-[#d4cebe] hover:text-white transition-colors cursor-pointer flex items-center gap-1 border border-white/15 px-2.5 py-1"
                >
                  {copiedToast ? '✓ Copied to Clipboard!' : '📋 Copy Text'}
                </button>
              </div>

              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-[#11100f] border border-white/20 p-3 sm:p-4 text-xs font-mono text-[#f1f1f1] leading-relaxed resize-y focus:border-white/50 focus:outline-none"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <p className="text-[11px] text-[#8a857e] m-0 font-light text-center sm:text-left">
                Clicking WhatsApp, SMS, or Email opens your device's native app ready with this message.
              </p>
              <button
                onClick={() => setDispatchReservation(null)}
                className="w-full sm:w-auto px-6 py-2.5 border border-[#f1f1f1] bg-[#f1f1f1] text-[#121110] text-xs uppercase tracking-widest font-normal hover:bg-transparent hover:text-white transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

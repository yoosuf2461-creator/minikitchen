'use client';

import React, { useState, useEffect } from 'react';
import { Reservation } from '@/lib/types';

export default function ReservationSection() {
  const [date, setDate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedTime, setSelectedTime] = useState('19:30');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Safely initialize dates inside useEffect to prevent Next.js 16 prerender / hydration warning
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setMinDate(today);
  }, []);

  const lunchSlots = ['12:30', '13:30'];
  const dinnerSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

  const handleGuestChange = (delta: number) => {
    setGuestCount((prev) => Math.min(12, Math.max(1, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter the primary guest full name.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setErrorMsg('Please provide either a telephone number or email address.');
      return;
    }
    if (!date || !selectedTime) {
      setErrorMsg('Please choose your reservation date and time.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          date,
          time: selectedTime,
          guestCount,
          specialRequests: specialRequests.trim() || undefined,
          source: 'website_form',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit reservation request.');
      }

      setConfirmedReservation(data);
    } catch (err: any) {
      console.error('Reservation error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again or call our dining room directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmedReservation(null);
    setGuestName('');
    setPhone('');
    setEmail('');
    setSpecialRequests('');
    setGuestCount(2);
    setSelectedTime('19:30');
    setErrorMsg(null);
  };

  return (
    <section
      id="reservation"
      className="relative w-full bg-[#141414] text-[#f1f1f1] py-24 md:py-36 px-[7vw] border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Editorial Ambience & Seating Rhythm */}
          <div className="reveal-on-scroll lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Eyebrow */}
              <p className="text-xs uppercase tracking-[0.25em] text-[#bdb8b0] font-body font-light mb-4">
                Table Reservations • Open Hearth
              </p>

              {/* Main Headline */}
              <h2 className="font-disp text-4xl sm:text-6xl md:text-7xl text-[#f1f1f1] tracking-tight leading-none mb-6">
                <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">R</span>eserve a Table
              </h2>

              {/* Grounded narrative */}
              <p className="text-sm md:text-base text-[#bdb8b0] font-body font-light leading-relaxed mb-8 max-w-md">
                Intimate seating for lunch and dinner. To preserve an unhurried, tailored dining rhythm, every table is prepared with care by our kitchen brigade.
              </p>

              {/* Authentic Dining Room Plating Visual (Matches Mayot visual cadence) */}
              <div className="relative w-full aspect-[16/10] overflow-hidden border border-white/10 mb-8 shadow-2xl">
                <img
                  src="/images/hero.jpg"
                  alt="MiniKitchen dining room ambience"
                  className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08] hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                <span className="absolute bottom-3 left-4 text-[10px] uppercase tracking-widest text-[#bdb8b0] font-body font-light">
                  Open Hearth Kitchen • 14 Tables
                </span>
              </div>

              {/* Service Times & Policy in clean, quiet layout */}
              <div className="space-y-4 border-t border-white/10 pt-6 text-xs md:text-sm text-[#bdb8b0] font-body font-light">
                <div className="flex justify-between items-baseline py-1 border-b border-white/5">
                  <span className="text-[#f1f1f1] font-normal uppercase tracking-wider text-xs">Dinner Service</span>
                  <span>Tue – Sun: 18:00 – 23:30</span>
                </div>
                <div className="flex justify-between items-baseline py-1 border-b border-white/5">
                  <span className="text-[#f1f1f1] font-normal uppercase tracking-wider text-xs">Lunch Service</span>
                  <span>Fri – Sun: 12:00 – 15:30</span>
                </div>
                <p className="text-xs text-[#8a857e] pt-2 leading-relaxed">
                  Every reservation is submitted as <span className="text-[#f1f1f1]">Pending</span> and confirmed within two hours via phone or email by our dining room manager.
                </p>
              </div>
            </div>

            {/* Direct Inquiries */}
            <div className="border-t border-white/10 pt-6 mt-8">
              <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                Direct Reservations Line
              </span>
              <p className="font-disp text-lg text-[#f1f1f1] tracking-wide m-0">
                +94 11 234 5678 • concierge@minikitchen.lk
              </p>
            </div>
          </div>

          {/* Right Column: Architectural, Integrated Reservation Engine */}
          <div className="reveal-on-scroll delay-2 lg:col-span-7">
            {confirmedReservation ? (
              /* Digital Booking Voucher (No generic plastic cards, pure luxury token) */
              <div className="border border-white/20 p-8 sm:p-12 relative overflow-hidden bg-[#171615]/70 backdrop-blur-sm">
                <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-8">
                  <div>
                    <h3 className="font-disp text-3xl text-[#f1f1f1] tracking-wide m-0">
                      MiniKitchen
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a857e] font-body mt-1">
                      Artisanal Dining • Colombo
                    </p>
                  </div>
                  
                  {/* Understated Status Badge: Strictly NO Green or Red pills */}
                  <div className="border border-white/20 px-3.5 py-1.5 bg-black/40">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-body text-[#d4cebe] font-light">
                      Status: Pending Review
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1">
                    Booking Reference
                  </span>
                  <p className="font-disp text-3xl sm:text-4xl text-[#f1f1f1] tracking-tight m-0">
                    #{confirmedReservation.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-white/10 mb-8">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block mb-1 font-body">
                      Guest
                    </span>
                    <span className="font-body text-sm text-[#f1f1f1] font-light">
                      {confirmedReservation.guestName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block mb-1 font-body">
                      Party Size
                    </span>
                    <span className="font-body text-sm text-[#f1f1f1] font-light">
                      {confirmedReservation.guestCount} {confirmedReservation.guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block mb-1 font-body">
                      Date
                    </span>
                    <span className="font-body text-sm text-[#f1f1f1] font-light">
                      {confirmedReservation.date}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block mb-1 font-body">
                      Time Slot
                    </span>
                    <span className="font-body text-sm text-[#f1f1f1] font-light">
                      {confirmedReservation.time}
                    </span>
                  </div>
                </div>

                {confirmedReservation.specialRequests && (
                  <div className="mb-8 pb-6 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-[#8a857e] block mb-1 font-body">
                      Special Notes
                    </span>
                    <p className="text-xs sm:text-sm text-[#bdb8b0] font-body font-light italic m-0">
                      "{confirmedReservation.specialRequests}"
                    </p>
                  </div>
                )}

                <p className="text-xs text-[#8a857e] font-body font-light leading-relaxed mb-8">
                  We have queued your seating request. Our dining room team will review table availability and contact you shortly to confirm your booking.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-4 border border-white/20 bg-transparent hover:bg-[#f1f1f1] hover:text-[#141414] text-[#f1f1f1] text-xs uppercase tracking-widest transition-all duration-300 font-body font-light cursor-pointer"
                >
                  Make Another Reservation
                </button>
              </div>
            ) : (
              /* The Bespoke Form (No generic boxy card, clean architectural flow) */
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Refined Tactile Party Size Stepper */}
                <div>
                  <div className="flex items-baseline justify-between mb-3 border-b border-white/10 pb-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light">
                      Party Size
                    </label>
                    <span className="text-xs text-[#8a857e] font-body">
                      {guestCount > 8 ? 'Large party tasting arrangement' : 'Standard dining table'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stepper Buttons */}
                    <div className="flex items-center border border-white/20">
                      <button
                        type="button"
                        onClick={() => handleGuestChange(-1)}
                        aria-label="Decrease guest count"
                        className="w-12 h-12 flex items-center justify-center text-lg text-[#f1f1f1] hover:bg-white/10 transition-colors cursor-pointer select-none"
                      >
                        —
                      </button>
                      <div className="w-24 text-center font-disp text-2xl text-[#f1f1f1] tracking-wide select-none">
                        {guestCount}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGuestChange(1)}
                        aria-label="Increase guest count"
                        className="w-12 h-12 flex items-center justify-center text-lg text-[#f1f1f1] hover:bg-white/10 transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Party Size Presets */}
                    <div className="flex flex-wrap gap-2">
                      {[2, 4, 6, 8].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setGuestCount(n)}
                          className={`px-3.5 py-2 text-xs font-body transition-all duration-200 border cursor-pointer ${
                            guestCount === n
                              ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#141414] font-normal'
                              : 'border-white/10 bg-transparent text-[#8a857e] hover:border-white/30 hover:text-[#f1f1f1]'
                          }`}
                        >
                          {n} Guests
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Date Selection */}
                <div>
                  <div className="flex items-baseline justify-between mb-3 border-b border-white/10 pb-2">
                    <label htmlFor="dining-date" className="text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light">
                      Reservation Date
                    </label>
                    <span className="text-xs text-[#8a857e] font-body">
                      Bookings available up to 30 days ahead
                    </span>
                  </div>

                  <input
                    id="dining-date"
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#1c1b1a] border border-white/15 px-4 py-3.5 text-[#f1f1f1] font-body text-sm focus:border-white/60 focus:outline-none transition-colors"
                  />
                </div>

                {/* 3. Curated Service Sessions (No clumsy select dropdowns) */}
                <div>
                  <div className="flex items-baseline justify-between mb-4 border-b border-white/10 pb-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light">
                      Service Session & Seating Time
                    </label>
                    <span className="text-xs text-[#8a857e] font-body">
                      {selectedTime} Seating
                    </span>
                  </div>

                  {/* Lunch Slots */}
                  <div className="mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-body">
                      Lunch Service (Fri – Sun)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {lunchSlots.map((timeStr) => {
                        const isSelected = selectedTime === timeStr;
                        return (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => setSelectedTime(timeStr)}
                            className={`px-4 py-2.5 text-xs font-body tracking-wider transition-all duration-200 border cursor-pointer ${
                              isSelected
                                ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#141414] font-normal shadow-sm'
                                : 'border-white/10 bg-[#191817] text-[#bdb8b0] hover:border-white/30 hover:text-[#f1f1f1]'
                            }`}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dinner Slots */}
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-2 font-body">
                      Dinner Service (Tue – Sun)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dinnerSlots.map((timeStr) => {
                        const isSelected = selectedTime === timeStr;
                        return (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => setSelectedTime(timeStr)}
                            className={`px-4 py-2.5 text-xs font-body tracking-wider transition-all duration-200 border cursor-pointer ${
                              isSelected
                                ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#141414] font-normal shadow-sm'
                                : 'border-white/10 bg-[#191817] text-[#bdb8b0] hover:border-white/30 hover:text-[#f1f1f1]'
                            }`}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Guest Contact Details in Clean Underline / Line Aesthetics */}
                <div className="space-y-6 pt-2">
                  <div>
                    <label
                      htmlFor="guest-name"
                      className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light mb-2"
                    >
                      Primary Guest Full Name <span className="text-white/40">*</span>
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full bg-[#1c1b1a] border border-white/15 px-4 py-3.5 text-[#f1f1f1] font-body text-sm focus:border-white/60 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="guest-phone"
                        className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light mb-2"
                      >
                        Telephone Number
                      </label>
                      <input
                        id="guest-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#1c1b1a] border border-white/15 px-4 py-3.5 text-[#f1f1f1] font-body text-sm focus:border-white/60 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="guest-email"
                        className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        id="guest-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1c1b1a] border border-white/15 px-4 py-3.5 text-[#f1f1f1] font-body text-sm focus:border-white/60 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="guest-notes"
                      className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light mb-2"
                    >
                      Dietary Restrictions or Special Occasions (Optional)
                    </label>
                    <textarea
                      id="guest-notes"
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full bg-[#1c1b1a] border border-white/15 px-4 py-3 text-[#f1f1f1] font-body text-sm focus:border-white/60 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-4 border border-white/20 bg-black/60 text-[#d4cebe] text-xs font-body leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                {/* 5. Signature Action Element (Aligns with Mayot circular button aesthetic) */}
                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-white/10">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-body font-light mb-1">
                      Intimate Dining Guarantee
                    </p>
                    <p className="text-xs text-[#8a857e] font-body max-w-sm leading-relaxed m-0">
                      All reservations default to <span className="text-[#f1f1f1]">Pending</span>. No deposit required. Our dining room team verifies floor arrangements and responds within two hours.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-24 h-24 md:w-28 md:h-28 rounded-full border border-[#f1f1f1] bg-transparent hover:bg-[#f1f1f1] flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer text-[#f1f1f1] shrink-0 p-2 disabled:opacity-50"
                  >
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-body font-light leading-tight text-[#f1f1f1] group-hover:text-[#141414] transition-colors duration-300 text-center select-none">
                      {isSubmitting ? (
                        'Sending...'
                      ) : (
                        <>
                          Request
                          <br />
                          Table
                        </>
                      )}
                    </span>
                    <svg
                      className="w-4 h-4 text-[#f1f1f1] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-all duration-300 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

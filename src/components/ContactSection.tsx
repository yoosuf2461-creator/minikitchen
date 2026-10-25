'use client';

import React, { useState, useEffect } from 'react';
import restaurantData from '../../data/restaurant.json';
import { RestaurantInfo } from '@/lib/types';

export default function ContactSection() {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(
    restaurantData.restaurantInfo as RestaurantInfo
  );
  const [currentDayName, setCurrentDayName] = useState<string>('');

  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    setCurrentDayName(days[now.getDay()]);

    // Fetch live hours and details from database
    fetch('/api/restaurant')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hours) {
          setRestaurantInfo(data);
        }
      })
      .catch((err) => console.warn('Could not refresh restaurant info:', err));
  }, []);

  const todaySchedule = restaurantInfo.hours.find((h) => h.day === currentDayName);

  return (
    <section
      id="contact"
      className="relative w-full bg-[#141414] text-[#f1f1f1] py-24 md:py-36 px-[7vw] border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Location, Arrival & Narrative */}
          <div className="reveal-on-scroll lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Eyebrow */}
              <p className="text-xs uppercase tracking-[0.25em] text-[#bdb8b0] font-body font-light mb-4">
                Location & Arrival • Colombo
              </p>

              {/* Display Headline */}
              <h2 className="font-disp text-4xl sm:text-6xl md:text-7xl text-[#f1f1f1] tracking-tight leading-none mb-6">
                <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">H</span>ours & Location
              </h2>

              {/* Narrative */}
              <p className="text-sm md:text-base text-[#bdb8b0] font-body font-light leading-relaxed mb-8 max-w-md">
                Located along Galle Road in Kollupitiya, MiniKitchen offers an unhurried culinary sanctuary between the city avenues and the coastal breeze.
              </p>

              {/* Physical Location Details */}
              <div className="border-t border-white/10 pt-6 mb-8 space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1 font-body">
                    Dining Room Address
                  </span>
                  <p className="font-disp text-xl sm:text-2xl text-[#f1f1f1] tracking-wide m-0">
                    {restaurantInfo.address}
                  </p>
                  <p className="text-xs text-[#bdb8b0] font-body font-light mt-0.5">
                    {restaurantInfo.city}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1 font-body">
                      Telephone
                    </span>
                    <a
                      href={`tel:${restaurantInfo.phone}`}
                      className="text-xs sm:text-sm text-[#f1f1f1] hover:text-white font-body transition-colors"
                    >
                      {restaurantInfo.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-1 font-body">
                      Concierge Email
                    </span>
                    <a
                      href={`mailto:${restaurantInfo.email}`}
                      className="text-xs sm:text-sm text-[#f1f1f1] hover:text-white font-body transition-colors"
                    >
                      {restaurantInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Arrival Guidelines */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-[#d4cebe] font-body uppercase tracking-wider shrink-0 mt-0.5">
                    Valet
                  </span>
                  <p className="text-xs text-[#8a857e] font-body font-light m-0 leading-relaxed">
                    Complimentary valet parking available at our private porte-cochère on Galle Road.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-[#d4cebe] font-body uppercase tracking-wider shrink-0 mt-0.5">
                    Attire
                  </span>
                  <p className="text-xs text-[#8a857e] font-body font-light m-0 leading-relaxed">
                    Smart casual or evening attire is welcomed. Athletic wear is politely discouraged.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Reservation Reminder */}
            <div className="border-t border-white/10 pt-8 mt-10">
              <a
                href="#reservation"
                className="group inline-flex items-center gap-3 text-xs uppercase tracking-widest text-[#f1f1f1] hover:text-white font-body"
              >
                <span className="border-b border-white/30 group-hover:border-white pb-0.5 transition-colors">
                  Reserve a Table for Tonight
                </span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>

          {/* Right Column: Weekly Dining Timetable & Ambience Visual */}
          <div className="reveal-on-scroll delay-2 lg:col-span-7 space-y-10">
            
            {/* Live Today Schedule Header (Strictly NO Green or Red Pills) */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8a857e] block mb-0.5 font-body">
                  Service Schedule
                </span>
                <h3 className="font-disp text-2xl sm:text-3xl text-[#f1f1f1] tracking-wide m-0">
                  Weekly Dining Hours
                </h3>
              </div>

              {/* Understated Today Badge */}
              {currentDayName && (
                <div className="border border-white/20 px-3 py-1 bg-black/40 self-start sm:self-auto">
                  <span className="text-[10px] uppercase tracking-widest font-body text-[#d4cebe] font-light">
                    Today ({currentDayName}): {todaySchedule?.isClosed ? 'Kitchen Rest' : `${todaySchedule?.open} – ${todaySchedule?.close}`}
                  </span>
                </div>
              )}
            </div>

            {/* 7-Day Timetable Grid in Clean Typographic Lines */}
            <div className="space-y-1">
              {restaurantInfo.hours.map((item) => {
                const isToday = item.day === currentDayName;

                return (
                  <div
                    key={item.day}
                    className={`flex items-baseline justify-between py-3.5 px-4 transition-colors ${
                      isToday
                        ? 'bg-[#1c1b1a] border-l-2 border-[#f1f1f1]'
                        : 'border-b border-white/5 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className={`font-disp text-base sm:text-lg tracking-wide ${
                          isToday ? 'text-[#f1f1f1]' : 'text-[#bdb8b0]'
                        }`}
                      >
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] uppercase tracking-widest text-[#8a857e] font-body">
                          • Today
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {item.isClosed ? (
                        <span className="text-xs uppercase tracking-wider text-[#6b6760] font-body italic">
                          Kitchen Rest (Closed)
                        </span>
                      ) : (
                        <span
                          className={`text-xs sm:text-sm font-body tracking-wider ${
                            isToday ? 'text-[#f1f1f1] font-normal' : 'text-[#8a857e] font-light'
                          }`}
                        >
                          {item.open} — {item.close}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Architectural Ambience Visual */}
            <div className="relative w-full aspect-[21/9] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/images/thumb.jpg"
                alt="MiniKitchen dining room chandelier and table setting"
                className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-black/25 pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-[#bdb8b0] font-body font-light">
                <span>The Dining Quarter • Oceanfront kollupitiya</span>
                <span>Seating by Reservation</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

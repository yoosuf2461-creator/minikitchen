'use client';

import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/types';

import initialData from '../../data/restaurant.json';

export default function MenuSection() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialData.menu as MenuItem[]);
  const [loading, setLoading] = useState(false);

  // Fetch live menu items from API for real-time updates
  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMenuItems(data);
        } else if (data && data.menu) {
          setMenuItems(data.menu);
        }
      })
      .catch((err) => {
        console.error('Failed to load menu items:', err);
      });
  }, []);

  // Filter items by category
  const starters = menuItems.filter((i) => i.category === 'starters');
  const mains = menuItems.filter((i) => i.category === 'mains');
  const desserts = menuItems.filter((i) => i.category === 'desserts');
  const drinks = menuItems.filter((i) => i.category === 'drinks');

  // Aspect ratio array to achieve the Mayot signature staggered rhythm per row
  const getAspectRatioClass = (index: number) => {
    const mod = index % 3;
    if (mod === 0) return 'aspect-[126/171]'; // ~3:4 portrait
    if (mod === 1) return 'aspect-[125/129]'; // ~1:1 compact square
    return 'aspect-[124/200]';                // ~3:5 tall vertical
  };

  const renderDishCard = (dish: MenuItem, index: number) => {
    const aspectClass = getAspectRatioClass(index);
    const isAvailable = dish.available;
    const staggerDelay = `delay-${(index % 3) + 1}`;

    return (
      <article
        key={dish.id}
        className={`reveal-on-scroll ${staggerDelay} flex flex-col justify-between group transition-all duration-300`}
      >
        <div>
          {/* Dish Image */}
          <div
            className={`relative w-full ${aspectClass} overflow-hidden rounded-none border border-white/10 group-hover:border-white/25 bg-[#1a1918] transition-all duration-500 shadow-xl`}
          >
            {dish.imageUrl ? (
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                  isAvailable
                    ? 'group-hover:scale-105 filter brightness-[0.92] contrast-[1.04]'
                    : 'grayscale-[50%] opacity-65'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-white/30">
                {dish.imageEmoji || '🍽️'}
              </div>
            )}
            
            {/* Subtle dark tint */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* Sold out subtle watermark over image (No garish pills) */}
            {!isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] pointer-events-none">
                <span className="font-disp tracking-widest text-xs uppercase text-[#bdb8b0] border border-white/20 px-3 py-1 bg-black/40">
                  Sold Out for Tonight
                </span>
              </div>
            )}
          </div>

          {/* Dish Information */}
          <div className="mt-4 flex flex-col gap-1.5">
            {/* Title & Price Row */}
            <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
              <h3 className="font-disp text-xl sm:text-2xl text-[#f1f1f1] group-hover:text-white transition-colors duration-300 font-normal tracking-tight m-0 leading-snug">
                {dish.name}
              </h3>
              
              {/* Price in LKR (Strictly no red/green pills for availability) */}
              <div className="text-right whitespace-nowrap">
                {isAvailable ? (
                  <span className="font-body font-light text-sm sm:text-base text-[#f1f1f1] tracking-wide">
                    LKR {dish.price.toLocaleString()}
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="line-through text-[#6b6760] font-body text-xs sm:text-sm">
                      LKR {dish.price.toLocaleString()}
                    </span>
                    <span className="text-[#a09a90] text-[10px] uppercase tracking-widest italic font-light">
                      Sold out
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#bdb8b0] font-body font-light leading-relaxed m-0 mt-1 max-w-sm">
              {dish.description}
            </p>

            {/* Dietary notes in understated italic text (no plastic badges) */}
            {dish.dietary && dish.dietary.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {dish.dietary.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-[#8a857e] tracking-wider uppercase font-light"
                  >
                    • {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </article>
    );
  };

  return (
    <section id="menu" className="relative w-full bg-[#141414] text-[#f1f1f1] py-20 md:py-32 px-[7vw] border-t border-white/10">
      
      {/* Intro Header Section */}
      <div className="reveal-on-scroll max-w-4xl mx-auto text-center mb-16 md:mb-24">
        {/* Subtitle */}
        <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-[#bdb8b0] font-body font-light mb-4">
          Artisanal Gastronomy • Seasonal Harvest
        </p>
        
        {/* Main Section Title */}
        <h2 className="font-disp text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#f1f1f1] tracking-tight leading-none mb-6">
          <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">S</span>easonal Menu
        </h2>

        {/* Evocative, grounded editorial note */}
        <p className="text-xs sm:text-sm md:text-base text-[#bdb8b0] font-body font-light max-w-2xl mx-auto leading-relaxed">
          Crafted in quiet rhythm with seasonal harvests and our wood-fired hearth. Each dish reflects an unhurried exploration of heirloom produce, local coastal catch, and open-flame cooking.
        </p>
      </div>

      {/* Wide Cinematic Culinary Plating Visual */}
      <div className="reveal-on-scroll delay-2 relative w-full aspect-[21/9] md:aspect-[32/10] overflow-hidden rounded-none border border-white/10 mb-20 md:mb-28 shadow-2xl group">
        <img
          src="/images/hero.jpg"
          alt="Culinary plating at MiniKitchen"
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] group-hover:scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute bottom-4 left-6 md:bottom-8 md:left-10 text-xs md:text-sm uppercase tracking-widest text-[#bdb8b0] font-body font-light">
          Handcrafted in our Open Kitchen • Fresh Daily
        </div>
      </div>

      {/* Category 1: First Courses */}
      <div className="mb-20 md:mb-32">
        <h2 className="reveal-on-scroll font-disp text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#f1f1f1] tracking-tight mb-8 md:mb-12 border-b border-white/10 pb-4">
          <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">F</span>irst courses
        </h2>
        
        {loading ? (
          <div className="py-12 text-center text-[#bdb8b0] font-body font-light tracking-widest text-sm uppercase">
            Loading seasonal harvest...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start">
            {starters.map((dish, idx) => renderDishCard(dish, idx))}
          </div>
        )}
      </div>

      {/* Category 2: Main Courses */}
      <div className="mb-20 md:mb-32">
        <h2 className="reveal-on-scroll font-disp text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#f1f1f1] tracking-tight mb-8 md:mb-12 border-b border-white/10 pb-4">
          <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">M</span>ain courses
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start">
          {mains.map((dish, idx) => renderDishCard(dish, idx))}
        </div>
      </div>

      {/* Category 3: Desserts */}
      <div className="mb-20 md:mb-32">
        <h2 className="reveal-on-scroll font-disp text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#f1f1f1] tracking-tight mb-8 md:mb-12 border-b border-white/10 pb-4">
          <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">D</span>esserts
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start">
          {desserts.map((dish, idx) => renderDishCard(dish, idx))}
        </div>
      </div>

      {/* Category 4: Craft Beverages */}
      <div>
        <h2 className="reveal-on-scroll font-disp text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#f1f1f1] tracking-tight mb-8 md:mb-12 border-b border-white/10 pb-4">
          <span className="font-sw text-[1.25em] mr-1 inline-block -translate-y-1">C</span>raft beverages
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start">
          {drinks.map((dish, idx) => renderDishCard(dish, idx))}
        </div>
      </div>
        
      {/* Editorial Menu Footer / Direct Link to Reservation Form */}
      <div className="reveal-on-scroll mt-24 pt-16 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#bdb8b0] font-body font-light mb-2">
            Intimate Gastronomy • Open Hearth
          </p>
          <h3 className="font-disp text-3xl sm:text-4xl md:text-5xl text-[#f1f1f1] font-normal tracking-tight m-0">
            Reserve your table for an evening of seasonal dining.
          </h3>
        </div>

        <a
          href="#reservation"
          aria-label="Proceed to Table Reservation"
          className="group w-20 h-20 md:w-24 md:h-24 rounded-full border border-[#f1f1f1] bg-transparent hover:bg-[#f1f1f1] flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer text-[#f1f1f1] shrink-0 p-2 hover:scale-105"
        >
          <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-body font-light leading-tight text-[#f1f1f1] group-hover:text-[#141414] transition-colors duration-300 text-center select-none">
            Reserve
            <br />
            Table
          </span>
          <svg
            className="w-3.5 h-3.5 text-[#f1f1f1] group-hover:text-[#141414] group-hover:translate-y-0.5 transition-all duration-300 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>

    </section>
  );
}

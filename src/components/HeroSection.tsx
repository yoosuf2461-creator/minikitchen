'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="relative w-full h-[100dvh] md:h-screen bg-[#141414] text-[#f1f1f1] overflow-hidden select-none">

      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 z-50 h-16 md:h-20 flex items-center justify-between px-6 md:px-[7vw] pointer-events-auto">
        {/* Hamburger / Close morphing button: Pushed to far right on mobile via ml-auto, left on desktop via md:ml-0 */}
        <button
          className="ml-auto md:ml-0 relative z-50 w-8 h-8 flex flex-col justify-center gap-[5px] cursor-pointer focus:outline-none p-0 bg-transparent border-0"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mnu"
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
        >
          <span
            className={`w-7 h-[1.5px] bg-[#f1f1f1] transition-all duration-300 transform origin-center ${
              menuOpen ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`w-7 h-[1.5px] bg-[#f1f1f1] transition-all duration-200 ${
              menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`w-7 h-[1.5px] bg-[#f1f1f1] transition-all duration-300 transform origin-center ${
              menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </button>

        {/* Center Logo */}
        <Link
          className="absolute left-1/2 -translate-x-1/2 flex items-baseline group text-decoration-none"
          href="#top"
          aria-label="MiniKitchen"
        >
          <span className="font-sw text-3xl md:text-4xl text-[#f1f1f1] leading-none -mr-1">
            M
          </span>
          <span className="font-disp font-normal not-italic text-lg md:text-xl text-[#f1f1f1] tracking-wider">
            iniKitchen
          </span>
        </Link>
      </header>

      {/* Fullscreen Navigation Drawer */}
      <nav
        id="mnu"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-40 bg-[#141414] flex flex-col justify-between pt-20 pb-8 px-6 sm:px-10 md:px-[8vw] transition-all duration-300 ease-in-out overflow-y-auto ${
          menuOpen
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Navigation Links */}
        <div className="my-auto py-4">
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5 sm:gap-4 max-w-4xl">
            <li>
              <Link
                href="#top"
                onClick={() => setMenuOpen(false)}
                className="inline-block font-disp text-[clamp(32px,7.5vw,72px)] text-[#f1f1f1] hover:text-[#bdb8b0] hover:translate-x-2 transition-all duration-300 leading-tight"
              >
                Main
              </Link>
            </li>
            <li>
              <Link
                href="#menu"
                onClick={() => setMenuOpen(false)}
                className="inline-block font-disp text-[clamp(32px,7.5vw,72px)] text-[#f1f1f1] hover:text-[#bdb8b0] hover:translate-x-2 transition-all duration-300 leading-tight"
              >
                Seasonal Menu
              </Link>
            </li>
            <li>
              <Link
                href="#reservation"
                onClick={() => setMenuOpen(false)}
                className="inline-block font-disp text-[clamp(32px,7.5vw,72px)] text-[#f1f1f1] hover:text-[#bdb8b0] hover:translate-x-2 transition-all duration-300 leading-tight"
              >
                Reservations
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="inline-block font-disp text-[clamp(32px,7.5vw,72px)] text-[#f1f1f1] hover:text-[#bdb8b0] hover:translate-x-2 transition-all duration-300 leading-tight"
              >
                Hours & Location
              </Link>
            </li>
            <li className="pt-2">
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="inline-block group font-disp text-[clamp(18px,4.5vw,34px)] text-[#bdb8b0] hover:text-[#f1f1f1] hover:translate-x-2 transition-all duration-300"
              >
                Admin Portal →
                <span className="block text-[10px] tracking-widest uppercase text-[#8a857e] font-sans font-light mt-0.5">
                  Evaluation & Testing Access
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Bottom Address Info: In-flow footer preventing any overlap */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-xs md:text-sm text-[#bdb8b0] border-t border-white/10 pt-4">
          <p className="m-0 max-w-sm text-[#bdb8b0]/90 leading-relaxed text-[11px] sm:text-xs">
            142 Galle Road, Kollupitiya, Colombo 03 • Artisanal Seasonal Dining.
          </p>
          <small className="text-[#bdb8b0]/60 hidden sm:block">Dinner from 18:00 • Lunch Fri–Sun from 12:00</small>
        </div>
      </nav>

      {/* Main Hero Stage - Mobile Layout matching reference inspiration */}
      <section id="top" className="relative w-full h-full">

        {/* Fine-Dining Photo:
            On mobile: Full bleed across the entire screen, chandelier centered at top (object-position: 42% 0).
            On desktop: Spans from left ~43.5% to right edge, below header.
        */}
        <div className="absolute inset-0 md:inset-auto md:left-[43.5%] md:right-0 md:top-[9%] md:bottom-[6%] z-0 overflow-hidden group">
          <img
            src="/images/hero.jpg"
            alt="MiniKitchen dining room"
            className="w-full h-full object-cover object-[42%_0%] md:object-center filter brightness-[0.88] contrast-[1.05] transition-transform duration-1000 ease-out group-hover:scale-105"
          />
          {/* Subtle dark tint */}
          <div className="absolute inset-0 bg-black/35 md:bg-black/20 pointer-events-none" />
        </div>

        {/* Left Column (Desktop): Chandelier Thumbnail & Caption - flex column guarantees 0 overlap */}
        <div className="hidden md:flex flex-col items-start gap-3.5 absolute left-[7vw] top-[9%] w-[clamp(90px,14.5vw,140px)] z-10 reveal-on-scroll is-revealed group">
          <div className="w-full aspect-[95/100] overflow-hidden">
            <img
              src="/images/thumb.jpg"
              alt="Chandelier glowing in MiniKitchen"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          </div>
          <p className="m-0 text-[clamp(11px,1.05vw,13.5px)] text-[#bdb8b0] font-body font-light leading-snug tracking-wide text-left max-w-[clamp(140px,18vw,200px)]">
            Artisanal seasonal dining & handcrafted moments by MiniKitchen, Colombo.
          </p>
        </div>

        {/* Mobile Hero Content Block: Dedicated mobile layout with zero overlap */}
        <div className="absolute left-6 right-6 top-[34%] z-20 flex flex-col items-start md:hidden pointer-events-none">
          <h1 className="m-0 font-disp text-[clamp(52px,13.5vw,78px)] text-[#f1f1f1] leading-[0.92] tracking-normal flex flex-wrap items-baseline reveal-on-scroll is-revealed delay-2">
            <span className="w-full">Artisanal</span>
            <span className="relative inline-flex items-baseline">
              <b className="font-sw font-normal text-[1.32em] text-[#f1f1f1] leading-none mr-[0.08em] translate-y-[0.04em]">
                D
              </b>
              <span className="font-disp tracking-normal">
                ining
              </span>
            </span>
          </h1>

          <p className="mt-3.5 sm:mt-4 self-end max-w-[210px] sm:max-w-[240px] text-[12px] sm:text-[13px] text-[#bdb8b0] font-body font-light leading-snug tracking-wide text-left m-0 reveal-on-scroll is-revealed delay-1">
            Artisanal seasonal dining & handcrafted moments by MiniKitchen, Colombo.
          </p>
        </div>

        {/* Desktop Headline: Stepped side-by-side layout */}
        <h1 className="hidden md:flex absolute left-[7vw] top-[46%] z-20 m-0 font-disp text-[clamp(52px,9.8vw,138px)] text-[#f1f1f1] leading-none tracking-normal whitespace-nowrap items-baseline pointer-events-none reveal-on-scroll is-revealed delay-2">
          <span>Artisanal</span>
          <span className="relative inline-flex items-baseline ml-[0.38em] translate-y-[0.26em]">
            <b className="font-sw font-normal text-[1.32em] text-[#f1f1f1] leading-none mr-[0.12em] translate-y-[0.05em]">
              D
            </b>
            <span className="font-disp tracking-normal">
              ining
            </span>
          </span>
        </h1>

        {/* Circular Button: Reserve Table
            On mobile: Centered horizontally at the bottom, matching inspiration layout.
            On desktop: Positioned at bottom left (left-[7vw]).
        */}
        <a
          href="#reservation"
          aria-label="Reserve a table"
          className="group absolute left-1/2 -translate-x-1/2 md:left-[7vw] md:translate-x-0 bottom-[4%] md:bottom-[5%] w-[clamp(68px,8.5vw,84px)] aspect-square rounded-full border border-white/70 md:border-[#f1f1f1] bg-transparent hover:bg-[#f1f1f1] hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 z-20 transition-all duration-400 cursor-pointer text-center p-2 ambient-float"
        >
          <span className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wider font-body font-light leading-tight text-[#f1f1f1] group-hover:text-[#141414] transition-colors duration-300 select-none">
            Reserve
            <br />
            Table
          </span>
          <svg
            className="w-3 h-3 text-[#f1f1f1] group-hover:text-[#141414] group-hover:translate-y-0.5 transition-all duration-300 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>

      </section>

    </div>
  );
}

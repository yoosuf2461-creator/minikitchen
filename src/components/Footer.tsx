'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined' && (window as any).lenis) {
      (window as any).lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#100f0e] text-[#f1f1f1] border-t border-white/10 py-16 px-[7vw] font-body reveal-on-scroll">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Top Row: Brand & Minimal Navigation */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-10 border-b border-white/5">
          {/* Brand & Subtitle */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-disp text-3xl sm:text-4xl text-[#f1f1f1] tracking-wide">
                MiniKitchen
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8a857e] font-light">
                Since 2018
              </span>
            </div>
            <p className="text-xs text-[#8a857e] font-light mt-1.5 max-w-sm leading-relaxed">
              Artisanal seasonal dining & open-flame hearth gastronomy. 142 Galle Road, Kollupitiya, Colombo 03.
            </p>
          </div>

          {/* Minimalist Editorial Links */}
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs uppercase tracking-widest text-[#bdb8b0] font-light">
            <a
              href="#top"
              className="hover:text-white transition-colors hover:-translate-y-0.5 inline-block duration-200"
            >
              Main
            </a>
            <a
              href="#menu"
              className="hover:text-white transition-colors hover:-translate-y-0.5 inline-block duration-200"
            >
              Seasonal Menu
            </a>
            <a
              href="#reservation"
              className="hover:text-white transition-colors hover:-translate-y-0.5 inline-block duration-200"
            >
              Reservations
            </a>
            <a
              href="#contact"
              className="hover:text-white transition-colors hover:-translate-y-0.5 inline-block duration-200"
            >
              Location
            </a>
            <Link
              href="/admin/login"
              className="text-[#8a857e] hover:text-[#f1f1f1] transition-colors border-b border-white/10 pb-0.5 hover:-translate-y-0.5 inline-block duration-200"
            >
              Staff Portal →
            </Link>
          </nav>
        </div>

        {/* Bottom Row: Quiet Credits & Back to Top */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6b6760] font-light">
          <p className="m-0">
            © 2026 MiniKitchen Dining Room. Handcrafted in rhythm with coastal harvests.
          </p>

          <button
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#8a857e] hover:text-[#f1f1f1] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <span>Back to top</span>
            <span className="group-hover:-translate-y-1 transition-transform duration-300">↑</span>
          </button>
        </div>

      </div>
    </footer>
  );
}

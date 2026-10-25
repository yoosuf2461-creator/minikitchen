'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Successful login
      router.push('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Unable to sign in. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121110] text-[#f1f1f1] flex flex-col justify-between px-[7vw] py-12 font-body selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-disp text-2xl text-[#f1f1f1] tracking-wide">
            MiniKitchen
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#8a857e]">
            Management Portal
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-[#bdb8b0] hover:text-[#f1f1f1] transition-colors"
        >
          ← Return to Website
        </Link>
      </header>

      {/* Main Login Form Container */}
      <main className="max-w-md w-full mx-auto my-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8a857e] font-light mb-2">
            Restricted Staff Access
          </p>
          <h1 className="font-disp text-4xl sm:text-5xl text-[#f1f1f1] tracking-tight m-0">
            Manager Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#bdb8b0] font-light mt-2 leading-relaxed">
            Access table reservations, live seasonal menu controls, and dining room availability.
          </p>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2"
            >
              Manager Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#1a1918] border border-white/15 px-4 py-3.5 text-[#f1f1f1] text-sm focus:border-white/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-[0.2em] text-[#bdb8b0] font-light mb-2"
            >
              Security Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1a1918] border border-white/15 px-4 py-3.5 pr-12 text-[#f1f1f1] text-sm focus:border-white/60 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bdb8b0] hover:text-[#f1f1f1] transition-colors p-1.5 cursor-pointer bg-transparent border-0"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 border border-white/20 bg-black/60 text-[#d4cebe] text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 border border-[#f1f1f1] bg-[#f1f1f1] hover:bg-transparent text-[#121110] hover:text-[#f1f1f1] text-xs uppercase tracking-widest transition-all duration-300 font-normal cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#6b6760] font-light gap-2">
        <span>MiniKitchen Colombo Management System • Session Protected</span>
        <span>Colombo, Sri Lanka</span>
      </footer>
    </div>
  );
}

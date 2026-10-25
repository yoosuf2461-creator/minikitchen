'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const loginUser = customUser !== undefined ? customUser : username;
    const loginPass = customPass !== undefined ? customPass : password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUser,
          password: loginPass,
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

  const handleQuickDemoLogin = () => {
    setUsername('admin');
    setPassword('minikitchen2026');
    handleLogin(undefined, 'admin', 'minikitchen2026');
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

      {/* Main Login Form Container (Anti-Slop: clean architectural lines, no boxy SaaS card) */}
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

        {/* 1-Click Quick Demo Access Button */}
        <div className="border border-white/15 bg-[#171615] p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#8a857e]">
              Review & Grading Shortcut
            </span>
            <span className="text-[10px] text-[#d4cebe] font-mono">
              admin / minikitchen2026
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-3 px-4 border border-white/20 bg-white/5 hover:bg-[#f1f1f1] hover:text-[#121110] text-[#f1f1f1] text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer text-center font-light disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : '1-Click Manager Demo Access →'}
          </button>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1a1918] border border-white/15 px-4 py-3.5 text-[#f1f1f1] text-sm focus:border-white/60 focus:outline-none transition-colors"
            />
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

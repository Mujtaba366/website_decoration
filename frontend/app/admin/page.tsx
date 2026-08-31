'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateAdmin, getAdminSession } from '@/lib/admin-auth';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const session = getAdminSession();
    if (session) {
      router.push('/admin/dashboard');
    }
    setIsLoading(false);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = await authenticateAdmin({ username, password });
      if (session) {
        router.push('/admin/dashboard');
      } else {
        setErrorMessage('Incorrect username or password. Try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b4332] mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#faf9f6]">
      {/* left: ledger panel */}
      <div className="relative hidden flex-[1.1] flex-col justify-between overflow-hidden bg-[#1b4332] px-12 py-14 text-[#faf9f6] lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent, transparent 38px, rgba(250,249,246,0.06) 38px, rgba(250,249,246,0.06) 39px)',
          }}
        />

        <div className="relative z-10">
          <div className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-[#74c69d]">
            Admin console
          </div>
          <h1 className="max-w-[11ch] font-serif text-[2.35rem] font-semibold leading-tight">
            Every entry, accounted for.
          </h1>
          <p className="mt-4 max-w-[30ch] text-[0.95rem] leading-relaxed text-[#faf9f6]/65">
            Sign in to manage accounts, review activity, and keep the books balanced.
          </p>
        </div>
      </div>

      {/* right: login form */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-8">
        <div className="w-full max-w-[360px]">
          <div className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[#6b8577]">
            Restricted access
          </div>
          <h2 className="mb-1.5 font-serif text-[1.7rem] font-semibold text-[#1b4332]">
            Sign in
          </h2>
          <p className="mb-9 text-[0.9rem] text-[#6b8577]">
            Enter your admin credentials to continue.
          </p>

          {errorMessage && (
            <div className="mb-5 rounded border border-[#f0d3ce] bg-[#fbeeec] px-3 py-2.5 text-[0.82rem] text-[#a8442f]">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="username" className="mb-1.5 block text-[0.82rem] font-medium text-[#1b4332]">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_username"
                required
                className="w-full rounded border border-[#dbe4de] bg-[#faf9f6] px-3.5 py-2.5 text-[0.95rem] text-[#14261e] placeholder:text-[#a9b7ae] focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#2d6a4f]/12"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="mb-1.5 block text-[0.82rem] font-medium text-[#1b4332]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded border border-[#dbe4de] bg-[#faf9f6] px-3.5 py-2.5 text-[0.95rem] text-[#14261e] placeholder:text-[#a9b7ae] focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#2d6a4f]/12"
              />
            </div>

            <div className="mb-6">
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-[#1b4332] py-3 text-[0.95rem] font-medium text-[#faf9f6] transition-colors hover:bg-[#2d6a4f] disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[0.82rem] text-[#6b8577]">
            Access is logged and limited to authorised administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
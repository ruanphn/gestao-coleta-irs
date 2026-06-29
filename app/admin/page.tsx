'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Logo from '@/components/ui/Logo';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple MVP auth — password from env
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    setTimeout(() => {
      if (password === adminPassword) {
        sessionStorage.setItem('admin_authenticated', 'true');
        router.push('/admin/dashboard');
      } else {
        setError('Senha incorreta. Tente novamente.');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 flex items-center justify-center p-4">
      {/* Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-green-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 mb-4">
            <Logo light showText={true} />
          </div>
          <h1 className="text-xl font-bold text-white mt-2">Painel Administrativo</h1>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Entrar no sistema</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Senha de acesso
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                'Acessar painel'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao portal do cliente
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

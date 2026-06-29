import type { Metadata } from 'next';
import SolicitacaoForm from '@/components/portal/SolicitacaoForm';

import Logo from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Solicitação de Descarte — Instituto Robótica Sustentável',
  description:
    'Solicite o descarte ambientalmente correto de seus resíduos eletrônicos com o Instituto Robótica Sustentável. Preenchimento rápido e gratuito.',
};

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-300 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-teal-400 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start py-8 px-4">
        {/* Header */}
        <header className="w-full max-w-lg mb-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <Logo light showText={true} />
          </div>
          <p className="text-green-200 text-sm mt-1">
            Descarte correto de lixo eletrônico — rápido e gratuito
          </p>

          {/* Info badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['✅ Gratuito', '🌱 Ecologicamente correto', '📋 Lei 12.305/2010'].map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-green-100 text-xs"
              >
                {badge}
              </span>
            ))}
          </div>
        </header>

        {/* Form Card */}
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-green-700 px-8 py-5">
            <h2 className="text-white font-bold text-lg">Solicitação de Descarte</h2>
            <p className="text-green-200 text-sm mt-0.5">
              Preencha os dados abaixo. Nossa equipe entrará em contato em breve.
            </p>
          </div>

          {/* Form body */}
          <div className="px-6 py-8 sm:px-8">
            <SolicitacaoForm />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-green-400 text-xs">
          <p>Instituto Robótica Sustentável · Gestão Responsável de Resíduos Eletrônicos</p>
          <p className="mt-1">Em conformidade com a PNRS — Lei nº 12.305/2010</p>
        </footer>
      </div>
    </main>
  );
}

'use client';

import { SolicitacaoComCliente, StatusSolicitacao } from '@/lib/types';

interface StatsBarProps {
  solicitacoes: SolicitacaoComCliente[];
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; icon: string; color: string; bg: string }> = {
  pendente:   { label: 'Pendentes',   icon: '🕐', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  em_analise: { label: 'Em Análise',  icon: '🔍', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  agendado:   { label: 'Agendados',   icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  concluido:  { label: 'Concluídos',  icon: '✅', color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
};

export default function StatsBar({ solicitacoes, searchQuery, setSearchQuery }: StatsBarProps) {
  const counts = {
    pendente:   solicitacoes.filter((s) => s.status === 'pendente').length,
    em_analise: solicitacoes.filter((s) => s.status === 'em_analise').length,
    agendado:   solicitacoes.filter((s) => s.status === 'agendado').length,
    concluido:  solicitacoes.filter((s) => s.status === 'concluido').length,
  };

  const pf = solicitacoes.filter((s) => s.cliente?.tipo === 'PF').length;
  const pj = solicitacoes.filter((s) => s.cliente?.tipo === 'PJ').length;

  return (
    <div className="space-y-4">
      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(STATUS_CONFIG) as StatusSolicitacao[]).map((status) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className={`rounded-xl border p-4 ${cfg.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cfg.icon}</span>
                <span className={`text-3xl font-bold ${cfg.color}`}>{counts[status]}</span>
              </div>
              <p className={`text-sm font-medium mt-2 ${cfg.color}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Type breakdown & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">
            Total: <strong className="text-gray-800">{solicitacoes.length}</strong>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Pessoa Física: <strong className="text-gray-800">{pf}</strong></span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <span>Pessoa Jurídica: <strong className="text-gray-800">{pj}</strong></span>
          </span>
        </div>

        {setSearchQuery && (
          <div className="relative w-full md:max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF/CNPJ..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}

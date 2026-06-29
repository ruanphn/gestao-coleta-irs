'use client';

import { SolicitacaoComCliente, StatusSolicitacao } from '@/lib/types';

interface StatsBarProps {
  solicitacoes: SolicitacaoComCliente[];
}

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; icon: string; color: string; bg: string }> = {
  pendente:   { label: 'Pendentes',   icon: '🕐', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  em_analise: { label: 'Em Análise',  icon: '🔍', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  agendado:   { label: 'Agendados',   icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  concluido:  { label: 'Concluídos',  icon: '✅', color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
};

export default function StatsBar({ solicitacoes }: StatsBarProps) {
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

      {/* Type breakdown */}
      <div className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
        <span className="text-sm text-gray-500">
          Total: <strong className="text-gray-800">{solicitacoes.length}</strong>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">
          👤 Pessoa Física: <strong className="text-gray-800">{pf}</strong>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">
          🏢 Pessoa Jurídica: <strong className="text-gray-800">{pj}</strong>
        </span>
      </div>
    </div>
  );
}

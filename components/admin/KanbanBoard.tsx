'use client';

import { SolicitacaoComCliente, StatusSolicitacao, PontoColeta, Veiculo } from '@/lib/types';
import SolicitacaoCard from './SolicitacaoCard';

interface KanbanBoardProps {
  solicitacoes: SolicitacaoComCliente[];
  pontosColeta: PontoColeta[];
  veiculos: Veiculo[];
  onUpdate: (updated: SolicitacaoComCliente) => void;
}

const COLUNAS: { status: StatusSolicitacao; label: string; icon: string; color: string; border: string; header: string }[] = [
  {
    status: 'pendente',
    label: 'Pendentes',
    icon: '🕐',
    color: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100 border-amber-200',
  },
  {
    status: 'em_analise',
    label: 'Em Análise',
    icon: '🔍',
    color: 'bg-blue-50',
    border: 'border-blue-200',
    header: 'bg-blue-100 border-blue-200',
  },
  {
    status: 'agendado',
    label: 'Agendados',
    icon: '📅',
    color: 'bg-purple-50',
    border: 'border-purple-200',
    header: 'bg-purple-100 border-purple-200',
  },
  {
    status: 'concluido',
    label: 'Concluídos',
    icon: '✅',
    color: 'bg-green-50',
    border: 'border-green-200',
    header: 'bg-green-100 border-green-200',
  },
];

export default function KanbanBoard({ solicitacoes, pontosColeta, veiculos, onUpdate }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUNAS.map((coluna) => {
        const cards = solicitacoes.filter((s) => s.status === coluna.status);
        return (
          <div key={coluna.status} className={`rounded-2xl border ${coluna.border} ${coluna.color} flex flex-col min-h-[200px]`}>
            {/* Column header */}
            <div className={`px-4 py-3 rounded-t-2xl border-b ${coluna.header} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span>{coluna.icon}</span>
                <span className="font-bold text-gray-700 text-sm">{coluna.label}</span>
              </div>
              <span className="bg-white/70 text-gray-600 font-bold text-xs px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 flex flex-col gap-3 flex-1">
              {cards.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 text-xs text-center py-8">Nenhuma solicitação aqui</p>
                </div>
              ) : (
                cards.map((sol) => (
                  <SolicitacaoCard
                    key={sol.id}
                    solicitacao={sol}
                    pontosColeta={pontosColeta}
                    veiculos={veiculos}
                    onUpdate={onUpdate}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

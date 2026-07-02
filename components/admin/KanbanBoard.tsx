'use client';

import { SolicitacaoComCliente, StatusSolicitacao, PontoColeta, Veiculo } from '@/lib/types';
import SolicitacaoCard from './SolicitacaoCard';

interface KanbanBoardProps {
  solicitacoes: SolicitacaoComCliente[];
  pontosColeta: PontoColeta[];
  veiculos: Veiculo[];
  onUpdate: (updated: SolicitacaoComCliente) => void;
}

interface ColunaConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  header: string;
  filter: (s: SolicitacaoComCliente) => boolean;
}

const COLUNAS: ColunaConfig[] = [
  {
    id: 'pf',
    label: 'Coletas Pessoa Física',
    icon: (
      <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'bg-sky-50/50',
    border: 'border-sky-200',
    header: 'bg-sky-100 border-sky-200',
    filter: (s) => s.cliente?.tipo === 'PF',
  },
  {
    id: 'pendente',
    label: 'Pendentes (PJ)',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100 border-amber-200',
    filter: (s) => s.cliente?.tipo === 'PJ' && s.status === 'pendente',
  },
  {
    id: 'em_analise',
    label: 'Em Análise (PJ)',
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'bg-blue-50',
    border: 'border-blue-200',
    header: 'bg-blue-100 border-blue-200',
    filter: (s) => s.cliente?.tipo === 'PJ' && s.status === 'em_analise',
  },
  {
    id: 'agendado',
    label: 'Agendados (PJ)',
    icon: (
      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-purple-50',
    border: 'border-purple-200',
    header: 'bg-purple-100 border-purple-200',
    filter: (s) => s.cliente?.tipo === 'PJ' && s.status === 'agendado',
  },
  {
    id: 'concluido',
    label: 'Concluídos (PJ)',
    icon: (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-50',
    border: 'border-green-200',
    header: 'bg-green-100 border-green-200',
    filter: (s) => s.cliente?.tipo === 'PJ' && s.status === 'concluido',
  },
];

export default function KanbanBoard({ solicitacoes, pontosColeta, veiculos, onUpdate }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {COLUNAS.map((coluna) => {
        const cards = solicitacoes.filter(coluna.filter);
        return (
          <div key={coluna.id} className={`rounded-2xl border ${coluna.border} ${coluna.color} flex flex-col min-h-[200px]`}>
            {/* Column header */}
            <div className={`px-4 py-3 rounded-t-2xl border-b ${coluna.header} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span>{coluna.icon}</span>
                <span className="font-bold text-gray-700 text-sm whitespace-nowrap">{coluna.label}</span>
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

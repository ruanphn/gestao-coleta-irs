'use client';

import { useState } from 'react';
import { SolicitacaoComCliente, StatusSolicitacao, PontoColeta, Veiculo, TurnoAgendamento } from '@/lib/types';
import ModalPF from './ModalPF';
import ModalPJ from './ModalPJ';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SolicitacaoCardProps {
  solicitacao: SolicitacaoComCliente;
  pontosColeta: PontoColeta[];
  veiculos: Veiculo[];
  onUpdate: (updated: SolicitacaoComCliente) => void;
}

const STATUS_OPTIONS: { value: StatusSolicitacao; label: string }[] = [
  { value: 'pendente',   label: '🕐 Pendente' },
  { value: 'em_analise', label: '🔍 Em Análise' },
  { value: 'agendado',   label: '📅 Agendado' },
  { value: 'concluido',  label: '✅ Concluído' },
];

const STATUS_COLORS: Record<StatusSolicitacao, string> = {
  pendente:   'bg-amber-100 text-amber-700 border-amber-200',
  em_analise: 'bg-blue-100 text-blue-700 border-blue-200',
  agendado:   'bg-purple-100 text-purple-700 border-purple-200',
  concluido:  'bg-green-100 text-green-700 border-green-200',
};

export default function SolicitacaoCard({
  solicitacao,
  pontosColeta,
  veiculos,
  onUpdate,
}: SolicitacaoCardProps) {
  const [showModalPF, setShowModalPF] = useState(false);
  const [showModalPJ, setShowModalPJ] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDeclaracao, setLoadingDeclaracao] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { cliente } = solicitacao;
  const isPF = cliente.tipo === 'PF';

  const updateStatus = async (newStatus: StatusSolicitacao) => {
    if (newStatus === 'concluido') {
      // Special flow: send declaration + mark as done
      setLoadingDeclaracao(true);
      try {
        const res = await fetch('/api/send-declaration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solicitacaoId: solicitacao.id }),
        });
        const data = await res.json();
        if (res.ok) {
          onUpdate(data.solicitacao as SolicitacaoComCliente);
          alert(`✅ Declaração enviada para ${cliente.email}!`);
        } else {
          alert(`Erro: ${data.error}`);
        }
      } finally {
        setLoadingDeclaracao(false);
      }
      return;
    }

    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSavePF = async (solicitacaoId: string, pontoColetaId: string) => {
    const res = await fetch(`/api/solicitacoes/${solicitacaoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'agendado', ponto_coleta_id: pontoColetaId }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
  };

  const handleSavePJ = async (
    solicitacaoId: string,
    data: { veiculo_id: string; data_agendada: string; turno: TurnoAgendamento }
  ) => {
    const res = await fetch(`/api/solicitacoes/${solicitacaoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'agendado', ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
  };

  const dataFormatada = format(new Date(solicitacao.created_at), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Card Header */}
        <div className="px-4 py-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                isPF ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {isPF ? '👤 PF' : '🏢 PJ'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[solicitacao.status]}`}>
                {STATUS_OPTIONS.find((s) => s.value === solicitacao.status)?.label}
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm mt-1.5 truncate">{cliente.nome}</p>
            <p className="text-gray-400 text-xs">{dataFormatada}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Material description */}
        <div className="px-4 pb-3">
          <p className="text-gray-600 text-xs line-clamp-2">{solicitacao.descricao_material}</p>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide">E-mail</p>
                <p className="text-gray-700 truncate">{cliente.email}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide">Telefone</p>
                <p className="text-gray-700">{cliente.telefone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 font-semibold uppercase tracking-wide">Endereço</p>
                <p className="text-gray-700">{cliente.endereco} — {cliente.cidade}/{cliente.estado}</p>
              </div>
              {solicitacao.ponto_coleta && (
                <div className="col-span-2">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide">Ponto de Coleta</p>
                  <p className="text-gray-700">{solicitacao.ponto_coleta.nome}</p>
                </div>
              )}
              {solicitacao.data_agendada && (
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wide">Data Agendada</p>
                  <p className="text-gray-700">
                    {format(new Date(solicitacao.data_agendada + 'T12:00:00'), 'dd/MM/yyyy')}
                    {solicitacao.turno && ` — ${solicitacao.turno === 'manha' ? 'Manhã' : 'Tarde'}`}
                  </p>
                </div>
              )}
              {solicitacao.veiculo && (
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wide">Veículo</p>
                  <p className="text-gray-700">{solicitacao.veiculo.nome} ({solicitacao.veiculo.placa})</p>
                </div>
              )}
              {solicitacao.imagem_url && (
                <div className="col-span-2">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide mb-1">Foto</p>
                  <a href={solicitacao.imagem_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={solicitacao.imagem_url}
                      alt="Material"
                      className="h-24 w-full object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {solicitacao.status !== 'concluido' && (
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {/* Status selector */}
            <select
              value={solicitacao.status}
              onChange={(e) => updateStatus(e.target.value as StatusSolicitacao)}
              disabled={loadingStatus || loadingDeclaracao}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Contextual action buttons */}
            <div className="flex gap-2">
              {isPF && solicitacao.status === 'em_analise' && (
                <button
                  onClick={() => setShowModalPF(true)}
                  className="flex-1 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  📍 Indicar Ponto
                </button>
              )}
              {!isPF && solicitacao.status === 'em_analise' && (
                <button
                  onClick={() => setShowModalPJ(true)}
                  className="flex-1 py-2 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                >
                  📅 Agendar Coleta
                </button>
              )}
              {solicitacao.status === 'agendado' && (
                <button
                  onClick={() => updateStatus('concluido')}
                  disabled={loadingDeclaracao}
                  className="flex-1 py-2 text-xs rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  {loadingDeclaracao ? (
                    <>
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Enviando...
                    </>
                  ) : '✅ Concluir + Enviar PDF'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Concluded badge */}
        {solicitacao.status === 'concluido' && (
          <div className="border-t border-green-100 px-4 py-3 bg-green-50">
            <p className="text-green-600 text-xs font-medium flex items-center gap-1">
              {solicitacao.declaracao_enviada ? (
                <><span>📧</span> Declaração enviada ao cliente</>
              ) : (
                <><span>✅</span> Concluído</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModalPF && (
        <ModalPF
          solicitacao={solicitacao}
          pontosColeta={pontosColeta}
          onClose={() => setShowModalPF(false)}
          onSave={handleSavePF}
        />
      )}
      {showModalPJ && (
        <ModalPJ
          solicitacao={solicitacao}
          veiculos={veiculos}
          onClose={() => setShowModalPJ(false)}
          onSave={handleSavePJ}
        />
      )}
    </>
  );
}

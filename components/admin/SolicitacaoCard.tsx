'use client';

import { useState } from 'react';
import { SolicitacaoComCliente, StatusSolicitacao, PontoColeta, Veiculo, TurnoAgendamento } from '@/lib/types';
import ModalPF from './ModalPF';
import ModalPJ from './ModalPJ';
import ModalDeclaracao from './ModalDeclaracao';
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
  const [showModalDeclaracao, setShowModalDeclaracao] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDeclaracao, setLoadingDeclaracao] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { cliente } = solicitacao;
  const isPF = cliente.tipo === 'PF';

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithDDI}`;
  };

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
            <div className="flex items-center gap-1.5 mt-1.5">
              <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]" title={cliente.nome}>
                {cliente.nome}
              </p>
              <a
                href={getWhatsAppLink(cliente.telefone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                title={`Iniciar conversa no WhatsApp: ${cliente.telefone}`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.013-5.11-2.861-6.958C16.672 1.94 14.197.924 11.564.924c-5.438 0-9.861 4.417-9.865 9.858-.002 1.81.474 3.58 1.38 5.148L2.08 21.92l6.096-1.602c1.554.847 3.23 1.293 4.871 1.293zm9.64-5.263c-.302-.15-1.787-.88-2.067-.98-.28-.1-.486-.15-.688.15s-.585.73-.717.88c-.132.15-.264.17-.565.02-1.396-.7-2.3-1.258-3.21-2.82-.24-.41-.24-.668-.06-.888.162-.2.302-.35.452-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.025-.53s-.688-1.66-.943-2.27c-.248-.597-.5-.515-.688-.525-.177-.01-.38-.01-.585-.01-.205 0-.537.077-.817.38-.28.3-.923.903-.923 2.203s.945 2.553 1.077 2.733c.132.18 1.86 2.84 4.505 3.98.63.27 1.12.43 1.5.55.637.2 1.217.17 1.677.1 1.12-.17 1.788-.73 1.788-1.365 0-.63-.302-.93-.604-1.08z"/>
                </svg>
              </a>
            </div>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-gray-700">{cliente.telefone}</span>
                  <a
                    href={getWhatsAppLink(cliente.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Conversar no WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.013-5.11-2.861-6.958C16.672 1.94 14.197.924 11.564.924c-5.438 0-9.861 4.417-9.865 9.858-.002 1.81.474 3.58 1.38 5.148L2.08 21.92l6.096-1.602c1.554.847 3.23 1.293 4.871 1.293zm9.64-5.263c-.302-.15-1.787-.88-2.067-.98-.28-.1-.486-.15-.688.15s-.585.73-.717.88c-.132.15-.264.17-.565.02-1.396-.7-2.3-1.258-3.21-2.82-.24-.41-.24-.668-.06-.888.162-.2.302-.35.452-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.025-.53s-.688-1.66-.943-2.27c-.248-.597-.5-.515-.688-.525-.177-.01-.38-.01-.585-.01-.205 0-.537.077-.817.38-.28.3-.923.903-.923 2.203s.945 2.553 1.077 2.733c.132.18 1.86 2.84 4.505 3.98.63.27 1.12.43 1.5.55.637.2 1.217.17 1.677.1 1.12-.17 1.788-.73 1.788-1.365 0-.63-.302-.93-.604-1.08z"/>
                    </svg>
                  </a>
                </div>
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
                  onClick={() => setShowModalDeclaracao(true)}
                  className="flex-1 py-2 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  📄 Visualizar & Concluir
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
      {showModalDeclaracao && (
        <ModalDeclaracao
          solicitacao={solicitacao}
          onClose={() => setShowModalDeclaracao(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

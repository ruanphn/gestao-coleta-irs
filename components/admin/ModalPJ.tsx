'use client';

import { useState } from 'react';
import { SolicitacaoComCliente, Veiculo, TurnoAgendamento } from '@/lib/types';

interface ModalPJProps {
  solicitacao: SolicitacaoComCliente;
  veiculos: Veiculo[];
  onClose: () => void;
  onSave: (
    solicitacaoId: string,
    data: { veiculo_id: string; data_agendada: string; turno: TurnoAgendamento }
  ) => Promise<void>;
}

export default function ModalPJ({ solicitacao, veiculos, onClose, onSave }: ModalPJProps) {
  const [veiculoId, setVeiculoId] = useState(solicitacao.veiculo_id || '');
  const [dataAgendada, setDataAgendada] = useState(solicitacao.data_agendada || '');
  const [turno, setTurno] = useState<TurnoAgendamento>(solicitacao.turno || 'manha');
  const [loading, setLoading] = useState(false);

  const isValid = veiculoId && dataAgendada && turno;

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    await onSave(solicitacao.id, { veiculo_id: veiculoId, data_agendada: dataAgendada, turno });
    setLoading(false);
    onClose();
  };

  // Minimum date is today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-purple-600 px-6 py-4">
          <h3 className="text-white font-bold text-lg">🏢 Agendar Coleta Empresarial</h3>
          <p className="text-purple-200 text-sm mt-0.5">
            {solicitacao.cliente.nome} — Pessoa Jurídica
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Material info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Material</p>
            <p className="text-gray-700 text-sm">{solicitacao.descricao_material}</p>
            <p className="text-gray-500 text-xs mt-2">
              📍 {solicitacao.cliente.endereco} — {solicitacao.cliente.cidade}/{solicitacao.cliente.estado}
            </p>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              📅 Data da Coleta
            </label>
            <input
              type="date"
              min={today}
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />
          </div>

          {/* Turno */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Turno</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'manha', label: '🌅 Manhã', sub: '08h – 12h' },
                { value: 'tarde', label: '🌇 Tarde', sub: '13h – 17h' },
              ] as const).map((t) => (
                <label
                  key={t.value}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    turno === t.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={t.value}
                    checked={turno === t.value}
                    onChange={() => setTurno(t.value)}
                    className="sr-only"
                  />
                  <span className="text-xl mb-1">{t.label.split(' ')[0]}</span>
                  <span className="font-semibold text-gray-700 text-sm">{t.label.split(' ')[1]}</span>
                  <span className="text-gray-400 text-xs">{t.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Veículo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">🚛 Veículo / Rota</label>
            <select
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            >
              <option value="">Selecione um veículo...</option>
              {veiculos
                .filter((v) => v.ativo)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome} ({v.placa}){v.capacidade_kg ? ` — ${v.capacidade_kg}kg` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || loading}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors"
          >
            {loading ? 'Agendando...' : '📅 Confirmar Agendamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

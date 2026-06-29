'use client';

import { useState } from 'react';
import { PontoColeta, SolicitacaoComCliente } from '@/lib/types';

interface ModalPFProps {
  solicitacao: SolicitacaoComCliente;
  pontosColeta: PontoColeta[];
  onClose: () => void;
  onSave: (solicitacaoId: string, pontoColetaId: string) => Promise<void>;
}

export default function ModalPF({ solicitacao, pontosColeta, onClose, onSave }: ModalPFProps) {
  const [selectedPonto, setSelectedPonto] = useState(solicitacao.ponto_coleta_id || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedPonto) return;
    setLoading(true);
    await onSave(solicitacao.id, selectedPonto);
    setLoading(false);
    onClose();
  };

  const ponto = pontosColeta.find((p) => p.id === selectedPonto);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h3 className="text-white font-bold text-lg">👤 Indicar Ponto de Coleta</h3>
          <p className="text-blue-200 text-sm mt-0.5">
            {solicitacao.cliente.nome} — Pessoa Física
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Material info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Material</p>
            <p className="text-gray-700 text-sm">{solicitacao.descricao_material}</p>
          </div>

          {/* Point selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selecione o ponto de coleta mais próximo
            </label>
            <div className="space-y-2">
              {pontosColeta
                .filter((p) => p.ativo)
                .map((ponto) => (
                  <label
                    key={ponto.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPonto === ponto.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ponto"
                      value={ponto.id}
                      checked={selectedPonto === ponto.id}
                      onChange={() => setSelectedPonto(ponto.id)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{ponto.nome}</p>
                      <p className="text-gray-500 text-xs">{ponto.endereco} — {ponto.cidade}/{ponto.estado}</p>
                      {ponto.horario_funcionamento && (
                        <p className="text-gray-400 text-xs mt-0.5">🕐 {ponto.horario_funcionamento}</p>
                      )}
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Preview */}
          {ponto && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-700 text-sm font-semibold mb-1">📍 Notificação que será enviada:</p>
              <p className="text-blue-600 text-xs">
                &quot;Olá {solicitacao.cliente.nome}! Seu descarte foi aprovado. Por favor, leve os materiais ao
                ponto de coleta <strong>{ponto.nome}</strong>, localizado em {ponto.endereco}.
                {ponto.horario_funcionamento && ` Horário: ${ponto.horario_funcionamento}.`}&quot;
              </p>
            </div>
          )}
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
            disabled={!selectedPonto || loading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors"
          >
            {loading ? 'Salvando...' : '📍 Confirmar Ponto'}
          </button>
        </div>
      </div>
    </div>
  );
}

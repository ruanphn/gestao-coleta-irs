'use client';

import { useState } from 'react';
import { PontoColeta } from '@/lib/types';

interface PontosColetaManagerProps {
  pontos: PontoColeta[];
  onRefresh: () => void;
}

const emptyForm = {
  nome: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  horario_funcionamento: '',
  telefone: '',
};

export default function PontosColetaManager({ pontos, onRefresh }: PontosColetaManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pontos-coleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (ponto: PontoColeta) => {
    if (!confirm(`${ponto.ativo ? 'Desativar' : 'Reativar'} "${ponto.nome}"?`)) return;
    const method = ponto.ativo ? 'DELETE' : 'PATCH';
    const body = ponto.ativo ? undefined : JSON.stringify({ ativo: true });
    await fetch(`/api/pontos-coleta/${ponto.id}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📍</span> Pontos de Coleta
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          + Novo Ponto
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-green-800 text-sm">Novo Ponto de Coleta</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'nome', label: 'Nome', placeholder: 'Ponto Centro', required: true },
              { key: 'endereco', label: 'Endereço', placeholder: 'Rua X, 100', required: true },
              { key: 'cidade', label: 'Cidade', placeholder: 'São Paulo', required: true },
              { key: 'estado', label: 'Estado', placeholder: 'SP', required: true },
              { key: 'cep', label: 'CEP', placeholder: '00000-000', required: true },
              { key: 'horario_funcionamento', label: 'Horário', placeholder: 'Seg–Sex 8h–18h', required: false },
              { key: 'telefone', label: 'Telefone', placeholder: '(11) 99999-9999', required: false },
            ].map((field) => (
              <div key={field.key} className={field.key === 'horario_funcionamento' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={form[field.key as keyof typeof emptyForm]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Criar Ponto'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {pontos.map((ponto) => (
          <div
            key={ponto.id}
            className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
              ponto.ativo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 text-sm truncate">{ponto.nome}</p>
                {!ponto.ativo && (
                  <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Inativo</span>
                )}
              </div>
              <p className="text-gray-500 text-xs">{ponto.endereco} — {ponto.cidade}/{ponto.estado}</p>
              {ponto.horario_funcionamento && (
                <p className="text-gray-400 text-xs mt-0.5">🕐 {ponto.horario_funcionamento}</p>
              )}
            </div>
            <button
              onClick={() => handleToggleAtivo(ponto)}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                ponto.ativo
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              }`}
            >
              {ponto.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        ))}
        {pontos.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Nenhum ponto cadastrado.</p>
        )}
      </div>
    </div>
  );
}

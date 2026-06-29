'use client';

import { useState } from 'react';
import { Veiculo } from '@/lib/types';

interface VeiculosManagerProps {
  veiculos: Veiculo[];
  onRefresh: () => void;
}

const emptyForm = { placa: '', nome: '', capacidade_kg: '' };

export default function VeiculosManager({ veiculos, onRefresh }: VeiculosManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacidade_kg: form.capacidade_kg ? parseInt(form.capacidade_kg) : null,
        }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>🚛</span> Veículos / Frota
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          + Novo Veículo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-purple-800 text-sm">Novo Veículo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Placa *</label>
              <input
                type="text"
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome / Descrição *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Caminhão Verde 01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Capacidade (kg)</label>
              <input
                type="number"
                value={form.capacidade_kg}
                onChange={(e) => setForm({ ...form, capacidade_kg: e.target.value })}
                placeholder="1000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>
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
              className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {veiculos.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">🚛</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{v.nome}</p>
                <p className="text-gray-400 text-xs">
                  {v.placa}
                  {v.capacidade_kg && ` · ${v.capacidade_kg.toLocaleString('pt-BR')}kg`}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              v.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {v.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
        {veiculos.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Nenhum veículo cadastrado.</p>
        )}
      </div>
    </div>
  );
}

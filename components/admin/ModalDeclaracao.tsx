'use client';

import { useState } from 'react';
import { SolicitacaoComCliente } from '@/lib/types';

interface ModalDeclaracaoProps {
  solicitacao: SolicitacaoComCliente;
  onClose: () => void;
  onUpdate: (updated: SolicitacaoComCliente) => void;
}

export default function ModalDeclaracao({
  solicitacao,
  onClose,
  onUpdate,
}: ModalDeclaracaoProps) {
  // Dados do Cliente
  const [nome, setNome] = useState(solicitacao.cliente.nome);
  const [email, setEmail] = useState(solicitacao.cliente.email);
  const [telefone, setTelefone] = useState(solicitacao.cliente.telefone);
  const [endereco, setEndereco] = useState(solicitacao.cliente.endereco);
  const [cidade, setCidade] = useState(solicitacao.cliente.cidade);
  const [estado, setEstado] = useState(solicitacao.cliente.estado);
  const [cep, setCep] = useState(solicitacao.cliente.cep);

  // Dados da Solicitação
  const [descricaoMaterial, setDescricaoMaterial] = useState(solicitacao.descricao_material);
  const [observacoes, setObservacoes] = useState(solicitacao.observacoes || '');

  // Estados de Carregamento e Interface
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Salva alterações no banco e atualiza o estado local + recarrega o PDF
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao_material: descricaoMaterial,
          observacoes: observacoes || null,
          cliente: {
            nome,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar alterações no banco.');
      }

      const updated = await res.json();
      onUpdate(updated);
      
      // Força a atualização do iframe do PDF alterando o query param
      setTimestamp(Date.now());
      setSuccessMsg('Alterações salvas e PDF atualizado!');
      
      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // Salva dados e envia e-mail com o PDF
  const handleSend = async () => {
    setSending(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Garante que os dados editados na tela sejam salvos antes de enviar
      const resSave = await fetch(`/api/solicitacoes/${solicitacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao_material: descricaoMaterial,
          observacoes: observacoes || null,
          cliente: {
            nome,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep,
          },
        }),
      });

      if (!resSave.ok) {
        const dataSave = await resSave.json();
        throw new Error(dataSave.error || 'Erro ao salvar alterações antes de enviar.');
      }

      const updatedSave = await resSave.json();
      onUpdate(updatedSave);

      // 2. Dispara a rota de geração e envio de e-mail
      const resSend = await fetch('/api/send-declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitacaoId: solicitacao.id }),
      });

      const dataSend = await resSend.json();
      if (!resSend.ok) {
        throw new Error(dataSend.error || 'Erro ao disparar envio do PDF.');
      }

      onUpdate(dataSend.solicitacao as SolicitacaoComCliente);
      alert(`✅ Declaração enviada com sucesso para ${email}!`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar declaração.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span>📄</span> Visualizar e Ajustar Declaração Ambiental
            </h3>
            <p className="text-green-150 text-xs mt-0.5 opacity-90">
              Solicitação #{solicitacao.id.slice(0, 8).toUpperCase()} — {solicitacao.cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Split Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50">
          {/* Left Panel: Form */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
              ✏️ Dados da Declaração
            </h4>
            
            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome / Razão Social</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  required
                />
              </div>

              {/* Email / Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  required
                />
              </div>

              {/* Cidade, Estado, CEP */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white uppercase"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Descrição dos Materiais */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição dos Materiais</label>
                <textarea
                  value={descricaoMaterial}
                  onChange={(e) => setDescricaoMaterial(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                  required
                />
              </div>

              {/* Observações Internas */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Observações <span className="text-gray-400 font-normal">(Interno)</span>
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                />
              </div>

              {/* Mensagem de Feedback */}
              {error && (
                <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 rounded-lg p-2.5">
                  ⚠️ {error}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded-lg p-2.5">
                  ✨ {successMsg}
                </p>
              )}

              {/* Botão de Salvar Rápido */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando dados...
                  </>
                ) : (
                  <>
                    <span>💾</span> Salvar & Atualizar Pré-visualização
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Panel: PDF Preview */}
          <div className="w-full md:w-1/2 p-6 flex flex-col bg-gray-150">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>👁️</span> Pré-visualização do PDF
            </h4>
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-inner relative min-h-[300px]">
              <iframe
                src={`/api/solicitacoes/${solicitacao.id}/pdf?t=${timestamp}`}
                className="w-full h-full border-none"
                title="Pré-visualização da Declaração Ambiental"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          >
            Fechar
          </button>
          
          <button
            onClick={handleSend}
            disabled={saving || sending}
            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white transition-colors shadow-md flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Gerando e Enviando...
              </>
            ) : (
              <>
                <span>📧</span> Confirmar e Enviar por E-mail (Concluir)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

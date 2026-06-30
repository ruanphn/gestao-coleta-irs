'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SolicitacaoComCliente, PontoColeta, Veiculo } from '@/lib/types';
import StatsBar from '@/components/admin/StatsBar';
import KanbanBoard from '@/components/admin/KanbanBoard';
import PontosColetaManager from '@/components/admin/PontosColetaManager';
import VeiculosManager from '@/components/admin/VeiculosManager';
import Logo from '@/components/ui/Logo';

type Tab = 'kanban' | 'pontos' | 'veiculos';

export default function DashboardPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComCliente[]>([]);
  const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (!auth) router.replace('/admin');
  }, [router]);

  const fetchSolicitacoes = useCallback(async () => {
    const res = await fetch('/api/solicitacoes');
    if (res.ok) setSolicitacoes(await res.json());
  }, []);

  const fetchPontos = useCallback(async () => {
    const res = await fetch('/api/pontos-coleta');
    if (res.ok) setPontosColeta(await res.json());
  }, []);

  const fetchVeiculos = useCallback(async () => {
    const res = await fetch('/api/veiculos');
    if (res.ok) setVeiculos(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([fetchSolicitacoes(), fetchPontos(), fetchVeiculos()]).finally(() =>
      setLoading(false)
    );
  }, [fetchSolicitacoes, fetchPontos, fetchVeiculos]);

  const handleUpdate = (updated: SolicitacaoComCliente) => {
    setSolicitacoes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    router.replace('/admin');
  };

  // Gerar URL do Google Maps com waypoints dos PJs agendados partindo da sede (otimizado por CEP)
  const handleGerarRota = () => {
    const pjAgendados = solicitacoes.filter(
      (s) => s.cliente?.tipo === 'PJ' && s.status === 'agendado'
    );

    if (pjAgendados.length === 0) {
      alert('Nenhuma solicitação PJ com status "Agendado" encontrada.');
      return;
    }

    // Ordena as coletas pelo CEP do cliente numéricamente
    // CEPs sequenciais/próximos indicam proximidade geográfica (heurística de otimização de rota offline)
    const pjOrdenados = [...pjAgendados].sort((a, b) => {
      const cepA = parseInt((a.cliente?.cep || '').replace(/\D/g, ''), 10) || 0;
      const cepB = parseInt((b.cliente?.cep || '').replace(/\D/g, ''), 10) || 0;
      return cepA - cepB;
    });

    const sede = encodeURIComponent('R. Francisquinha Portela, 1055 - Quintino Cunha, Fortaleza - CE, 60351-840');
    const enderecos = pjOrdenados.map((s) =>
      encodeURIComponent(`${s.cliente.endereco}, ${s.cliente.cidade}, ${s.cliente.estado}`)
    );

    let url = 'https://www.google.com/maps/dir/';
    url += `${sede}/${enderecos.join('/')}`;
    window.open(url, '_blank');
  };

  // Filter solicitacoes by search
  const filteredSolicitacoes = solicitacoes.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.cliente?.nome?.toLowerCase().includes(q) ||
      s.cliente?.email?.toLowerCase().includes(q) ||
      s.descricao_material?.toLowerCase().includes(q) ||
      s.cliente?.cpf_cnpj?.includes(q)
    );
  });

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'kanban',  label: 'Solicitações', icon: '📋' },
    { id: 'pontos',  label: 'Pontos de Coleta', icon: '📍' },
    { id: 'veiculos', label: 'Veículos', icon: '🚛' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo light showText={true} />
          </div>

          {/* Search */}
          {activeTab === 'kanban' && (
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail, CPF/CNPJ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Gerar Rota button */}
            <button
              onClick={handleGerarRota}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <span>🗺️</span>
              <span>Gerar Rota</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchSolicitacoes()}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              title="Atualizar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex gap-1 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-green-400 border-green-500 bg-green-500/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-gray-400 text-sm">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'kanban' && (
              <>
                {/* Mobile search */}
                <div className="sm:hidden">
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Mobile gerar rota */}
                <div className="sm:hidden">
                  <button
                    onClick={handleGerarRota}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    🗺️ Gerar Rota PJs Agendados
                  </button>
                </div>

                {/* Stats */}
                <StatsBar solicitacoes={filteredSolicitacoes} />

                {/* Kanban */}
                <KanbanBoard
                  solicitacoes={filteredSolicitacoes}
                  pontosColeta={pontosColeta}
                  veiculos={veiculos}
                  onUpdate={handleUpdate}
                />
              </>
            )}

            {activeTab === 'pontos' && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <PontosColetaManager pontos={pontosColeta} onRefresh={fetchPontos} />
                </div>
              </div>
            )}

            {activeTab === 'veiculos' && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <VeiculosManager veiculos={veiculos} onRefresh={fetchVeiculos} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

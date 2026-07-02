'use client';

import { SolicitacaoComCliente, PontoColeta, Veiculo } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStatsProps {
  solicitacoes: SolicitacaoComCliente[];
  pontosColeta: PontoColeta[];
  veiculos: Veiculo[];
}

export default function DashboardStats({ solicitacoes, pontosColeta, veiculos }: DashboardStatsProps) {
  // 1. Métricas gerais
  const total = solicitacoes.length;
  const pf = solicitacoes.filter((s) => s.cliente?.tipo === 'PF').length;
  const pj = solicitacoes.filter((s) => s.cliente?.tipo === 'PJ').length;

  const counts = {
    pendente: solicitacoes.filter((s) => s.status === 'pendente').length,
    em_analise: solicitacoes.filter((s) => s.status === 'em_analise').length,
    agendado: solicitacoes.filter((s) => s.status === 'agendado').length,
    concluido: solicitacoes.filter((s) => s.status === 'concluido').length,
  };

  const pctPF = total > 0 ? Math.round((pf / total) * 100) : 0;
  const pctPJ = total > 0 ? Math.round((pj / total) * 100) : 0;

  // 2. Coletas por Cidade
  const coletasPorCidade = solicitacoes.reduce((acc, curr) => {
    const cidade = curr.cliente?.cidade || 'Não informada';
    const estado = curr.cliente?.estado || '';
    const key = estado ? `${cidade} - ${estado}` : cidade;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cidadesOrdenadas = Object.entries(coletasPorCidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 3. Exportar para Excel (CSV brasileiro com delimitador ";" e BOM UTF-8)
  const handleExportExcel = () => {
    const headers = [
      'ID Solicitacao',
      'Cliente Nome',
      'Tipo (PF/PJ)',
      'CPF_CNPJ',
      'Telefone',
      'E-mail',
      'Endereco',
      'Cidade',
      'Estado',
      'CEP',
      'Status',
      'Descricao Material',
      'Ponto de Coleta Indicado',
      'Veiculo Agendado',
      'Placa do Veiculo',
      'Data Agendamento',
      'Turno',
      'Declaracao Enviada',
      'Data Criacao'
    ];

    const rows = solicitacoes.map((s) => [
      s.id,
      s.cliente?.nome || '',
      s.cliente?.tipo || '',
      s.cliente?.cpf_cnpj || '',
      s.cliente?.telefone || '',
      s.cliente?.email || '',
      s.cliente?.endereco || '',
      s.cliente?.cidade || '',
      s.cliente?.estado || '',
      s.cliente?.cep || '',
      s.status,
      (s.descricao_material || '').replace(/[\r\n]+/g, ' '),
      s.ponto_coleta?.nome || '',
      s.veiculo?.nome || '',
      s.veiculo?.placa || '',
      s.data_agendada || '',
      s.turno || '',
      s.declaracao_enviada ? 'Sim' : 'Não',
      s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy HH:mm:ss') : ''
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_coletas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Exportar para HTML (Abre uma nova janela estilizada para impressão direta)
  const handleExportHTML = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para extrair o relatório.');
      return;
    }

    const dataGeracao = format(new Date(), "dd/MM/yyyy 'as' HH:mm:ss");

    const kpisHtml = `
      <div class="kpis">
        <div class="kpi-card">
          <div class="kpi-val">${total}</div>
          <div class="kpi-lbl">Total Coletas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${pf}</div>
          <div class="kpi-lbl">Pessoa Fisica (PF)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${pj}</div>
          <div class="kpi-lbl">Pessoa Juridica (PJ)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${counts.concluido}</div>
          <div class="kpi-lbl">Concluidas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">${counts.agendado}</div>
          <div class="kpi-lbl">Agendadas</div>
        </div>
      </div>
    `;

    const tableRowsHtml = solicitacoes.map((s) => {
      const dataCriacao = s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : '';
      const localColeta = s.cliente?.tipo === 'PF' 
        ? (s.ponto_coleta?.nome ? `Ponto: ${s.ponto_coleta.nome}` : 'Ponto pendente') 
        : (s.data_agendada ? `Veiculo: ${s.veiculo?.nome || 'Frota'} (${format(new Date(s.data_agendada + 'T12:00:00'), 'dd/MM/yyyy')})` : 'Agendamento pendente');

      return `
        <tr>
          <td><strong>${s.cliente?.nome || 'N/A'}</strong></td>
          <td><span class="badge badge-${s.cliente?.tipo.toLowerCase()}">${s.cliente?.tipo || 'N/A'}</span></td>
          <td>${s.cliente?.telefone || ''}</td>
          <td>${s.cliente?.cidade || ''}/${s.cliente?.estado || ''}</td>
          <td><span class="status-lbl">${s.status.toUpperCase().replace('_', ' ')}</span></td>
          <td style="max-width: 250px; font-size: 11px;">${s.descricao_material}</td>
          <td style="font-size: 11px;">${localColeta}</td>
          <td>${dataCriacao}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatorio Consolidado de Coleta</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #374151; margin: 30px; line-height: 1.5; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 15px; margin-bottom: 25px; }
          .logo-text { font-size: 20px; font-weight: bold; color: #15803d; }
          .report-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
          .meta-info { font-size: 12px; color: #6b7280; text-align: right; }
          .kpis { display: flex; gap: 15px; margin-bottom: 30px; }
          .kpi-card { border: 1px solid #e5e7eb; padding: 15px 10px; border-radius: 12px; flex: 1; background: #f9fafb; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .kpi-val { font-size: 28px; font-weight: 800; color: #16a34a; }
          .kpi-lbl { font-size: 10px; color: #4b5563; text-transform: uppercase; font-weight: 600; margin-top: 5px; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
          th { background-color: #f3f4f6; color: #1f2937; font-weight: 700; font-size: 11px; text-transform: uppercase; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
          .badge-pf { background-color: #e0f2fe; color: #0369a1; }
          .badge-pj { background-color: #ffedd5; color: #c2410c; }
          .status-lbl { font-size: 10px; font-weight: 600; color: #4b5563; }
          .actions-print { margin-bottom: 20px; display: flex; justify-content: flex-end; }
          .btn-print { background-color: #16a34a; color: white; padding: 8px 16px; font-size: 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; items-center; gap: 5px; }
          .btn-print:hover { background-color: #15803d; }
          @media print {
            .actions-print { display: none; }
            body { margin: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="actions-print">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir Relatorio</button>
        </div>
        <div class="header-container">
          <div>
            <h1 class="report-title">Relatorio de Gestao de Coletas</h1>
            <div class="logo-text">♻️ Instituto Robotica Sustentavel</div>
          </div>
          <div class="meta-info">
            <p>Gerado em: <strong>${dataGeracao}</strong></p>
            <p>Filtro: <strong>Todos os Registros</strong></p>
          </div>
        </div>

        ${kpisHtml}

        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Material</th>
              <th>Ponto de Coleta / Agendamento</th>
              <th>Data Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Acoes superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Indicadores Consolidados</h2>
          <p className="text-gray-400 text-xs mt-0.5">Visao geral do fluxo de coletas e reciclagem</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportHTML}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Relatório Imprimível (HTML)</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Relatório Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-3xl font-extrabold text-gray-800">{total}</span>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-3">Total Solicitado</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-3xl font-extrabold text-amber-600">{counts.pendente}</span>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-3">Coletas Pendentes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-3xl font-extrabold text-purple-600">{counts.agendado}</span>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-3">Coletas Agendadas</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-3xl font-extrabold text-green-600">{counts.concluido}</span>
          </div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-3">Coletas Concluídas</p>
        </div>
      </div>

      {/* Linha 2: Proporcao PF vs PJ & Distribuicao por Cidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuicao por Tipo de Cliente */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-sm mb-4">Proporcao: PF vs PJ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Pessoa Física (PF)
                </span>
                <span className="text-gray-800 font-bold">{pf} coletas ({pctPF}%)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                  Pessoa Jurídica (PJ)
                </span>
                <span className="text-gray-800 font-bold">{pj} coletas ({pctPJ}%)</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
              <div 
                className="bg-sky-500 h-full transition-all duration-500" 
                style={{ width: `${pctPF}%` }}
                title={`Pessoa Fisica: ${pctPF}%`}
              />
              <div 
                className="bg-orange-500 h-full transition-all duration-500" 
                style={{ width: `${pctPJ}%` }}
                title={`Pessoa Juridica: ${pctPJ}%`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>PF ({pctPF}%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>PJ ({pctPJ}%)</span>
            </div>
          </div>
        </div>

        {/* Cidades com mais coletas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Cidades com Mais Coletas</h3>
          {cidadesOrdenadas.length === 0 ? (
            <p className="text-gray-400 text-xs py-4 text-center">Nenhum dado disponivel</p>
          ) : (
            <div className="space-y-3">
              {cidadesOrdenadas.map(([cidade, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cidade} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-600">{cidade}</span>
                      <span className="font-bold text-gray-800">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-full rounded-full" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recentes Log */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Ultimas Coletas Cadastradas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 font-semibold">Tipo</th>
                <th className="pb-3 font-semibold">Cidade/UF</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Material</th>
                <th className="pb-3 font-semibold">Data Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.slice(0, 5).map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 font-bold text-gray-700">{s.cliente?.nome || 'N/A'}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      s.cliente?.tipo === 'PF' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {s.cliente?.tipo || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{s.cliente?.cidade || ''}/{s.cliente?.estado || ''}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      s.status === 'concluido' ? 'bg-green-100 text-green-700 border-green-200' :
                      s.status === 'agendado' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      s.status === 'em_analise' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 max-w-[200px] truncate">{s.descricao_material}</td>
                  <td className="py-3 text-gray-400">
                    {s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : ''}
                  </td>
                </tr>
              ))}
              {solicitacoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Nenhuma solicitacao cadastrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

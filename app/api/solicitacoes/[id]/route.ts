import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { AtualizarSolicitacaoPayload } from '@/lib/types';

// GET /api/solicitacoes/[id] — Busca solicitação por ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('solicitacoes')
    .select(`
      *,
      cliente:clientes(*),
      ponto_coleta:pontos_coleta(*),
      veiculo:veiculos_rotas(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/solicitacoes/[id] — Atualiza status, agendamento, dados de cliente, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { cliente, ...solicitacaoData } = await request.json();

  // Se houver dados de cliente no corpo da requisição, atualiza a tabela 'clientes' primeiro
  if (cliente) {
    const { data: solData, error: fetchError } = await supabaseAdmin
      .from('solicitacoes')
      .select('cliente_id')
      .eq('id', id)
      .single();

    if (fetchError || !solData) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada para atualização de cliente.' },
        { status: 404 }
      );
    }

    const { error: clientError } = await supabaseAdmin
      .from('clientes')
      .update(cliente)
      .eq('id', solData.cliente_id);

    if (clientError) {
      return NextResponse.json(
        { error: `Erro ao atualizar dados do cliente: ${clientError.message}` },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from('solicitacoes')
    .update(solicitacaoData)
    .eq('id', id)
    .select(`
      *,
      cliente:clientes(*),
      ponto_coleta:pontos_coleta(*),
      veiculo:veiculos_rotas(*)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

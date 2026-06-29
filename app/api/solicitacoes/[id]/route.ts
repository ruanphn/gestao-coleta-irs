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

// PATCH /api/solicitacoes/[id] — Atualiza status, agendamento, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: AtualizarSolicitacaoPayload = await request.json();

  const { data, error } = await supabaseAdmin
    .from('solicitacoes')
    .update(body)
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

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { CriarSolicitacaoPayload } from '@/lib/types';

// GET /api/solicitacoes — Lista todas as solicitações (admin)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('solicitacoes')
    .select(`
      *,
      cliente:clientes(*),
      ponto_coleta:pontos_coleta(*),
      veiculo:veiculos_rotas(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/solicitacoes — Cria nova solicitação (formulário público)
export async function POST(request: NextRequest) {
  const body: CriarSolicitacaoPayload = await request.json();

  // 1. Criar cliente
  const { data: cliente, error: clienteError } = await supabaseAdmin
    .from('clientes')
    .insert({
      nome: body.nome,
      tipo: body.tipo,
      cpf_cnpj: body.cpf_cnpj,
      endereco: body.endereco,
      cidade: body.cidade,
      estado: body.estado,
      cep: body.cep,
      telefone: body.telefone,
      email: body.email,
    })
    .select()
    .single();

  if (clienteError) {
    return NextResponse.json({ error: clienteError.message }, { status: 500 });
  }

  // 2. Criar solicitação
  const { data: solicitacao, error: solicitacaoError } = await supabaseAdmin
    .from('solicitacoes')
    .insert({
      cliente_id: cliente.id,
      descricao_material: body.descricao_material,
      imagem_url: body.imagem_url || null,
      status: 'pendente',
    })
    .select()
    .single();

  if (solicitacaoError) {
    return NextResponse.json({ error: solicitacaoError.message }, { status: 500 });
  }

  return NextResponse.json({ solicitacao, cliente }, { status: 201 });
}

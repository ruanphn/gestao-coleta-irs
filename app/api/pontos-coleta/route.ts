import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/pontos-coleta — Lista pontos de coleta
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pontos_coleta')
    .select('*')
    .order('nome');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/pontos-coleta — Cria novo ponto de coleta
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('pontos_coleta')
    .insert({
      nome: body.nome,
      endereco: body.endereco,
      cidade: body.cidade,
      estado: body.estado,
      cep: body.cep,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      horario_funcionamento: body.horario_funcionamento || null,
      telefone: body.telefone || null,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/veiculos — Lista veículos
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('veiculos_rotas')
    .select('*')
    .order('nome');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/veiculos — Cria novo veículo
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('veiculos_rotas')
    .insert({
      placa: body.placa,
      nome: body.nome,
      capacidade_kg: body.capacidade_kg || null,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

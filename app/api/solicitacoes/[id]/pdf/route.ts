import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { gerarDeclaracaoAmbiental } from '@/lib/pdf-generator';
import { SolicitacaoComCliente } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Buscar dados completos da solicitação
  const { data: solicitacao, error: fetchError } = await supabaseAdmin
    .from('solicitacoes')
    .select(`
      *,
      cliente:clientes(*),
      ponto_coleta:pontos_coleta(*),
      veiculo:veiculos_rotas(*)
    `)
    .eq('id', id)
    .single();

  if (fetchError || !solicitacao) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }

  // 2. Gerar o PDF
  try {
    const pdfBuffer = await gerarDeclaracaoAmbiental(solicitacao as SolicitacaoComCliente);
    
    // Retornar a resposta com o Content-Type apropriado
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="declaracao-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (pdfError) {
    console.error('Erro ao gerar PDF:', pdfError);
    return NextResponse.json({ error: 'Erro ao gerar declaração PDF.' }, { status: 500 });
  }
}

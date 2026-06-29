import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { gerarDeclaracaoAmbiental } from '@/lib/pdf-generator';
import { Resend } from 'resend';
import { SolicitacaoComCliente } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/send-declaration — Gera PDF + envia email + marca como concluído
export async function POST(request: NextRequest) {
  const { solicitacaoId } = await request.json();

  if (!solicitacaoId) {
    return NextResponse.json({ error: 'solicitacaoId é obrigatório.' }, { status: 400 });
  }

  // 1. Buscar dados completos da solicitação
  const { data: solicitacao, error: fetchError } = await supabaseAdmin
    .from('solicitacoes')
    .select(`
      *,
      cliente:clientes(*),
      ponto_coleta:pontos_coleta(*),
      veiculo:veiculos_rotas(*)
    `)
    .eq('id', solicitacaoId)
    .single();

  if (fetchError || !solicitacao) {
    return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  }

  const sol = solicitacao as SolicitacaoComCliente;

  // 2. Gerar o PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await gerarDeclaracaoAmbiental(sol);
  } catch (pdfError) {
    console.error('Erro ao gerar PDF:', pdfError);
    return NextResponse.json({ error: 'Erro ao gerar declaração PDF.' }, { status: 500 });
  }

  // 3. Enviar e-mail com PDF anexo via Resend
  const nomeCliente = sol.cliente.nome;
  const emailCliente = sol.cliente.email;
  const numSolicitacao = sol.id.slice(0, 8).toUpperCase();

  try {
    const { error: emailError } = await resend.emails.send({
      from: 'Instituto Robótica Sustentável <noreply@resend.dev>',
      to: [emailCliente],
      subject: `✅ Declaração Ambiental — Solicitação #${numSolicitacao}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px;">
          <div style="background: #16a34a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Instituto Robótica Sustentável</h1>
            <p style="color: #bbf7d0; margin: 8px 0 0;">Gestão de Coleta de Resíduos Eletrônicos</p>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #14532d; margin-top: 0;">Sua solicitação foi concluída! 🎉</h2>
            <p style="color: #374151;">Olá, <strong>${nomeCliente}</strong>!</p>
            <p style="color: #374151;">
              Temos o prazer de informar que sua solicitação de descarte de resíduos eletrônicos
              <strong>#${numSolicitacao}</strong> foi processada com sucesso.
            </p>
            <p style="color: #374151;">
              Em anexo, você encontrará a <strong>Declaração Ambiental</strong> referente ao descarte
              realizado. Guarde este documento — ele comprova a destinação ambientalmente correta
              dos seus resíduos eletrônicos.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                ♻️ Obrigado por contribuir com um mundo mais sustentável!
              </p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">
              Instituto Robótica Sustentável · Gestão de Resíduos Eletrônicos
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `declaracao-ambiental-${numSolicitacao}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 });
    }
  } catch (sendError) {
    console.error('Erro ao enviar e-mail:', sendError);
    return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 });
  }

  // 4. Marcar como concluído e declaração enviada
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('solicitacoes')
    .update({ status: 'concluido', declaracao_enviada: true })
    .eq('id', solicitacaoId)
    .select(`*, cliente:clientes(*), ponto_coleta:pontos_coleta(*), veiculo:veiculos_rotas(*)`)
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Declaração enviada para ${emailCliente}`,
    solicitacao: updated,
  });
}

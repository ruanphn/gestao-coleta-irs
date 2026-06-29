import PDFDocument from 'pdfkit';
import { SolicitacaoComCliente } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function gerarDeclaracaoAmbiental(
  solicitacao: SolicitacaoComCliente
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 72, right: 72 },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { cliente } = solicitacao;
    const dataEmissao = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
    const dataColeta = solicitacao.data_agendada
      ? format(new Date(solicitacao.data_agendada + 'T12:00:00'), "dd/MM/yyyy", {
          locale: ptBR,
        })
      : dataEmissao;

    // ── Header ──────────────────────────────────────────────────────────────
    // Green accent bar
    doc.rect(0, 0, doc.page.width, 8).fill('#16a34a');

    // Title block
    doc
      .moveDown(0.5)
      .fontSize(20)
      .fillColor('#14532d')
      .font('Helvetica-Bold')
      .text('DECLARAÇÃO AMBIENTAL', { align: 'center' });

    doc
      .fontSize(12)
      .fillColor('#166534')
      .font('Helvetica')
      .text('Instituto Robótica Sustentável', { align: 'center' });

    doc.moveDown(0.3);

    // Divider
    doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#16a34a').lineWidth(1.5).stroke();

    doc.moveDown(1);

    // ── Intro text ──────────────────────────────────────────────────────────
    doc
      .fontSize(11)
      .fillColor('#1f2937')
      .font('Helvetica')
      .text(
        `O Instituto Robótica Sustentável, por meio deste documento, declara que recebeu e realizou o descarte ambientalmente correto dos resíduos eletrônicos descritos abaixo, em conformidade com a Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010) e demais normas vigentes.`,
        { align: 'justify', lineGap: 4 }
      );

    doc.moveDown(1.2);

    // ── Client data ─────────────────────────────────────────────────────────
    const drawField = (label: string, value: string) => {
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .font('Helvetica-Bold')
        .text(label.toUpperCase(), { continued: false });
      doc
        .fontSize(11)
        .fillColor('#111827')
        .font('Helvetica')
        .text(value || '—');
      doc.moveDown(0.4);
    };

    doc
      .fontSize(12)
      .fillColor('#14532d')
      .font('Helvetica-Bold')
      .text('DADOS DO SOLICITANTE');
    doc.moveDown(0.5);

    drawField('Nome / Razão Social', cliente.nome);
    drawField(
      cliente.tipo === 'PF' ? 'CPF' : 'CNPJ',
      cliente.cpf_cnpj
    );
    drawField('Tipo', cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica');
    drawField(
      'Endereço',
      `${cliente.endereco} — ${cliente.cidade}/${cliente.estado} — CEP: ${cliente.cep}`
    );
    drawField('Telefone', cliente.telefone);
    drawField('E-mail', cliente.email);

    doc.moveDown(0.8);

    // ── Material data ───────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .fillColor('#14532d')
      .font('Helvetica-Bold')
      .text('MATERIAIS DESCARTADOS');
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor('#1f2937')
      .font('Helvetica')
      .text(solicitacao.descricao_material, { align: 'justify', lineGap: 4 });

    doc.moveDown(0.8);

    // ── Collection info ─────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .fillColor('#14532d')
      .font('Helvetica-Bold')
      .text('INFORMAÇÕES DA COLETA');
    doc.moveDown(0.5);

    drawField('Número da Solicitação', `#${solicitacao.id.slice(0, 8).toUpperCase()}`);
    drawField('Data da Coleta', dataColeta);
    if (solicitacao.ponto_coleta) {
      drawField('Ponto de Coleta', `${solicitacao.ponto_coleta.nome} — ${solicitacao.ponto_coleta.endereco}`);
    }
    if (solicitacao.veiculo) {
      drawField('Veículo Responsável', `${solicitacao.veiculo.nome} (Placa: ${solicitacao.veiculo.placa})`);
    }

    doc.moveDown(1.5);

    // ── Signature block ─────────────────────────────────────────────────────
    doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    doc
      .fontSize(11)
      .fillColor('#374151')
      .font('Helvetica')
      .text(`Documento emitido eletronicamente em ${dataEmissao}.`, {
        align: 'center',
      });

    doc.moveDown(2);

    // Signature line
    const centerX = doc.page.width / 2;
    doc
      .moveTo(centerX - 100, doc.y)
      .lineTo(centerX + 100, doc.y)
      .strokeColor('#374151')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text('Instituto Robótica Sustentável', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Responsável pela Gestão de Resíduos Eletrônicos', { align: 'center' });

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill('#16a34a');

    doc.end();
  });
}

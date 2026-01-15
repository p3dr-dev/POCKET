import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function consolidateFinalData() {
  const filePath = path.join(process.cwd(), 'dados4.txt');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);
  const dossier = data.dossie_financeiro_fiscal_complementar;

  console.log("--- INICIANDO CONSOLIDAÇÃO FINAL (SCR + FISCAL) ---");

  // 1. ASSEGURAR CONTAS DO SCR (Muitas vezes não aparecem no CCS mas têm dívida)
  const scrLatest = dossier.historico_credito_scr_dividas.novembro_2025;
  for (const item of scrLatest.detalhes) {
    const name = item.instituicao;
    const existing = await prisma.account.findFirst({ where: { name: { contains: name } } });
    if (!existing) {
      console.log(`Adicionando conta detectada no SCR: ${name}`);
      await prisma.account.create({
        data: { name, type: 'BANK', color: '#6b7280' }
      });
    }
  }

  // 2. IMPORTAR DÍVIDAS VENCIDAS (SCR)
  console.log("\nRegistrando dívidas vencidas do SCR...");
  for (const item of scrLatest.detalhes) {
    if (item.vencido && item.vencido > 0) {
      const desc = `Dívida SCR - ${item.instituicao} (${item.produto || 'Crédito'})`;
      const existing = await prisma.debt.findFirst({ where: { description: desc } });
      
      if (!existing) {
        console.log(`Criando dívida vencida: ${desc} - R$ ${item.vencido}`);
        await prisma.debt.create({
          data: {
            description: desc,
            totalAmount: item.vencido,
            paidAmount: 0,
            dueDate: new Date('2025-11-30') // Mês de referência do SCR
          }
        });
      }
    }
  }

  // 3. CONFERÊNCIA FISCAL (DARF)
  const darf = dossier.situacao_fiscal_rfb_pgfn.diagnostico_receita_federal.documento_arrecadacao_emitido;
  if (darf) {
    const desc = `DARF ${darf.periodo_apuracao} - ${darf.numero_documento}`;
    const existing = await prisma.debt.findFirst({ where: { description: { contains: darf.numero_documento } } });
    if (!existing) {
      console.log(`Adicionando DARF pendente: ${desc}`);
      await prisma.debt.create({
        data: {
          description: desc,
          totalAmount: darf.valor_total,
          paidAmount: 0,
          dueDate: new Date(darf.vencimento_guia.split('/').reverse().join('-'))
        }
      });
    }
  }

  console.log("\n--- CONSOLIDAÇÃO CONCLUÍDA ---");
}

consolidateFinalData().catch(console.error).finally(() => prisma.$disconnect());

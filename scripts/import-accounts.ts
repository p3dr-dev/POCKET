import { PrismaClient, AccountType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function getAccountType(name: string): AccountType {
  const n = name.toLowerCase();
  if (n.includes('cartao') || n.includes('card') || n.includes('digio')) return 'CREDIT_CARD';
  if (n.includes('dinheiro')) return 'CASH';
  return 'BANK';
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function importAccountsAndDebts() {
  const filePath = path.join(process.cwd(), 'dados3.txt');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);
  
  // 1. IMPORTAR CONTAS BANCÁRIAS
  const accounts = data.relatorio_consolidado_arquivos_adicionais.sistema_financeiro_nacional.relacionamento_bancario_ccs;
  const activeAccounts = accounts.filter((acc: any) => !acc.fim || new Date(acc.fim.split('/').reverse().join('-')) > new Date());

  console.log(`Encontradas ${activeAccounts.length} contas ativas para importar.`);

  for (const acc of activeAccounts) {
    // Normalizar nome: "00.360.305-CAIXA ECONOMICA FEDERAL" -> "CAIXA ECONOMICA FEDERAL"
    const name = acc.instituicao.split('-').slice(1).join('-').trim();
    
    const existing = await prisma.account.findFirst({
        where: { name: { contains: name } }
    });

    if (!existing) {
        console.log(`Criando conta: ${name}`);
        await prisma.account.create({
            data: {
                name: name,
                type: getAccountType(name),
                color: getRandomColor()
            }
        });
    } else {
        console.log(`Conta já existe: ${name}`);
    }
  }

  // 2. IMPORTAR DÍVIDAS FISCAIS (PGFN + DARF)
  console.log("\nProcessando Dívidas Fiscais...");
  
  // Dívida Ativa PGFN
  const divAtiva = data.relatorio_consolidado_arquivos_adicionais.situacao_fiscal_receita_federal.diagnostico_fiscal.divida_ativa_pgfn;
  if (divAtiva) {
      // Valor não está explícito neste JSON, vou usar o do dados1.txt se necessário ou um valor estimado se não tiver.
      // O dados1.txt tinha R$ 1.783,67. Vamos usar esse conhecimento prévio ou checar se existe no banco.
      // Vou buscar pelo nome da inscrição.
      const desc = `Dívida Ativa PGFN - ${divAtiva.inscricao}`;
      const existingDebt = await prisma.debt.findFirst({
          where: { description: desc }
      });

      if (!existingDebt) {
          console.log(`Criando Dívida Ativa: ${desc}`);
          await prisma.debt.create({
              data: {
                  description: desc,
                  totalAmount: 1783.67, // Valor consolidado do dados1.txt
                  dueDate: new Date('2026-12-31'),
                  paidAmount: 0
              }
          });
      }
  }

  // DARFs
  const darfs = data.relatorio_consolidado_arquivos_adicionais.situacao_fiscal_receita_federal.documentos_arrecadacao_emitidos;
  for (const darf of darfs) {
      const desc = `DARF ${darf.codigo_receita} - ${darf.descricao} (${darf.periodo_apuracao || 'Multa'})`;
      const existingDarf = await prisma.debt.findFirst({
          where: { description: desc }
      });

      if (!existingDarf) {
          console.log(`Criando Dívida DARF: ${desc}`);
          await prisma.debt.create({
              data: {
                  description: desc,
                  totalAmount: darf.valor_total,
                  dueDate: new Date(darf.data_limite_pagamento_guia.split('/').reverse().join('-')),
                  paidAmount: 0
              }
          });
      }
  }
}

importAccountsAndDebts().catch(console.error).finally(() => prisma.$disconnect());

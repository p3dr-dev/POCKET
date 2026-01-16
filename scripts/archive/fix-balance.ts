import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixBalances() {
  const ownerName = "PEDRO AUGUSTO DE OLIVEIRA SIMOES";
  
  console.log("--- INICIANDO CORREÇÃO DE SALDO ---");

  // Buscar todas as transações de ENTRADA onde o PAGADOR sou EU
  const wrongIncomes = await prisma.transaction.findMany({
    where: {
      type: 'INCOME',
      payer: {
        contains: 'PEDRO', 
      }
    }
  });

  console.log(`Encontrados ${wrongIncomes.length} falsos recebimentos.`);

  for (const tx of wrongIncomes) {
    // Verificar se é realmente o dono
    if (tx.payer && tx.payer.toUpperCase().includes("PEDRO AUGUSTO")) {
       console.log(`Corrigindo: ${tx.amount} (ID: ${tx.id}) -> EXPENSE`);
       
       await prisma.transaction.update({
         where: { id: tx.id },
         data: {
           type: 'EXPENSE',
           description: tx.description.replace('Pix de', 'Envio para').replace('Recebido de', 'Envio para')
         }
       });
    }
  }

  console.log("--- CORREÇÃO CONCLUÍDA ---");
}

fixBalances().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function removeAdjustment() {
  const accountId = '1hcteuffbiej'; // PicPay

  // Buscar transação de ajuste
  const adjustment = await prisma.transaction.findFirst({
    where: {
      accountId: accountId,
      description: {
        contains: "Saldo Inicial / Ajuste de Importação"
      }
    }
  });

  if (adjustment) {
    console.log(`Removendo ajuste de R$ ${adjustment.amount}...`);
    await prisma.transaction.delete({
      where: { id: adjustment.id }
    });
    console.log("Ajuste removido com sucesso.");
  } else {
    console.log("Nenhum ajuste artificial encontrado.");
  }

  // Recalcular saldo
  const income = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId, type: 'INCOME' }
  });
  
  const expense = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId, type: 'EXPENSE' }
  });

  const balance = (income._sum.amount || 0) - (expense._sum.amount || 0);
  console.log(`Saldo Atual (Baseado apenas nos extratos): R$ ${balance.toFixed(2)}`);
}

removeAdjustment().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addBalanceAdjustment() {
  const accountId = '1hcteuffbiej'; // PicPay
  
  // Calcular saldo atual exato
  const income = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId, type: 'INCOME' }
  });
  
  const expense = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { accountId, type: 'EXPENSE' }
  });

  const totalIncome = income._sum.amount || 0;
  const totalExpense = expense._sum.amount || 0;
  const currentBalance = totalIncome - totalExpense;

  console.log(`Saldo Atual: ${currentBalance}`);

  if (currentBalance < 0) {
    const adjustmentNeeded = Math.abs(currentBalance) + 1000; // Deixar 1000 positivo
    console.log(`Adicionando ajuste de: ${adjustmentNeeded}`);

    await prisma.transaction.create({
      data: {
        description: "Saldo Inicial / Ajuste de Importação",
        amount: adjustmentNeeded,
        date: new Date('2019-01-01').toISOString(), // Data bem antiga
        type: 'INCOME',
        accountId: accountId,
        categoryId: (await prisma.category.findFirst({ where: { name: 'Outros' } }))?.id || '',
        externalId: "ADJUST_BALANCE_" + Date.now()
      }
    });
    console.log("Ajuste realizado.");
  }
}

addBalanceAdjustment().catch(console.error).finally(() => prisma.$disconnect());

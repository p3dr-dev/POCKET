import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
  const accountId = '1hcteuffbiej'; // PicPay

  // 1. Totais
  const totals = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId },
    _sum: { amount: true },
  });

  console.log("--- RESUMO DO SALDO ---");
  let balance = 0;
  totals.forEach(t => {
    console.log(`${t.type}: R$ ${t._sum.amount}`);
    if (t.type === 'INCOME') balance += t._sum.amount || 0;
    else balance -= t._sum.amount || 0;
  });
  console.log(`SALDO FINAL CALCULADO: R$ ${balance.toFixed(2)}`);

  // 2. Top 20 Maiores Entradas (Suspeitas?)
  const topIncomes = await prisma.transaction.findMany({
    where: { accountId, type: 'INCOME' },
    orderBy: { amount: 'desc' },
    take: 20
  });

  console.log("\n--- TOP 20 ENTRADAS (Verifique se há saídas aqui) ---");
  topIncomes.forEach(t => {
    console.log(`[${t.date.toISOString().split('T')[0]}] R$ ${t.amount.toFixed(2)} - ${t.description} (ID: ${t.externalId?.substring(0,10)})`);
  });
}

audit().catch(console.error).finally(() => prisma.$disconnect());

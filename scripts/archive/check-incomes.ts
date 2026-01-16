import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkIncomes() {
  const incomes = await prisma.transaction.findMany({
    where: { 
      type: 'INCOME',
      accountId: '1hcteuffbiej'
    },
    orderBy: { date: 'desc' }
  });

  const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
  
  console.log(`TOTAL DE ENTRADAS: R$ ${totalIncome.toFixed(2)}`);
  console.log(`QUANTIDADE: ${incomes.length}`);
  console.log("--- 10 MAIORES ENTRADAS ---");
  console.log(incomes.slice(0, 10).map(t => `${t.date.toISOString().split('T')[0]} - R$ ${t.amount} - ${t.description} (Payer: ${t.payer})`).join('\n'));
}

checkIncomes().catch(console.error).finally(() => prisma.$disconnect());

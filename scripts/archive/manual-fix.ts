import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function manualFix() {
  const targets = [
    { date: '2025-12-27', amount: 71.96 },
    { date: '2025-12-22', amount: 395.10 },
    { date: '2025-12-22', amount: 0.69 }
  ];

  for (const t of targets) {
    const tx = await prisma.transaction.findFirst({
        where: {
            amount: t.amount,
            date: {
                gte: new Date(`${t.date}T00:00:00.000Z`),
                lt: new Date(`${t.date}T23:59:59.999Z`),
            }
        }
    });

    if (tx) {
        console.log(`Corrigindo ${t.date} - R$ ${t.amount} para INCOME (Aporte)`);
        await prisma.transaction.update({
            where: { id: tx.id },
            data: { 
                type: 'INCOME',
                description: `Aporte de PEDRO AUGUSTO DE OLIVEIRA SIMÕES`
            }
        });
    } else {
        console.log(`Não encontrou: ${t.date} - R$ ${t.amount}`);
    }
  }
}

manualFix().catch(console.error).finally(() => prisma.$disconnect());

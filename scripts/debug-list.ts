import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugDate() {
  const txs = await prisma.transaction.findMany({
    where: {
        date: {
            gte: new Date('2025-12-20T00:00:00.000Z'),
            lt: new Date('2025-12-30T23:59:59.999Z'),
        }
    }
  });
  console.log(JSON.stringify(txs, null, 2));
}

debugDate().catch(console.error).finally(() => prisma.$disconnect());

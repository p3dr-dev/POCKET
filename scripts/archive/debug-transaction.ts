import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
  // Transação suspeita: R$ 2661.02 em 07/10/2025
  const tx = await prisma.transaction.findFirst({
    where: { 
      amount: 2661.02 
    }
  });

  console.log("TRANSAÇÃO SUSPEITA:");
  console.log(JSON.stringify(tx, null, 2));
}

debug().catch(console.error).finally(() => prisma.$disconnect());

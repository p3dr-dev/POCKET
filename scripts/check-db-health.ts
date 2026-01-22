import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Database Health...');
  const start = Date.now();

  try {
    // 1. Connection Check
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection: OK');

    // 2. Count Records
    const [users, transactions, debts] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.debt.count()
    ]);

    console.log(`📊 Stats:
    - Users: ${users}
    - Transactions: ${transactions}
    - Debts: ${debts}
    `);

    // 3. Check for Anomalies (e.g., Transactions without Account)
    const orphans = await prisma.transaction.count({
      where: { accountId: { equals: '' } } // Assuming empty string as invalid, though relation prevents null
    });

    if (orphans > 0) {
      console.warn(`⚠️ Warning: Found ${orphans} orphan transactions!`);
    } else {
      console.log('✅ Integrity: OK (No orphans found)');
    }

    const duration = Date.now() - start;
    console.log(`🚀 Health Check completed in ${duration}ms`);

  } catch (error) {
    console.error('❌ Database Health Check Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

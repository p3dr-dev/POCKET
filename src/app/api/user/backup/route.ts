import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.user.id;

    const [accounts, categories, transactions, investments, debts, goals] = await Promise.all([
      prisma.$queryRaw`SELECT * FROM "Account" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Category" WHERE "userId" = ${userId}`,
      // Transactions are linked to Account, which is linked to User.
      // But Transaction doesn't have userId directly in my schema?
      // Let's check schema.
      // Schema: Transaction -> Account -> User.
      // So I need to join or filter by account ownership.
      // BUT, I can query by finding accounts first?
      // Or use a JOIN.
      // prisma.$queryRaw`SELECT t.* FROM "Transaction" t JOIN "Account" a ON t."accountId" = a.id WHERE a."userId" = ${userId}`
      prisma.$queryRaw`SELECT t.* FROM "Transaction" t JOIN "Account" a ON t."accountId" = a.id WHERE a."userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Investment" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Debt" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Goal" WHERE "userId" = ${userId}`
    ]);

    const data = {
      accounts,
      categories,
      transactions,
      investments,
      debts,
      goals,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}

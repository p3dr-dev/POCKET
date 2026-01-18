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

    const [accounts, categories, transactions, investments, debts, goals, recurring] = await Promise.all([
      prisma.$queryRaw`SELECT * FROM "Account" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Category" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Transaction" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Investment" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Debt" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "Goal" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT * FROM "RecurringTransaction" WHERE "userId" = ${userId}`
    ]);

    const data = {
      accounts,
      categories,
      transactions,
      investments,
      debts,
      goals,
      recurring,
      exportDate: new Date().toISOString(),
      version: '1.1'
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}

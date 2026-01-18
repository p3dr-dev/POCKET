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
      prisma.account.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.recurringTransaction.findMany({ where: { userId } })
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
      version: '1.2'
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}

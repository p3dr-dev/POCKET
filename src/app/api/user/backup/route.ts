import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [accounts, categories, transactions, investments, debts, goals] = await Promise.all([
      prisma.$queryRaw`SELECT * FROM Account`,
      prisma.$queryRaw`SELECT * FROM Category`,
      prisma.$queryRaw`SELECT * FROM "Transaction"`,
      prisma.$queryRaw`SELECT * FROM Investment`,
      prisma.$queryRaw`SELECT * FROM Debt`,
      prisma.$queryRaw`SELECT * FROM Goal`
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

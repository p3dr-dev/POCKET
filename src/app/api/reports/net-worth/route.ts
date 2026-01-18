import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);
    const userId = session.user.id;

    const months = [];
    const now = new Date();
    
    // 1. Obter os últimos 6 meses (do mês atual para trás)
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // Último dia do mês i
      months.push({
        date: d,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
        value: 0
      });
    }

    // 2. Para cada mês, calcular o saldo acumulado até aquela data
    const results = await Promise.all(months.map(async (m) => {
      const [incomeSum, expenseSum, investmentSum] = await Promise.all([
        prisma.transaction.aggregate({
          where: { 
            userId, 
            type: 'INCOME',
            date: { lte: m.date }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { 
            userId, 
            type: 'EXPENSE',
            date: { lte: m.date }
          },
          _sum: { amount: true }
        }),
        prisma.investment.aggregate({
          where: { 
            userId,
            createdAt: { lte: m.date }
          },
          _sum: { amount: true, currentValue: true }
        })
      ]);

      const balance = (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);
      const invTotal = investmentSum._sum.currentValue || investmentSum._sum.amount || 0;

      return {
        label: m.label,
        value: balance + invTotal
      };
    }));

    return NextResponse.json(results.reverse()); // Deixar cronológico
  } catch (error) {
    console.error('Net Worth Report Error:', error);
    return NextResponse.json([]);
  }
}

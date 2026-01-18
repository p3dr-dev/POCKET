import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('includeTransactions') === 'true';

    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true }
        },
        transactions: includeTransactions ? {
          select: { amount: true, type: true }
        } : false,
        investments: {
          select: { currentValue: true, amount: true }
        }
      }
    });

    // Calcular balanços programaticamente para evitar SQL puro instável
    const results = accounts.map(acc => {
      // @ts-ignore
      const balance = acc.transactions?.reduce((sum, t) => 
        t.type === 'INCOME' ? sum + t.amount : sum - t.amount, 0) || 0;
      
      const investmentTotal = acc.investments?.reduce((sum, i) => 
        sum + (i.currentValue || i.amount), 0) || 0;

      return {
        ...acc,
        balance,
        investmentTotal
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Accounts GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    // Criar conta usando Prisma Client
    const account = await prisma.account.create({
      data: {
        name: body.name,
        type: body.type,
        color: body.color || '#000000',
        userId: userId,
      }
    });

    // Se houver saldo inicial, criar transação de ajuste
    if (body.initialBalance && Number(body.initialBalance) !== 0) {
      const amount = Number(body.initialBalance);
      const type = amount > 0 ? 'INCOME' : 'EXPENSE';
      
      // Buscar ou criar categoria "Ajuste" usando Prisma Client
      let category = await prisma.category.findFirst({
        where: { name: 'Ajuste de Saldo', userId: userId }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Ajuste de Saldo',
            type: 'INCOME',
            userId: userId
          }
        });
      }

      await prisma.transaction.create({
        data: {
          description: 'Saldo Inicial',
          amount: Math.abs(amount),
          date: new Date(),
          type: type,
          categoryId: category.id,
          accountId: account.id,
          userId: userId
        }
      });
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Account Create Error Full:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      message: 'Erro ao criar conta', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

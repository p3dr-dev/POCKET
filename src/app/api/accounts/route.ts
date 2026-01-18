import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);
    const userId = session.user.id;

    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });

    const results = await Promise.all(accounts.map(async (acc) => {
      const [incomeSum, expenseSum, investmentSum] = await Promise.all([
        prisma.transaction.aggregate({
          where: { accountId: acc.id, userId, type: 'INCOME' },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { accountId: acc.id, userId, type: 'EXPENSE' },
          _sum: { amount: true }
        }),
        prisma.investment.aggregate({
          where: { accountId: acc.id, userId },
          _sum: { currentValue: true, amount: true }
        })
      ]);

      const balance = (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);
      const investmentTotal = investmentSum._sum.currentValue || investmentSum._sum.amount || 0;

      return {
        ...acc,
        balance,
        investmentTotal
      };
    }));

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
    
    // Validar se o usuário existe no banco para evitar P2003
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({ 
        message: 'Sessão inválida ou usuário não encontrado. Por favor, saia (Logout) e entre novamente no sistema.' 
      }, { status: 403 });
    }

    console.log('Attempting to create account for userId:', userId);

    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          name: body.name,
          type: body.type,
          color: body.color || '#000000',
          userId
        }
      });

      if (body.initialBalance && Number(body.initialBalance) !== 0) {
        const amount = Number(body.initialBalance);
        const type = amount > 0 ? 'INCOME' : 'EXPENSE';
        const categoryName = 'Ajuste de Saldo';

        let category = await tx.category.findUnique({
          where: { name_userId: { name: categoryName, userId } }
        });

        if (!category) {
          category = await tx.category.create({
            data: { name: categoryName, type: 'INCOME', userId }
          });
        }

        const now = new Date();
        const fingerprint = crypto.createHash('md5').update(`${now.toISOString()}|initial-balance|${acc.id}`).digest('hex');

        await tx.transaction.create({
          data: {
            description: 'Saldo Inicial',
            amount: Math.abs(amount),
            date: now,
            type,
            categoryId: category.id,
            accountId: acc.id,
            userId,
            externalId: fingerprint
          }
        });
      }

      return acc;
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Account Create Error:', error);
    return NextResponse.json({ 
      message: 'Erro ao criar conta', 
      details: error.message
    }, { status: 500 });
  }
}

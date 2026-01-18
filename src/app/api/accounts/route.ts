import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('includeTransactions') === 'true';
    const userId = session.user.id;

    const accounts: any[] = await prisma.$queryRaw`
      SELECT a.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction" t WHERE t."accountId" = a.id) as balance,
        (SELECT COALESCE(SUM("currentValue"), 0) FROM "Investment" i WHERE i."accountId" = a.id) as "investmentTotal"
      FROM "Account" a
      WHERE a."userId" = ${userId}
    `;

    if (!Array.isArray(accounts)) return NextResponse.json([]);

    if (includeTransactions) {
      const results = await Promise.all(accounts.map(async (acc) => {
        const txs: any[] = await prisma.$queryRaw`
          SELECT amount, type FROM "Transaction" WHERE "accountId" = ${acc.id} AND "userId" = ${userId}
        `;
        return { ...acc, transactions: txs || [] };
      }));
      return NextResponse.json(results);
    }

    return NextResponse.json(accounts);
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
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json({ 
      message: 'Erro ao criar conta', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

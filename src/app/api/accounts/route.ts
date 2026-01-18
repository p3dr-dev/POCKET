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

    // Fetch accounts with raw SQL
    const accounts: any[] = await prisma.$queryRaw`
      SELECT * FROM "Account" WHERE "userId" = ${userId} ORDER BY name ASC
    `;

    // Fetch transactions and investments to calculate balances
    // Doing this in separate raw queries to maintain control
    const transactions: any[] = await prisma.$queryRaw`
      SELECT "accountId", amount, type FROM "Transaction" WHERE "userId" = ${userId}
    `;

    const investments: any[] = await prisma.$queryRaw`
      SELECT "accountId", amount, "currentValue" FROM "Investment" WHERE "userId" = ${userId}
    `;

    // Calculate balances programmatically
    const results = accounts.map(acc => {
      const accTxs = transactions.filter(t => t.accountId === acc.id);
      const balance = accTxs.reduce((sum, t) => 
        t.type === 'INCOME' ? sum + t.amount : sum - t.amount, 0) || 0;
      
      const accInvs = investments.filter(i => i.accountId === acc.id);
      const investmentTotal = accInvs.reduce((sum, i) => 
        sum + (i.currentValue || i.amount), 0) || 0;

      return {
        ...acc,
        balance,
        investmentTotal,
        _count: { transactions: accTxs.length }
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
    const accountId = crypto.randomUUID();
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      INSERT INTO "Account" (id, name, type, color, "userId", "createdAt", "updatedAt")
      VALUES (${accountId}, ${body.name}, ${body.type}, ${body.color || '#000000'}, ${userId}, ${now}, ${now})
    `;

    // If there is an initial balance, create an adjustment transaction
    if (body.initialBalance && Number(body.initialBalance) !== 0) {
      const amount = Number(body.initialBalance);
      const type = amount > 0 ? 'INCOME' : 'EXPENSE';
      
      // Get or create "Ajuste de Saldo" category
      const categories: any[] = await prisma.$queryRaw`
        SELECT id FROM "Category" WHERE name = 'Ajuste de Saldo' AND "userId" = ${userId} LIMIT 1
      `;
      
      let categoryId: string;
      if (!categories || categories.length === 0) {
        categoryId = crypto.randomUUID().substring(0, 8);
        await prisma.$executeRaw`
          INSERT INTO "Category" (id, name, type, "userId")
          VALUES (${categoryId}, 'Ajuste de Saldo', 'INCOME', ${userId})
        `;
      } else {
        categoryId = categories[0].id;
      }

      const txId = crypto.randomUUID();
      const fingerprint = crypto.createHash('md5').update(`${now}|initial-balance|${accountId}`).digest('hex');

      await prisma.$executeRaw`
        INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "externalId", "createdAt", "updatedAt")
        VALUES (${txId}, 'Saldo Inicial', ${Math.abs(amount)}, ${now}, ${type}, ${categoryId}, ${accountId}, ${userId}, ${fingerprint}, ${now}, ${now})
      `;
    }

    return NextResponse.json({ id: accountId }, { status: 201 });
  } catch (error: any) {
    console.error('Account Create Error:', error);
    return NextResponse.json({ 
      message: 'Erro ao criar conta', 
      details: error.message
    }, { status: 500 });
  }
}

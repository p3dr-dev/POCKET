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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = session.user.id;

    await prisma.$executeRaw`
      INSERT INTO "Account" (id, name, type, color, "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.name}, ${body.type}, ${body.color || '#000000'}, ${userId}, ${now}, ${now})
    `;

    // Se houver saldo inicial, criar transação de ajuste
    if (body.initialBalance && Number(body.initialBalance) !== 0) {
      const txId = crypto.randomUUID();
      const amount = Number(body.initialBalance);
      const type = amount > 0 ? 'INCOME' : 'EXPENSE';
      
      // Buscar ou criar categoria "Ajuste"
      let categoryId: string;
      const categories: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = 'Ajuste de Saldo' AND "userId" = ${userId} LIMIT 1`;
      
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        categoryId = crypto.randomUUID().substring(0, 8);
        await prisma.$executeRaw`INSERT INTO "Category" (id, name, type, "userId") VALUES (${categoryId}, 'Ajuste de Saldo', 'INCOME', ${userId})`;
      }

      await prisma.$executeRaw`
        INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
        VALUES (${txId}, 'Saldo Inicial', ${Math.abs(amount)}, ${now}, ${type}, ${categoryId}, ${id}, ${userId}, ${now}, ${now})
      `;
    }

    return NextResponse.json({ id, name: body.name }, { status: 201 });
  } catch (error) {
    console.error('Raw Insert Error:', error);
    return NextResponse.json({ message: 'Erro ao criar conta no banco' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('includeTransactions') === 'true';

    const accounts: any[] = await prisma.$queryRaw`
      SELECT * FROM "Account" ORDER BY name ASC
    `;

    if (!Array.isArray(accounts)) return NextResponse.json([]);

    if (includeTransactions) {
      const results = await Promise.all(accounts.map(async (acc) => {
        // Escapando "Transaction"
        const txs: any[] = await prisma.$queryRaw`
          SELECT amount, type FROM "Transaction" WHERE accountId = ${acc.id}
        `;
        return { ...acc, transactions: txs || [] };
      }));
      return NextResponse.json(results);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      INSERT INTO "Account" (id, name, type, color, createdAt, updatedAt)
      VALUES (${id}, ${body.name}, ${body.type}, ${body.color}, ${now}, ${now})
    `;

    return NextResponse.json({ id, name: body.name }, { status: 201 });
  } catch (error) {
    console.error('Raw Insert Error:', error);
    return NextResponse.json({ message: 'Erro ao criar conta no banco' }, { status: 500 });
  }
}

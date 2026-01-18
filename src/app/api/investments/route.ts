import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const userId = session.user.id;
    const investments = await prisma.$queryRaw`
      SELECT i.*, a.name as "accountName"
      FROM "Investment" i
      LEFT JOIN "Account" a ON i."accountId" = a.id
      WHERE i."userId" = ${userId}
      ORDER BY i."createdAt" DESC
    `;

    return NextResponse.json(Array.isArray(investments) ? investments : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    // Validate Account Ownership
    const account: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${body.accountId} AND "userId" = ${userId} LIMIT 1`;
    if (!account || account.length === 0) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const investmentDate = body.date ? new Date(body.date).toISOString() : now;

    await prisma.$executeRaw`
      INSERT INTO "Investment" (id, name, type, amount, "currentValue", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.name}, ${body.type}, ${Number(body.amount)}, ${Number(body.currentValue || body.amount)}, ${body.accountId}, ${userId}, ${investmentDate}, ${now})
    `;

    // Criar transação de saída automática da conta bancária
    const txId = crypto.randomUUID();
    
    // Buscar categoria de investimentos ou criar se não existir
    const categories: any[] = await prisma.$queryRaw`
      SELECT id FROM "Category" WHERE name = 'Investimentos' AND type = 'EXPENSE' AND "userId" = ${userId} LIMIT 1
    `;
    
    let categoryId: string;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      categoryId = crypto.randomUUID().substring(0, 8);
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, type, "userId") 
        VALUES (${categoryId}, 'Investimentos', 'EXPENSE', ${userId})
      `;
    }

    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${txId}, ${`Aporte: ${body.name}`}, ${Math.abs(Number(body.amount))}, ${investmentDate}, 'EXPENSE', ${categoryId}, ${body.accountId}, ${userId}, ${now}, ${now})
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar investimento' }, { status: 500 });
  }
}


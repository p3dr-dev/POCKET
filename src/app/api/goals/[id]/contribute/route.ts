import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const { amount, accountId } = await request.json();
    const userId = session.user.id;
    const now = new Date().toISOString();

    if (!amount || !accountId) return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });

    // 0. Validate Account Ownership
    const accounts: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${accountId} AND "userId" = ${userId} LIMIT 1`;
    if (!accounts || accounts.length === 0) return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });

    // 1. Buscar o objetivo e a categoria
    const goals: any[] = await prisma.$queryRaw`SELECT * FROM "Goal" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1`;
    if (!goals || goals.length === 0) return NextResponse.json({ message: 'Objetivo não encontrado' }, { status: 404 });
    const goal = goals[0];

    // Buscar categoria de objetivos ou criar se não existir
    const categories: any[] = await prisma.$queryRaw`
      SELECT id FROM "Category" WHERE name = 'Objetivos' AND type = 'EXPENSE' AND "userId" = ${userId} LIMIT 1
    `;

    let categoryId: string;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      categoryId = crypto.randomUUID().substring(0, 8);
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, type, "userId") 
        VALUES (${categoryId}, 'Objetivos', 'EXPENSE', ${userId})
      `;
    }

    // 1. Atualizar o saldo da meta
    await prisma.$executeRaw`
      UPDATE "Goal" SET "currentAmount" = "currentAmount" + ${Number(amount)}, "updatedAt" = ${now} WHERE id = ${id} AND "userId" = ${userId}
    `;

    // 2. Criar transação de saída da conta
    const txId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${txId}, ${`Meta: ${goal.name}`}, ${Number(amount)}, ${now}, 'EXPENSE', ${categoryId}, ${accountId}, ${userId}, ${now}, ${now})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goal Contribution Error:', error);
    return NextResponse.json({ message: 'Erro ao processar aporte' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount, accountId } = await request.json();
    const now = new Date().toISOString();

    if (!amount || !accountId) return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });

    // 1. Buscar o objetivo e a categoria 'Objetivos' ou 'Outros'
    const [goal]: any[] = await prisma.$queryRaw`SELECT * FROM "Goal" WHERE id = ${id} LIMIT 1`;
    if (!goal) return NextResponse.json({ message: 'Objetivo não encontrado' }, { status: 404 });

    const [category]: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = 'Objetivos' OR name = 'Investimentos' LIMIT 1`;
    const categoryId = category?.id;

    // 2. Atualizar o valor acumulado do objetivo
    await prisma.$executeRaw`
      UPDATE "Goal" 
      SET "currentAmount" = "currentAmount" + ${Number(amount)}, "updatedAt" = ${now}::timestamp
      WHERE id = ${id}
    `;

    // 3. Criar a transação de saída na conta
    const txId = Math.random().toString(36).substring(2, 15);
    const txDate = `${new Date().toISOString().split('T')[0]}T12:00:00.000Z`;

    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "createdAt", "updatedAt")
      VALUES (${txId}, ${`Aporte Objetivo: ${goal.name}`}, ${Number(amount)}, ${txDate}::timestamp, 'EXPENSE'::"TransactionType", ${categoryId}, ${accountId}, ${now}::timestamp, ${now}::timestamp)
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goal Contribution Error:', error);
    return NextResponse.json({ message: 'Erro ao processar aporte' }, { status: 500 });
  }
}

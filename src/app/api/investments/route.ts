import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const investments = await prisma.$queryRaw`
      SELECT i.*, a.name as accountName 
      FROM "Investment" i 
      LEFT JOIN "Account" a ON i.accountId = a.id
      ORDER BY i.amount DESC
    `;
    return NextResponse.json(Array.isArray(investments) ? investments : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, amount, accountId } = body;
    const invId = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();

    // 1. Criar o Investimento
    await prisma.$executeRaw`
      INSERT INTO "Investment" (id, name, type, amount, currentValue, accountId, createdAt, updatedAt)
      VALUES (${invId}, ${name}, ${type}, ${Number(amount)}, ${Number(amount)}, ${accountId}, ${now}, ${now})
    `;

    // 2. Criar Transação Automática de Saída (para refletir a compra do ativo no saldo)
    const txId = Math.random().toString(36).substring(2, 15);
    const txDate = `${new Date().toISOString().split('T')[0]}T12:00:00.000Z`;
    
    // Buscar categoria 'Investimentos' ou fallback
    const categories: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = 'Investimentos' AND type = 'EXPENSE' LIMIT 1`;
    let categoryId = categories[0]?.id;

    if (!categoryId) {
      const catId = Math.random().toString(36).substring(2, 10);
      await prisma.$executeRaw`INSERT INTO "Category" (id, name, type) VALUES (${catId}, 'Investimentos', 'EXPENSE')`;
      categoryId = catId;
    }

    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, categoryId, accountId, createdAt, updatedAt)
      VALUES (${txId}, ${`Aporte: ${name}`}, ${Number(amount)}, ${txDate}, 'EXPENSE', ${categoryId}, ${accountId}, ${now}, ${now})
    `;

    return NextResponse.json({ id: invId }, { status: 201 });
  } catch (error) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar investimento e transação' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { amount, targetAccountId } = await request.json();
    const redeemAmount = Math.abs(Number(amount));

    if (!redeemAmount || !targetAccountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    // Buscar investimento
    const investments: any[] = await prisma.$queryRaw`
      SELECT * FROM "Investment" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `;

    if (!investments || investments.length === 0) return NextResponse.json({ message: 'Investimento não encontrado' }, { status: 404 });
    const investment = investments[0];

    const currentBalance = investment.currentValue || investment.amount;
    
    if (redeemAmount > currentBalance + 0.01) { // Pequena margem para ponto flutuante
      return NextResponse.json({ message: 'Saldo insuficiente' }, { status: 400 });
    }

    const ratio = redeemAmount / currentBalance;
    const costReduction = investment.amount * ratio;
    const newBalance = Math.max(0, currentBalance - redeemAmount);
    const newCost = Math.max(0, investment.amount - costReduction);

    // Buscar categoria de resgate ou criar se não existir
    const categories: any[] = await prisma.$queryRaw`
      SELECT id FROM "Category" WHERE name = 'Resgate' AND type = 'INCOME' AND "userId" = ${userId} LIMIT 1
    `;

    let categoryId: string;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      categoryId = crypto.randomUUID().substring(0, 8);
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, type, "userId") 
        VALUES (${categoryId}, 'Resgate', 'INCOME', ${userId})
      `;
    }

    const txId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${txId}, ${`Resgate: ${investment.name}`}, ${redeemAmount}, ${now}, 'INCOME', ${categoryId}, ${targetAccountId}, ${userId}, ${now}, ${now})
    `;

    // 1. Atualizar ou Deletar Investimento
    if (newBalance <= 0.01) {
      await prisma.$executeRaw`DELETE FROM "Investment" WHERE id = ${id} AND "userId" = ${userId}`;
    } else {
      await prisma.$executeRaw`
        UPDATE "Investment" 
        SET "currentValue" = ${newBalance}, amount = ${newCost}, "updatedAt" = ${now}
        WHERE id = ${id} AND "userId" = ${userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Redeem Error:', error);
    return NextResponse.json({ message: 'Erro ao resgatar', details: error.message }, { status: 500 });
  }
}
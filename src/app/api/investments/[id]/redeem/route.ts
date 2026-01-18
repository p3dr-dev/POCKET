import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, targetAccountId } = body;
    const redeemAmount = Math.abs(Number(amount));

    if (!redeemAmount || !targetAccountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;
    const txDate = body.date ? new Date(body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`) : new Date();

    const [investment, account] = await Promise.all([
      prisma.investment.findUnique({ where: { id, userId } }),
      prisma.account.findUnique({ where: { id: targetAccountId, userId } })
    ]);

    if (!investment) return NextResponse.json({ message: 'Investimento não encontrado' }, { status: 404 });
    if (!account) return NextResponse.json({ message: 'Conta de destino inválida' }, { status: 403 });

    const currentBalance = investment.currentValue || investment.amount;
    
    if (redeemAmount > currentBalance + 0.01) {
      return NextResponse.json({ message: 'Saldo insuficiente' }, { status: 400 });
    }

    const ratio = redeemAmount / currentBalance;
    const costReduction = investment.amount * ratio;
    const newBalance = Math.max(0, currentBalance - redeemAmount);
    const newCost = Math.max(0, investment.amount - costReduction);

    await prisma.$transaction(async (tx) => {
      let category = await tx.category.findUnique({
        where: { name_userId: { name: 'Resgate', userId } }
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: 'Resgate', type: 'INCOME', userId }
        });
      }

      await tx.transaction.create({
        data: {
          description: `Resgate: ${investment.name}`,
          amount: redeemAmount,
          date: txDate,
          type: 'INCOME',
          categoryId: category.id,
          accountId: targetAccountId,
          userId
        }
      });

      if (newBalance <= 0.01) {
        await tx.investment.delete({ where: { id, userId } });
      } else {
        await tx.investment.update({
          where: { id, userId },
          data: {
            currentValue: newBalance,
            amount: newCost
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Redeem Error:', error);
    return NextResponse.json({ message: 'Erro ao resgatar', details: error.message }, { status: 500 });
  }
}
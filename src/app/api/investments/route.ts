import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      include: { account: true },
      orderBy: { amount: 'desc' }
    });

    const formatted = investments.map(i => ({
      ...i,
      accountName: i.account.name
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { name, type, amount, currentValue, accountId, createTransaction } = body;

    if (!name || !amount || !accountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;

    // Usar transação para atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Criar Investimento
      await tx.investment.create({
        data: {
          name,
          type,
          amount: Number(amount),
          currentValue: Number(currentValue || amount),
          accountId,
          userId: userId
        }
      });

      // 2. Criar Transação de Saída (se solicitado)
      if (createTransaction) {
        let category = await tx.category.findFirst({
          where: { name: 'Investimentos', type: 'EXPENSE', userId: userId }
        });

        if (!category) {
          category = await tx.category.create({
            data: { name: 'Investimentos', type: 'EXPENSE', userId: userId }
          });
        }

        await tx.transaction.create({
          data: {
            description: `Aporte: ${name}`,
            amount: Number(amount),
            type: 'EXPENSE',
            date: new Date(),
            categoryId: category.id,
            accountId: accountId,
            userId: userId
          }
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar' }, { status: 500 });
  }
}


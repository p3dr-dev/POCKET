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
    const now = new Date();

    if (!amount || !accountId) return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });

    const [goal, account] = await Promise.all([
      prisma.goal.findUnique({ where: { id, userId } }),
      prisma.account.findUnique({ where: { id: accountId, userId } })
    ]);

    if (!goal) return NextResponse.json({ message: 'Objetivo não encontrado' }, { status: 404 });
    if (!account) return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      let category = await tx.category.findUnique({
        where: { name_userId: { name: 'Objetivos', userId } }
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: 'Objetivos', type: 'EXPENSE', userId }
        });
      }

      await tx.goal.update({
        where: { id, userId },
        data: { currentAmount: { increment: Number(amount) } }
      });

      await tx.transaction.create({
        data: {
          description: `Meta: ${goal.name}`,
          amount: Number(amount),
          date: now,
          type: 'EXPENSE',
          categoryId: category.id,
          accountId,
          userId
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Goal Contribution Error:', error);
    return NextResponse.json({ message: 'Erro ao processar aporte' }, { status: 500 });
  }
}

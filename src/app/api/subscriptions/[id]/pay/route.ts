import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, date, accountId } = body;
    const userId = session.user.id;

    const sub = await prisma.recurringTransaction.findUnique({
      where: { id, userId },
      include: { category: true, account: true }
    });

    if (!sub) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });

    // 1. Criar a transação real baseada no pagamento manual
    const transaction = await prisma.transaction.create({
      data: {
        description: `Pgto: ${sub.description}`,
        amount: Math.abs(Number(amount)),
        date: new Date(date),
        type: 'EXPENSE',
        categoryId: sub.categoryId,
        accountId: accountId || sub.accountId,
        userId,
        externalId: `MANUAL-SUB-${sub.id}-${new Date(date).toISOString().split('T')[0]}`
      }
    });

    // 2. Atualizar a assinatura para o próximo período (se tiver data)
    if (sub.nextRun) {
      const nextDate = new Date(sub.nextRun);
      if (sub.frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (sub.frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (sub.frequency === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await prisma.recurringTransaction.update({
        where: { id },
        data: { nextRun: nextDate }
      });
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Manual Sub Payment Error:', error);
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { subscriptionPaymentSchema } from '@/lib/validations';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    
    // 1. Validação Zod
    const validation = subscriptionPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }
    
    const { amount, date, accountId } = validation.data;
    const userId = session.user.id;

    const sub = await prisma.recurringTransaction.findUnique({
      where: { id, userId },
      include: { category: true, account: true }
    });

    if (!sub) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });

    // 2. Criar a transação real
    const transaction = await prisma.transaction.create({
      data: {
        description: `Pgto: ${sub.description}`,
        amount: Math.abs(amount),
        date: new Date(date),
        type: 'EXPENSE',
        categoryId: sub.categoryId,
        accountId: accountId || sub.accountId,
        userId,
        externalId: `MANUAL-SUB-${sub.id}-${new Date(date).toISOString().split('T')[0]}`
      }
    });

    // 3. Atualizar a assinatura para o próximo período (Lógica Robusta)
    if (sub.nextRun) {
      const currentNextRun = new Date(sub.nextRun);
      const nextDate = new Date(currentNextRun);
      
      if (sub.frequency === 'MONTHLY') {
        const expectedMonth = (nextDate.getMonth() + 1) % 12;
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Ajuste para não pular meses (ex: 31 Jan -> 28 Fev)
        if (nextDate.getMonth() !== expectedMonth) {
          nextDate.setDate(0);
        }
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

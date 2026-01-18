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
    const { amount, accountId } = body;

    if (!amount || !accountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;
    const txDate = body.date ? new Date(body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`) : new Date();

    // 1. Validar propriedade da dívida e conta
    const [debt, account] = await Promise.all([
      prisma.debt.findUnique({ where: { id, userId } }),
      prisma.account.findUnique({ where: { id: accountId, userId } })
    ]);

    if (!debt) return NextResponse.json({ message: 'Dívida não encontrada' }, { status: 404 });
    if (!account) return NextResponse.json({ message: 'Conta inválida' }, { status: 403 });

    // 2. Resolver categoria
    let category = await prisma.category.findUnique({
      where: { name_userId: { name: 'Dívidas', userId } }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Dívidas', type: 'EXPENSE', userId }
      });
    }

    // 3. Executar transação atômica (Prisma Transaction)
    await prisma.$transaction([
      prisma.debt.update({
        where: { id, userId },
        data: { paidAmount: { increment: Math.abs(Number(amount)) } }
      }),
      prisma.transaction.create({
        data: {
          description: `Pagamento: ${debt.description}`,
          amount: Math.abs(Number(amount)),
          date: txDate,
          type: 'EXPENSE',
          categoryId: category.id,
          accountId,
          userId
        }
      })
    ]);

    return NextResponse.json({ message: 'Pagamento processado com sucesso' });
  } catch (error: any) {
    console.error('Debt Pay Error:', error);
    return NextResponse.json({ message: 'Erro ao processar pagamento', details: error.message }, { status: 500 });
  }
}

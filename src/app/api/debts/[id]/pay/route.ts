import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, accountId, date } = body;

    if (!amount || !accountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Buscar ou criar categoria "Dívidas" / "Pagamentos"
    let category = await prisma.category.findFirst({
      where: { 
        userId: session.user.id,
        name: { in: ['Dívidas', 'Pagamentos', 'Contas'] }
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Pagamento de Dívidas',
          type: 'EXPENSE',
          userId: session.user.id
        }
      });
    }

    // 2. Buscar a dívida atual para pegar a descrição
    const debt = await prisma.debt.findUnique({
      where: { id, userId: session.user.id }
    });

    if (!debt) return NextResponse.json({ message: 'Dívida não encontrada' }, { status: 404 });

    // 3. Transação Atômica: Atualizar Dívida + Criar Transação
    await prisma.$transaction([
      // Atualiza a dívida somando o valor pago
      prisma.debt.update({
        where: { id },
        data: {
          paidAmount: { increment: amount }
        }
      }),
      // Cria a transação de saída
      prisma.transaction.create({
        data: {
          description: `Pagamento: ${debt.description}`,
          amount: Number(amount),
          type: 'EXPENSE',
          date: new Date(date),
          accountId: accountId,
          categoryId: category.id
        }
      })
    ]);

    return NextResponse.json({ message: 'Pagamento processado com sucesso' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Erro ao processar pagamento' }, { status: 500 });
  }
}

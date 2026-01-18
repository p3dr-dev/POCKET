import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    const [account, incomeSum, expenseSum] = await Promise.all([
      prisma.account.findUnique({
        where: { id, userId }
      }),
      prisma.transaction.aggregate({
        where: { accountId: id, userId, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { accountId: id, userId, type: 'EXPENSE' },
        _sum: { amount: true }
      })
    ]);

    if (!account) {
      return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });
    }

    const balance = (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);

    return NextResponse.json({
      ...account,
      balance
    });
  } catch (error) {
    console.error('Account GET Error:', error);
    return NextResponse.json({ message: 'Erro ao buscar conta' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const userId = session.user.id;

    await prisma.account.update({
      where: { id, userId },
      data: {
        name: body.name,
        type: body.type,
        color: body.color || '#000000'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar conta' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    // Verificar se existem transações vinculadas via Prisma Client
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id, userId }
    });

    if (transactionCount > 0) {
      return NextResponse.json({ 
        message: `Não é possível excluir esta conta: ela possui ${transactionCount} transações registradas.` 
      }, { status: 400 });
    }

    await prisma.account.delete({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account DELETE Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir conta' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const userId = session.user.id;
    const amount = Math.abs(Number(body.amount));
    const currentValue = body.currentValue ? Math.abs(Number(body.currentValue)) : amount;

    await prisma.investment.update({
      where: { id, userId },
      data: {
        name: body.name,
        type: body.type,
        amount: amount,
        currentValue: currentValue,
        accountId: body.accountId
      }
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Investment PUT Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar investimento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    
    await prisma.investment.delete({
      where: { id, userId }
    });

    return NextResponse.json({ message: 'Excluído' });
  } catch (error) {
    console.error('Investment DELETE Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const userId = session.user.id;

    const sub = await prisma.recurringTransaction.update({
      where: { id, userId },
      data: {
        description: body.description,
        amount: body.amount !== undefined ? Math.abs(Number(body.amount)) : undefined,
        active: body.active,
        nextRun: body.nextRun ? new Date(body.nextRun) : undefined
      }
    });

    return NextResponse.json(sub);
  } catch (error) {
    console.error('Subscription PATCH Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    
    await prisma.recurringTransaction.delete({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription DELETE Error:', error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}

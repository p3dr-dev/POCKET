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
    
    let dueDate = null;
    if (body.dueDate) {
      const dateStr = body.dueDate.includes('T') ? body.dueDate : `${body.dueDate}T12:00:00.000Z`;
      dueDate = new Date(dateStr);
    }

    await prisma.debt.update({
      where: { id, userId },
      data: {
        description: body.description,
        totalAmount: Math.abs(Number(body.totalAmount)),
        paidAmount: Math.abs(Number(body.paidAmount)),
        dueDate
      }
    });

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar dívida' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAllInGroup = searchParams.get('all') === 'true';
    const userId = session.user.id;

    if (deleteAllInGroup) {
      const debt = await prisma.debt.findUnique({ where: { id, userId } });
      if (debt?.groupId) {
        await prisma.debt.deleteMany({
          where: { groupId: debt.groupId, userId }
        });
        return NextResponse.json({ message: 'Grupo excluído' });
      }
    }

    await prisma.debt.delete({
      where: { id, userId }
    });
    
    return NextResponse.json({ message: 'Excluída' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

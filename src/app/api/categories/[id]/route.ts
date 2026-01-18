import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, monthlyLimit } = await request.json();
    const userId = session.user.id;

    const category = await prisma.category.update({
      where: { id, userId },
      data: {
        name,
        monthlyLimit: monthlyLimit ? Number(monthlyLimit) : null
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar categoria' }, { status: 500 });
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

    // Verificar se tem transações via Prisma Client
    const usageCount = await prisma.transaction.count({
      where: { categoryId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({ 
        message: 'Não é possível excluir: Esta categoria está em uso por transações.' 
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir categoria' }, { status: 500 });
  }
}

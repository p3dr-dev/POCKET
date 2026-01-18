import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    // Verificar se tem transações
    const counts: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Transaction" WHERE "categoryId" = ${id}
    `;
    const usageCount = Number(counts[0]?.count || 0);

    if (usageCount > 0) {
      return NextResponse.json({ 
        message: 'Não é possível excluir: Esta categoria está em uso por transações.' 
      }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM "Category" WHERE id = ${id} AND "userId" = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir categoria' }, { status: 500 });
  }
}

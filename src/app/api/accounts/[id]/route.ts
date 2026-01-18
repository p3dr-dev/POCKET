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

    const account: any = await prisma.$queryRaw`
      SELECT a.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction" t WHERE t."accountId" = a.id) as balance
      FROM "Account" a
      WHERE a.id = ${id} AND a."userId" = ${session.user.id}
      LIMIT 1
    `;

    if (!account || account.length === 0) {
      return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar conta' }, { status: 500 });
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

    await prisma.account.delete({
      where: { id, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir conta' }, { status: 500 });
  }
}
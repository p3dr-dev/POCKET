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
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      UPDATE "Account" 
      SET name = ${body.name}, type = ${body.type}, color = ${body.color || '#000000'}, "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
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

    // Verificar se existem transações vinculadas
    const counts: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Transaction" WHERE "accountId" = ${id} AND "userId" = ${userId}
    `;
    const transactionCount = Number(counts[0]?.count || 0);

    if (transactionCount > 0) {
      return NextResponse.json({ 
        message: `Não é possível excluir esta conta: ela possui ${transactionCount} transações registradas.` 
      }, { status: 400 });
    }

    await prisma.$executeRaw`DELETE FROM "Account" WHERE id = ${id} AND "userId" = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir conta' }, { status: 500 });
  }
}
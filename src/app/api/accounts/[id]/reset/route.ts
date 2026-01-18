import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    
    // Validar se a conta pertence ao usuário antes de resetar
    const account: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1`;
    if (!account || account.length === 0) {
      return NextResponse.json({ message: 'Conta não encontrada ou não autorizada' }, { status: 404 });
    }

    // Apagar todas as transações vinculadas a esta conta e ao usuário
    await prisma.$executeRaw`DELETE FROM "Transaction" WHERE "accountId" = ${id} AND "userId" = ${userId}`;

    return NextResponse.json({ message: 'Conta zerada com sucesso' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao zerar conta' }, { status: 500 });
  }
}

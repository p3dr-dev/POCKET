import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = session.user.id;

    // Verificar se é admin ou se é o único usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
        const count = await prisma.user.count();
        if (count > 1) return NextResponse.json({ error: 'Apenas admin pode fazer isso' }, { status: 403 });
    }

    // Vincular tudo ao usuário atual usando transação atômica do Prisma Client
    await prisma.$transaction([
      prisma.account.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.category.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.transaction.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.debt.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.goal.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.investment.updateMany({ where: { userId: null }, data: { userId } }),
    ]);

    return NextResponse.json({ success: true, message: 'Todos os dados foram vinculados à sua conta.' });
  } catch (error: any) {
    console.error('Claim Data Error:', error);
    return NextResponse.json({ error: 'Erro ao vincular dados: ' + error.message }, { status: 500 });
  }
}

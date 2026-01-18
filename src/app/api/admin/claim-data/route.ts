import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const userId = session.user.id;

    // Verificar se é admin (opcional, mas recomendado)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
        // Se não for admin, só permite se não houver outros usuários (segurança)
        const count = await prisma.user.count();
        if (count > 1) return NextResponse.json({ error: 'Apenas admin pode fazer isso' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
        // Vincular tudo ao usuário atual
        await tx.account.updateMany({ data: { userId } });
        await tx.category.updateMany({ data: { userId } });
        await tx.transaction.updateMany({ data: { userId } });
        await tx.debt.updateMany({ data: { userId } });
        await tx.goal.updateMany({ data: { userId } });
        await tx.investment.updateMany({ data: { userId } });
        await tx.recurringTransaction.updateMany({ data: { userId } });
    });

    return NextResponse.json({ success: true, message: 'Todos os dados foram vinculados à sua conta.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao vincular dados: ' + error.message }, { status: 500 });
  }
}

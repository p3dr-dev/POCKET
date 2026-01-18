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
    const usersRes: any[] = await prisma.$queryRaw`SELECT role FROM "User" WHERE id = ${userId} LIMIT 1`;
    const userRole = usersRes[0]?.role;

    if (userRole !== 'ADMIN') {
        const counts: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
        const count = Number(counts[0]?.count || 0);
        if (count > 1) return NextResponse.json({ error: 'Apenas admin pode fazer isso' }, { status: 403 });
    }

    // Vincular tudo ao usuário atual (Sem transação cliente)
    await prisma.$executeRaw`UPDATE "Account" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "Category" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "Transaction" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "Debt" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "Goal" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "Investment" SET "userId" = ${userId}`;
    await prisma.$executeRaw`UPDATE "RecurringTransaction" SET "userId" = ${userId}`;

    return NextResponse.json({ success: true, message: 'Todos os dados foram vinculados à sua conta.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao vincular dados: ' + error.message }, { status: 500 });
  }
}

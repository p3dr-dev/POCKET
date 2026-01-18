import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Verifica se é admin
    const usersRes: any[] = await prisma.$queryRaw`SELECT role FROM "User" WHERE id = ${session.user.id} LIMIT 1`;
    const userRole = usersRes[0]?.role;
    
    if (userRole !== 'ADMIN') {
       return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users: any[] = await prisma.$queryRaw`
      SELECT 
        u.id, u.name, u.email, u.role, u."createdAt",
        (SELECT COUNT(*) FROM "Account" a WHERE a."userId" = u.id) as "accountsCount",
        (SELECT COUNT(*) FROM "Transaction" t WHERE t."userId" = u.id) as "transactionsCount"
      FROM "User" u
      ORDER BY u."createdAt" DESC
    `;

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

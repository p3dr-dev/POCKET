import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
       return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatar para manter compatibilidade com o frontend
    const formatted = users.map(u => ({
      ...u,
      accountsCount: u._count.accounts,
      transactionsCount: u._count.transactions
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Admin Users Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

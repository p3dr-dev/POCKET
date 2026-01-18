import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ name: 'Usuário', status: 'Não autorizado' });
    
    const userId = session.user.id;

    // Buscar dados do usuário e agregar saldos
    const [user, incomeSum, expenseSum] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: { select: { accounts: true } }
        }
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true }
      })
    ]);

    if (!user) {
      return NextResponse.json({ 
        name: 'Sessão Expirada', 
        status: 'Por favor, faça login novamente' 
      });
    }

    const balance = (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0);

    return NextResponse.json({
      name: user.name || 'Usuário',
      status: balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo',
      accountCount: user._count.accounts,
      level: balance > 10000 ? 'Elite' : 'Premium'
    });
  } catch (error) {
    console.error('User GET Error:', error);
    return NextResponse.json({ name: 'Usuário', status: 'Erro ao carregar' });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const userId = session.user.id;

    // O Prisma deletará tudo automaticamente devido ao onDelete: Cascade no schema.prisma
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true, message: 'Conta e dados excluídos com sucesso' });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
  }
}

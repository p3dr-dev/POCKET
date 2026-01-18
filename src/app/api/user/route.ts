import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ name: 'Usuário', status: 'Não autorizado' });
    
    const userId = session.user.id;

    // Buscar dados reais do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: { select: { id: true } },
        transactions: { select: { amount: true, type: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        name: 'Sessão Expirada', 
        status: 'Por favor, faça login novamente' 
      });
    }

    const balance = user.transactions.reduce((sum, t) => 
      t.type === 'INCOME' ? sum + t.amount : sum - t.amount, 0) || 0;

    return NextResponse.json({
      name: user.name || 'Usuário',
      status: balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo',
      accountCount: user.accounts.length,
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

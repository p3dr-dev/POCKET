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
    const users: any[] = await prisma.$queryRaw`SELECT name FROM "User" WHERE id = ${userId} LIMIT 1`;
    const accounts: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE "userId" = ${userId}`;
    
    const transactions: any[] = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as balance
      FROM "Transaction"
      WHERE "userId" = ${userId}
    `;

    const balance = Number(transactions[0]?.balance || 0);

    return NextResponse.json({
      name: users[0]?.name || 'Usuário',
      status: balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo',
      accountCount: accounts.length,
      level: balance > 10000 ? 'Elite' : 'Premium'
    });
  } catch (error) {
    return NextResponse.json({ name: 'Usuário', status: 'Erro ao carregar' });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const userId = session.user.id;

    // Excluir todos os dados vinculados ao usuário em ordem de dependência (Raw SQL)
    await prisma.$executeRaw`DELETE FROM "Transaction" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "RecurringTransaction" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "Investment" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "Debt" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "Goal" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "Account" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "Category" WHERE "userId" = ${userId}`;
    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${userId}`;

    return NextResponse.json({ success: true, message: 'Conta e dados excluídos com sucesso' });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Buscar total de contas e saldo líquido real
    const accounts: any[] = await prisma.$queryRaw`SELECT id FROM Account`;
    
    const transactions: any[] = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as balance
      FROM "Transaction"
    `;

    const balance = transactions[0]?.balance || 0;

    return NextResponse.json({
      name: 'Pedro Simões', // Nome real do proprietário (pode ser configurável depois)
      status: balance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo',
      accountCount: accounts.length,
      level: balance > 10000 ? 'Elite' : 'Premium'
    });
  } catch (error) {
    return NextResponse.json({ name: 'Usuário', status: 'Carregando...' });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Apagar todas as transações vinculadas a esta conta
    await prisma.$executeRaw`DELETE FROM "Transaction" WHERE "accountId" = ${id}`;

    return NextResponse.json({ message: 'Conta zerada com sucesso' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao zerar conta' }, { status: 500 });
  }
}

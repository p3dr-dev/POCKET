import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Nenhum ID fornecido' }, { status: 400 });
    }

    const userId = session.user.id;
    
    // Deletar transações em massa filtrando pelo userId para segurança total
    await prisma.$executeRaw`
      DELETE FROM "Transaction" 
      WHERE id IN (${Prisma.join(ids)}) AND "userId" = ${userId}
    `;

    return NextResponse.json({ message: `${ids.length} transações excluídas` });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    return NextResponse.json({ message: 'Erro na exclusão em massa' }, { status: 500 });
  }
}

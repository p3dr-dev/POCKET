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
    
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids },
        userId
      }
    });

    return NextResponse.json({ message: `${result.count} transações excluídas` });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    return NextResponse.json({ message: 'Erro na exclusão em massa' }, { status: 500 });
  }
}

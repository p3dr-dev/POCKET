import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'IDs não fornecidos' }, { status: 400 });
    }

    const userId = session.user.id;

    const result = await prisma.debt.deleteMany({
      where: {
        id: { in: ids },
        userId
      }
    });

    return NextResponse.json({ success: true, message: `${result.count} compromissos excluídos` });
  } catch (error) {
    console.error('Bulk Delete Debt Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir compromissos' }, { status: 500 });
  }
}

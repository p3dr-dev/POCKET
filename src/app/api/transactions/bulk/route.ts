import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Nenhum ID fornecido' }, { status: 400 });
    }

    // Criar string de IDs para o SQL IN (ex: 'id1','id2')
    const idsString = ids.map(id => `'${id}'`).join(',');
    
    await prisma.$executeRawUnsafe(`DELETE FROM "Transaction" WHERE id IN (${idsString})`);

    return NextResponse.json({ message: `${ids.length} transações excluídas` });
  } catch (error) {
    return NextResponse.json({ message: 'Erro na exclusão em massa' }, { status: 500 });
  }
}

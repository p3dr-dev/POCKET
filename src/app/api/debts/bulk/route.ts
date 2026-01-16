import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'IDs não fornecidos' }, { status: 400 });
    }

    // SQLite doesn't support 'IN' with parameter arrays easily in $executeRaw, 
    // so we build the query or use a loop. Since it's local, a loop or joining strings is fine.
    // Given the "Regra de Ouro" to use raw SQL:
    await Promise.all(ids.map(id => 
      prisma.$executeRaw`DELETE FROM "Debt" WHERE id = ${id}`
    ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk Delete Debt Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir compromissos' }, { status: 500 });
  }
}

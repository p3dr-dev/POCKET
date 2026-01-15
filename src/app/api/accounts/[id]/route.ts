import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      UPDATE Account 
      SET name = ${body.name}, type = ${body.type}, color = ${body.color}, updatedAt = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ id, name: body.name });
  } catch (error) {
    console.error('Raw Update Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar conta' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Escapando "Transaction"
    const txs: any[] = await prisma.$queryRaw`
      SELECT id FROM "Transaction" WHERE accountId = ${id} LIMIT 1
    `;

    if (txs.length > 0) {
      return NextResponse.json({ message: 'Não é possível excluir conta com transações vinculadas' }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM Account WHERE id = ${id}
    `;
    
    return NextResponse.json({ message: 'Conta excluída' });
  } catch (error) {
    console.error('Raw Delete Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir conta' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      UPDATE "Investment" 
      SET name = ${body.name}, type = ${body.type}, amount = ${Number(body.amount)}, "currentValue" = ${Number(body.currentValue || body.amount)}, "accountId" = ${body.accountId}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar investimento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM "Investment" WHERE id = ${id}`;
    return NextResponse.json({ message: 'Excluído' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

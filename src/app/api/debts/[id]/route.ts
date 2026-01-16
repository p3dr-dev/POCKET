import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();
    
    let dueDate = null;
    if (body.dueDate) {
      const dateStr = body.dueDate.includes('T') ? body.dueDate : `${body.dueDate}T12:00:00.000Z`;
      dueDate = new Date(dateStr).toISOString();
    }

    await prisma.$executeRaw`
      UPDATE "Debt" 
      SET description = ${body.description}, "totalAmount" = ${Number(body.totalAmount)}, "paidAmount" = ${Number(body.paidAmount)}, "dueDate" = ${dueDate}, "updatedAt" = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar dívida' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM "Debt" WHERE id = ${id}`;
    return NextResponse.json({ message: 'Excluída' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

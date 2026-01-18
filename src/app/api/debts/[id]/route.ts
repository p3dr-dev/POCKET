import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const userId = session.user.id;
    const now = new Date().toISOString();
    
    let dueDate = null;
    if (body.dueDate) {
      const dateStr = body.dueDate.includes('T') ? body.dueDate : `${body.dueDate}T12:00:00.000Z`;
      dueDate = new Date(dateStr).toISOString();
    }

    await prisma.$executeRaw`
      UPDATE "Debt" 
      SET description = ${body.description}, "totalAmount" = ${Math.abs(Number(body.totalAmount))}, "paidAmount" = ${Math.abs(Number(body.paidAmount))}, "dueDate" = ${dueDate}, "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar dívida' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    await prisma.$executeRaw`DELETE FROM "Debt" WHERE id = ${id} AND "userId" = ${userId}`;
    return NextResponse.json({ message: 'Excluída' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

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
    
    const dateStr = body.deadline.includes('T') ? body.deadline : `${body.deadline}T12:00:00.000Z`;
    const deadline = new Date(dateStr).toISOString();

    await prisma.$executeRaw`
      UPDATE "Goal" 
      SET name = ${body.name}, "targetAmount" = ${Math.abs(Number(body.targetAmount))}, "currentAmount" = ${Math.abs(Number(body.currentAmount))}, deadline = ${deadline}, color = ${body.color}, "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar objetivo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    await prisma.$executeRaw`DELETE FROM "Goal" WHERE id = ${id} AND "userId" = ${userId}`;
    return NextResponse.json({ message: 'Excluído' });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}

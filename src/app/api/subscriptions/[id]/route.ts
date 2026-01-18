import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const userId = session.user.id;
    const now = new Date().toISOString();

    // Como o PATCH pode ser parcial, precisamos construir a query dinamicamente ou usar campos fixos.
    // Para simplificar e manter seguro, vamos focar nos campos editáveis.
    const updates: string[] = [];
    if (body.description !== undefined) updates.push(`description = '${body.description.replace(/'/g, "''")}'`);
    if (body.amount !== undefined) updates.push(`amount = ${Math.abs(Number(body.amount))}`);
    if (body.active !== undefined) updates.push(`active = ${body.active}`);
    if (body.nextRun !== undefined) updates.push(`"nextRun" = '${new Date(body.nextRun).toISOString()}'`);
    
    if (updates.length === 0) return NextResponse.json({ message: 'Nada para atualizar' });

    // Atualizar cada campo individualmente para garantir segurança máxima com $executeRaw parametrizado
    if (body.description !== undefined) {
      await prisma.$executeRaw`UPDATE "RecurringTransaction" SET description = ${body.description} WHERE id = ${id} AND "userId" = ${userId}`;
    }
    if (body.amount !== undefined) {
      await prisma.$executeRaw`UPDATE "RecurringTransaction" SET amount = ${Math.abs(Number(body.amount))} WHERE id = ${id} AND "userId" = ${userId}`;
    }
    if (body.active !== undefined) {
      await prisma.$executeRaw`UPDATE "RecurringTransaction" SET active = ${body.active} WHERE id = ${id} AND "userId" = ${userId}`;
    }
    if (body.nextRun !== undefined) {
      const nextRunDate = new Date(body.nextRun).toISOString();
      await prisma.$executeRaw`UPDATE "RecurringTransaction" SET "nextRun" = ${nextRunDate} WHERE id = ${id} AND "userId" = ${userId}`;
    }

    await prisma.$executeRaw`UPDATE "RecurringTransaction" SET "updatedAt" = ${now} WHERE id = ${id} AND "userId" = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    
    await prisma.$executeRaw`DELETE FROM "RecurringTransaction" WHERE id = ${id} AND "userId" = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}

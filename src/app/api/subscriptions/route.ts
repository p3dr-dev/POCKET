import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const subs = await prisma.recurringTransaction.findMany({
      where: { userId: session.user.id },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } }
      },
      orderBy: { nextRun: 'asc' }
    });

    return NextResponse.json(subs);
  } catch (error) {
    console.error('Subscriptions GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    const account = await prisma.account.findUnique({
      where: { id: body.accountId, userId }
    });
    if (!account) return NextResponse.json({ message: 'Conta inválida' }, { status: 403 });

    const category = await prisma.category.findUnique({
      where: { id: body.categoryId, userId }
    });
    if (!category) return NextResponse.json({ message: 'Categoria inválida' }, { status: 403 });

    const sub = await prisma.recurringTransaction.create({
      data: {
        description: body.description,
        amount: body.amount !== null ? Math.abs(Number(body.amount)) : null,
        type: body.type,
        frequency: body.frequency,
        nextRun: body.nextRun ? new Date(`${body.nextRun.split('T')[0]}T12:00:00.000Z`) : null,
        active: true,
        categoryId: body.categoryId,
        accountId: body.accountId,
        userId
      }
    });

    return NextResponse.json(sub, { status: 201 });
  } catch (error: any) {
    console.error('Subscriptions POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar assinatura', details: error.message }, { status: 500 });
  }
}

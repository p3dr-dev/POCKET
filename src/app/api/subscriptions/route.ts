import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const subs = await prisma.recurringTransaction.findMany({
      where: { userId: session.user.id },
      include: { category: true, account: true },
      orderBy: { amount: 'desc' }
    });

    return NextResponse.json(subs);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const sub = await prisma.recurringTransaction.create({
      data: { ...body, userId: session.user.id }
    });

    return NextResponse.json(sub);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
  }
}

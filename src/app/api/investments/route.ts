import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      include: {
        account: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error('Investments GET Error:', error);
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

    if (!account) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const investmentDate = body.date ? new Date(body.date) : new Date();

    const investment = await prisma.$transaction(async (tx) => {
      const inv = await tx.investment.create({
        data: {
          name: body.name,
          type: body.type,
          amount: Number(body.amount),
          currentValue: Number(body.currentValue || body.amount),
          accountId: body.accountId,
          userId,
          createdAt: investmentDate
        }
      });

      let category = await tx.category.findUnique({
        where: { name_userId: { name: 'Investimentos', userId } }
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: 'Investimentos', type: 'EXPENSE', userId }
        });
      }

      await tx.transaction.create({
        data: {
          description: `Aporte: ${body.name}`,
          amount: Math.abs(Number(body.amount)),
          date: investmentDate,
          type: 'EXPENSE',
          categoryId: category.id,
          accountId: body.accountId,
          userId,
          investmentId: inv.id // Link aqui
        }
      });

      return inv;
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error: any) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: 'Erro ao criar investimento', details: error.message }, { status: 500 });
  }
}


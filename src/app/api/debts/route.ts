import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { debtSchema } from '@/lib/validations';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const debts = await prisma.debt.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(debts);
  } catch (error) {
    console.error('Debts GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const validation = debtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    const { description, totalAmount, paidAmount, dueDate: dueDateStr, type, installmentsCount } = validation.data;

    const count = type === 'SINGLE' ? 1 : (installmentsCount || 1);
    const groupId = type !== 'SINGLE' ? crypto.randomUUID() : null;
    const debtsData = [];

    let initialDate: Date | null = null;
    if (dueDateStr) {
      const rawDate = dueDateStr.split('T')[0];
      initialDate = new Date(`${rawDate}T12:00:00.000Z`);
    }

    for (let i = 0; i < count; i++) {
      let dueDate: Date | null = null;
      if (initialDate) {
        dueDate = new Date(initialDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        // Ajuste robusto para fuso horário e meses curtos
        if (dueDate.getMonth() !== (initialDate.getMonth() + i) % 12) {
          dueDate.setDate(0);
        }
      }

      debtsData.push({
        description: count > 1 ? `${description} (${i + 1}/${count})` : description,
        totalAmount,
        paidAmount: i === 0 ? Math.abs(Number(paidAmount || 0)) : 0,
        dueDate,
        groupId,
        userId
      });
    }

    await prisma.debt.createMany({ data: debtsData });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Debts POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar dívida', details: error.message }, { status: 500 });
  }
}

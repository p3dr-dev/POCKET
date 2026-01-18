import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { 
      fromAccountId, 
      toAccountId, 
      amount, 
      date, 
      description,
      payee,
      payer,
      bankRefId,
      externalId 
    } = body;

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const transferId = Math.random().toString(36).substring(2, 15);
    const txDate = new Date(date);
    const cleanDesc = description || "Transferência entre contas";

    // Transação Atômica
    await prisma.$transaction(async (tx) => {
      // 1. Garantir Categoria
      let category = await tx.category.findFirst({
        where: { name: 'Transferências', userId: session.user.id }
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: 'Transferências', type: 'EXPENSE', userId: session.user.id }
        });
      }

      // 2. Verificar duplicidade (opcional)
      if (externalId) {
        const existing = await tx.transaction.findFirst({ where: { externalId } });
        if (existing) throw new Error('Transferência já registrada');
      }

      // 3. Criar Saída
      await tx.transaction.create({
        data: {
          description: `Saída: ${cleanDesc}`,
          amount: Number(amount),
          type: 'EXPENSE',
          date: txDate,
          categoryId: category.id,
          accountId: fromAccountId,
          transferId,
          payee,
          payer,
          bankRefId,
          externalId: externalId ? `${externalId}_out` : undefined
        }
      });

      // 4. Criar Entrada
      await tx.transaction.create({
        data: {
          description: `Entrada: ${cleanDesc}`,
          amount: Number(amount),
          type: 'INCOME',
          date: txDate,
          categoryId: category.id,
          accountId: toAccountId,
          transferId,
          payee,
          payer,
          bankRefId,
          externalId: externalId ? `${externalId}_in` : undefined
        }
      });
    });

    return NextResponse.json({ transferId }, { status: 201 });
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ message: 'Erro ao processar transferência', details: error.message }, { status: 500 });
  }
}
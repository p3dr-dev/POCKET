import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

import { transferSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();

    // 1. Validação com Zod
    const validation = transferSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Dados inválidos', 
        errors: validation.error.format() 
      }, { status: 400 });
    }

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
    } = validation.data;

    const userId = session.user.id;

    // Validate Account Ownership
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: [fromAccountId, toAccountId] },
        userId
      }
    });
    
    if (accounts.length < (fromAccountId === toAccountId ? 1 : 2)) {
      return NextResponse.json({ message: 'Uma ou ambas as contas são inválidas ou não pertencem ao usuário' }, { status: 403 });
    }

    const transferId = crypto.randomUUID();
    const txDateStr = (date || new Date().toISOString());
    const rawDate = txDateStr.split('T')[0];
    const isoDate = new Date(`${rawDate}T12:00:00.000Z`);
    
    const cleanDesc = description || "Transferência entre contas";
    const absAmount = Math.abs(Number(amount));

    try {
      // 1. Garantir Categoria
      let category = await prisma.category.findUnique({
        where: { name_userId: { name: 'Transferências', userId } }
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: 'Transferências', type: 'EXPENSE', userId }
        });
      }

      // 2. Verificar duplicidade (opcional)
      if (externalId) {
        const existing = await prisma.transaction.findFirst({
          where: { externalId, userId }
        });
        if (existing) throw new Error('Transferência já registrada');
      }

      // 3. Criar Saída e Entrada dentro de uma TRANSAÇÃO nativa
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            description: `Saída: ${cleanDesc}`,
            amount: absAmount,
            date: isoDate,
            type: 'EXPENSE',
            categoryId: category.id,
            accountId: fromAccountId,
            userId,
            transferId,
            payee: payee || null,
            payer: payer || null,
            bankRefId: bankRefId || null,
            externalId: externalId ? `${externalId}_out` : null
          }
        }),
        prisma.transaction.create({
          data: {
            description: `Entrada: ${cleanDesc}`,
            amount: absAmount,
            date: isoDate,
            type: 'INCOME',
            categoryId: category.id,
            accountId: toAccountId,
            userId,
            transferId,
            payee: payee || null,
            payer: payer || null,
            bankRefId: bankRefId || null,
            externalId: externalId ? `${externalId}_in` : null
          }
        })
      ]);

      return NextResponse.json({ transferId }, { status: 201 });
    } catch (dbError: any) {
      throw dbError;
    }
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ message: 'Erro ao processar transferência', details: error.message }, { status: 500 });
  }
}
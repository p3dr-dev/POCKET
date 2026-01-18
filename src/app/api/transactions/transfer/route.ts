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

    const userId = session.user.id;

    // Validate Account Ownership
    const accounts: any[] = await prisma.$queryRaw`
      SELECT id FROM "Account" WHERE id IN (${fromAccountId}, ${toAccountId}) AND "userId" = ${userId}
    `;
    
    if (!accounts || accounts.length < (fromAccountId === toAccountId ? 1 : 2)) {
      return NextResponse.json({ message: 'Uma ou ambas as contas são inválidas ou não pertencem ao usuário' }, { status: 403 });
    }

    const transferId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Garantir formato ISO correto para o banco
    const txDate = (body.date || now).includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const isoDate = new Date(txDate).toISOString();
    const cleanDesc = description || "Transferência entre contas";

    try {
      // 1. Garantir Categoria
      let categoryId: string;
      const categories: any[] = await prisma.$queryRaw`
        SELECT id FROM "Category" WHERE name = 'Transferências' AND "userId" = ${userId} LIMIT 1
      `;

      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        categoryId = crypto.randomUUID().substring(0, 8);
        await prisma.$executeRaw`
          INSERT INTO "Category" (id, name, type, "userId") 
          VALUES (${categoryId}, 'Transferências', 'EXPENSE', ${userId})
        `;
      }

      // 2. Verificar duplicidade (opcional)
      if (externalId) {
        const existing: any[] = await prisma.$queryRaw`SELECT id FROM "Transaction" WHERE "externalId" = ${externalId} AND "userId" = ${userId} LIMIT 1`;
        if (existing && existing.length > 0) throw new Error('Transferência já registrada');
      }

      const outId = crypto.randomUUID();
      const inId = crypto.randomUUID();

      // 3. Criar Saída e Entrada dentro de uma TRANSAÇÃO para garantir atomicidade
      const absAmount = Math.abs(Number(amount));

      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "transferId", payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt")
          VALUES (${outId}, ${`Saída: ${cleanDesc}`}, ${absAmount}, ${isoDate}, 'EXPENSE', ${categoryId}, ${fromAccountId}, ${userId}, ${transferId}, ${payee || null}, ${payer || null}, ${bankRefId || null}, ${externalId ? `${externalId}_out` : null}, ${now}, ${now})
        `;

        await tx.$executeRaw`
          INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "transferId", payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt")
          VALUES (${inId}, ${`Entrada: ${cleanDesc}`}, ${absAmount}, ${isoDate}, 'INCOME', ${categoryId}, ${toAccountId}, ${userId}, ${transferId}, ${payee || null}, ${payer || null}, ${bankRefId || null}, ${externalId ? `${externalId}_in` : null}, ${now}, ${now})
        `;
      });

      return NextResponse.json({ transferId }, { status: 201 });
    } catch (dbError: any) {
      throw dbError;
    }
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ message: 'Erro ao processar transferência', details: error.message }, { status: 500 });
  }
}
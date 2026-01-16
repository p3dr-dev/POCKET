import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    // Verificar duplicidade antes de processar
    if (externalId) {
      const existing: any[] = await prisma.$queryRaw`SELECT id FROM "Transaction" WHERE "externalId" = ${externalId} LIMIT 1`;
      if (existing.length > 0) {
        return NextResponse.json({ message: 'Esta transferência já foi registrada.' }, { status: 400 });
      }
    }

    const transferId = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    
    const dateStr = date.includes('T') ? date : `${date}T12:00:00.000Z`;
    const txDate = new Date(dateStr).toISOString();
    
    const cleanDesc = description || "Transferência entre contas";

    const categories: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = 'Outros' OR name = 'Transferência' LIMIT 1`;
    const categoryId = categories[0]?.id;

    // 1. Criar Transação de SAÍDA (Origem)
    const idOrigem = Math.random().toString(36).substring(2, 15);
    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "transferId", payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt")
      VALUES (${idOrigem}, ${'Saída: ' + cleanDesc}, ${Number(amount)}, ${txDate}::timestamp, 'EXPENSE'::"TransactionType", ${categoryId}, ${fromAccountId}, ${transferId}, ${payee || null}, ${payer || null}, ${bankRefId || null}, ${externalId ? externalId + '_out' : null}, ${now}::timestamp, ${now}::timestamp)
    `;

    // 2. Criar Transação de ENTRADA (Destino)
    const idDestino = Math.random().toString(36).substring(2, 15);
    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "transferId", payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt")
      VALUES (${idDestino}, ${'Entrada: ' + cleanDesc}, ${Number(amount)}, ${txDate}::timestamp, 'INCOME'::"TransactionType", ${categoryId}, ${toAccountId}, ${transferId}, ${payee || null}, ${payer || null}, ${bankRefId || null}, ${externalId ? externalId + '_in' : null}, ${now}::timestamp, ${now}::timestamp)
    `;

    return NextResponse.json({ transferId }, { status: 201 });
  } catch (error: any) {
    console.error('Transfer API Error:', error);
    return NextResponse.json({ message: 'Erro ao processar transferência', details: error.message }, { status: 500 });
  }
}
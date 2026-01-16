import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();
    const txDate = new Date(body.date).toISOString();

    await prisma.$executeRaw`
      UPDATE "Transaction" 
      SET 
        description = ${body.description}, 
        amount = ${Number(body.amount)}, 
        date = ${txDate}::timestamp, 
        type = ${body.type}::"TransactionType", 
        "categoryId" = ${body.categoryId}, 
        "accountId" = ${body.accountId}, 
        payee = ${body.payee || null},
        payer = ${body.payer || null},
        "bankRefId" = ${body.bankRefId || null},
        "updatedAt" = ${now}::timestamp
      WHERE id = ${id}
    `;

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('PUT Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao atualizar no banco', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM "Transaction" WHERE id = ${id}`;
    return NextResponse.json({ message: 'Transação excluída' });
  } catch (error: any) {
    console.error('DELETE Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}
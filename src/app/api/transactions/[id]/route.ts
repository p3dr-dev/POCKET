import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();
    
    // Garantir formato ISO correto para o banco
    const txDate = new Date(body.date).toISOString();

    // Validar propriedade antes de atualizar
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existing) return NextResponse.json({ message: 'Transação não encontrada' }, { status: 404 });

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
      WHERE id = ${id} AND "userId" = ${session.user.id}
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
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    // Deletar apenas se pertencer ao usuário
    const result: number = await prisma.$executeRaw`DELETE FROM "Transaction" WHERE id = ${id} AND "userId" = ${session.user.id}`;
    
    if (result === 0) {
       return NextResponse.json({ message: 'Transação não encontrada ou não autorizada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transação excluída' });
  } catch (error: any) {
    console.error('DELETE Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}
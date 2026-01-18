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
    const userId = session.user.id;
    
    // Garantir formato ISO correto para o banco
    const dateStr = body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const txDate = new Date(dateStr);

    // Validar propriedade e atualizar em uma única operação segura do Prisma
    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: {
        description: body.description,
        amount: Math.abs(Number(body.amount)),
        date: txDate,
        type: body.type,
        categoryId: body.categoryId,
        accountId: body.accountId,
        payee: body.payee || null,
        payer: body.payer || null,
        bankRefId: body.bankRefId || null
      }
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    if (error.code === 'P2025') {
       return NextResponse.json({ message: 'Transação não encontrada ou não autorizada' }, { status: 404 });
    }
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
    const userId = session.user.id;
    
    await prisma.transaction.delete({
      where: { id, userId }
    });

    return NextResponse.json({ message: 'Transação excluída' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       return NextResponse.json({ message: 'Transação não encontrada ou não autorizada' }, { status: 404 });
    }
    console.error('DELETE Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao excluir' }, { status: 500 });
  }
}
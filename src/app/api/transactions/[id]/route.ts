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
    
    // Garantir formato ISO correto para o banco (com fallback para 12:00 se não houver hora)
    const dateStr = body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const txDate = new Date(dateStr).toISOString();

    // Validar propriedade antes de atualizar
    const existing: any[] = await prisma.$queryRaw`
      SELECT id FROM "Transaction" WHERE id = ${id} AND "userId" = ${session.user.id} LIMIT 1
    `;

    if (!existing || existing.length === 0) return NextResponse.json({ message: 'Transação não encontrada' }, { status: 404 });

    const userId = session.user.id;

    // Validate Account Ownership if changed
    if (body.accountId) {
      const account: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${body.accountId} AND "userId" = ${userId} LIMIT 1`;
      if (!account || account.length === 0) {
        return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
      }
    }

    // Validate Category Ownership if changed
    if (body.categoryId) {
      const category: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE id = ${body.categoryId} AND "userId" = ${userId} LIMIT 1`;
      if (!category || category.length === 0) {
        return NextResponse.json({ message: 'Categoria inválida ou não encontrada' }, { status: 403 });
      }
    }

    await prisma.$executeRaw`
      UPDATE "Transaction" 
      SET 
        description = ${body.description}, 
        amount = ${Math.abs(Number(body.amount))}, 
        date = ${txDate}, 
        type = ${body.type}, 
        "categoryId" = ${body.categoryId}, 
        "accountId" = ${body.accountId}, 
        payee = ${body.payee || null},
        payer = ${body.payer || null},
        "bankRefId" = ${body.bankRefId || null},
        "updatedAt" = ${now}
      WHERE id = ${id} AND "userId" = ${userId}
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
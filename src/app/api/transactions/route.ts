import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        ...(accountId ? { accountId: accountId } : {})
      },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Transactions GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    
    // Basic Validation
    if (!body.description || !body.amount || !body.accountId) {
      return NextResponse.json({ message: 'Descrição, valor e conta são obrigatórios' }, { status: 400 });
    }

    // Validate Account Ownership
    const account = await prisma.account.findFirst({
      where: { id: body.accountId, userId: userId }
    });
    
    if (!account) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const dateStr = body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const txDate = new Date(dateStr);

    let categoryId = body.categoryId;

    if (categoryId === 'YIELD_AUTO' || !categoryId) {
      const type = categoryId === 'YIELD_AUTO' ? 'INCOME' : (body.type || 'EXPENSE');
      const categoryName = categoryId === 'YIELD_AUTO' ? 'Rendimentos' : 'Outros';
      
      let category = await prisma.category.findFirst({
        where: { name: categoryName, type: type, userId: userId }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            type: type,
            userId: userId
          }
        });
      }
      categoryId = category.id;
    } else {
      // Validate Category Ownership
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: userId }
      });
      if (!category) {
        return NextResponse.json({ message: 'Categoria inválida ou não encontrada' }, { status: 403 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: body.description,
        amount: Math.abs(Number(body.amount)),
        date: txDate,
        type: body.type,
        categoryId: categoryId,
        accountId: body.accountId,
        userId: userId,
        payee: body.payee || null,
        payer: body.payer || null,
        bankRefId: body.bankRefId || null,
        externalId: body.externalId || null
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json({ message: 'Este comprovante já foi importado anteriormente.' }, { status: 400 });
    }
    console.error('POST Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar no banco', details: error.message }, { status: 500 });
  }
}
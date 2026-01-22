import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { TransactionService } from '@/services/transaction.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ transactions: [], total: 0 });
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(type && type !== 'ALL' ? { type } : {}),
      ...(search ? {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
          { payee: { contains: search, mode: 'insensitive' } },
          { payer: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: { select: { name: true, color: true } },
          account: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Transactions GET Error:', error);
    return NextResponse.json({ transactions: [], total: 0 });
  }
}

import { transactionSchema } from '@/lib/validations';

// ... (GET method remains the same)

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    
    // 1. Validação com Zod
    const validation = transactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Dados inválidos', 
        errors: validation.error.format() 
      }, { status: 400 });
    }

    const data = validation.data;

    try {
      const transaction = await TransactionService.create({
        userId,
        ...data
      });
      return NextResponse.json(transaction, { status: 201 });
    } catch (err: any) {
      if (err.message === 'Conta inválida ou não encontrada' || err.message === 'Categoria inválida ou não encontrada') {
        return NextResponse.json({ message: err.message }, { status: 403 });
      }
      if (err.message === 'Esta transação já foi registrada anteriormente.') {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error: any) {
    console.error('POST Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar no banco', details: error.message }, { status: 500 });
  }
}
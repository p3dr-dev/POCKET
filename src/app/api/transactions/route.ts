import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    
    if (!body.description || !body.amount || !body.accountId) {
      return NextResponse.json({ message: 'Descrição, valor e conta são obrigatórios' }, { status: 400 });
    }

    // Normalização de Data p/ evitar erro de Timezone (Forçar Meio-dia UTC)
    const rawDate = body.date.split('T')[0];
    const txDate = new Date(`${rawDate}T12:00:00.000Z`);

    // Validar propriedade da conta
    const account = await prisma.account.findUnique({
      where: { id: body.accountId, userId }
    });
    
    if (!account) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    let categoryId = body.categoryId;

    // Resolução de categoria automática
    if (categoryId === 'YIELD_AUTO' || !categoryId) {
      const type = categoryId === 'YIELD_AUTO' ? 'INCOME' : (body.type || 'EXPENSE');
      const categoryName = categoryId === 'YIELD_AUTO' ? 'Rendimentos' : 'Outros';
      
      let category = await prisma.category.findUnique({
        where: { name_userId: { name: categoryName, userId } }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, type, userId }
        });
      }
      categoryId = category.id;
    } else {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, userId }
      });
      if (!category) {
        return NextResponse.json({ message: 'Categoria inválida ou não encontrada' }, { status: 403 });
      }
    }

    const amountVal = Math.abs(Number(body.amount)).toFixed(2);
    const fingerprintBase = `${txDate.toISOString().split('T')[0]}|${body.description.toLowerCase().trim()}|${amountVal}|${body.accountId}`;
    const generatedExternalId = body.externalId || crypto.createHash('md5').update(fingerprintBase).digest('hex');

    const existing = await prisma.transaction.findUnique({
      where: { externalId_accountId: { externalId: generatedExternalId, accountId: body.accountId } }
    });
    
    if (existing) {
      return NextResponse.json({ message: 'Esta transação já foi registrada anteriormente.' }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: body.description,
        amount: Math.abs(Number(body.amount)),
        date: txDate,
        type: body.type,
        categoryId,
        accountId: body.accountId,
        userId,
        payee: body.payee || null,
        payer: body.payer || null,
        bankRefId: body.bankRefId || null,
        externalId: generatedExternalId
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('POST Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar no banco', details: error.message }, { status: 500 });
  }
}
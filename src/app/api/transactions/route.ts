import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let transactions;

    if (accountId) {
      transactions = await prisma.$queryRaw`
        SELECT 
          t.*, 
          c.name as "categoryName", 
          a.name as "accountName"
        FROM "Transaction" t
        LEFT JOIN "Category" c ON t."categoryId" = c.id
        LEFT JOIN "Account" a ON t."accountId" = a.id
        WHERE t."userId" = ${session.user.id} AND t."accountId" = ${accountId}
        ORDER BY t.date DESC
      `;
    } else {
      transactions = await prisma.$queryRaw`
        SELECT 
          t.*, 
          c.name as "categoryName", 
          a.name as "accountName"
        FROM "Transaction" t
        LEFT JOIN "Category" c ON t."categoryId" = c.id
        LEFT JOIN "Account" a ON t."accountId" = a.id
        WHERE t."userId" = ${session.user.id}
        ORDER BY t.date DESC
      `;
    }

    if (!Array.isArray(transactions)) return NextResponse.json([]);

    const serialized = transactions.map((t: any) => ({
      ...t,
      category: { name: t.categoryName },
      account: { name: t.accountName }
    }));

    return NextResponse.json(serialized);
  } catch (error) {
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
    const account: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${body.accountId} AND "userId" = ${userId} LIMIT 1`;
    if (!account || account.length === 0) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const dateStr = body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const txDate = new Date(dateStr).toISOString();

    let categoryId = body.categoryId;

    if (categoryId === 'YIELD_AUTO' || !categoryId) {
      const type = categoryId === 'YIELD_AUTO' ? 'INCOME' : (body.type || 'EXPENSE');
      const categoryName = categoryId === 'YIELD_AUTO' ? 'Rendimentos' : 'Outros';
      
      const existing: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = ${categoryName} AND type = ${type} AND "userId" = ${userId} LIMIT 1`;
      
      if (existing && existing.length > 0) {
        categoryId = existing[0].id;
      } else {
        const catId = crypto.randomUUID().substring(0, 8);
        await prisma.$executeRaw`INSERT INTO "Category" (id, name, type, "userId") VALUES (${catId}, ${categoryName}, ${type}, ${userId})`;
        categoryId = catId;
      }
    } else {
      // Validate Category Ownership
      const category: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE id = ${categoryId} AND "userId" = ${userId} LIMIT 1`;
      if (!category || category.length === 0) {
        return NextResponse.json({ message: 'Categoria inválida ou não encontrada' }, { status: 403 });
      }
    }

    await prisma.$executeRaw`
      INSERT INTO "Transaction" (
        id, description, amount, date, type, "categoryId", "accountId", "userId",
        payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${body.description}, ${Math.abs(Number(body.amount))}, ${txDate}, ${body.type}, 
        ${categoryId}, ${body.accountId}, ${userId}, ${body.payee || null}, ${body.payer || null}, 
        ${body.bankRefId || null}, ${body.externalId || null}, ${now}, ${now}
      )
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: Transaction.externalId')) {
      return NextResponse.json({ message: 'Este comprovante já foi importado anteriormente.' }, { status: 400 });
    }
    console.error('POST Transaction Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar no banco', details: error.message }, { status: 500 });
  }
}
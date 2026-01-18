import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const transactions = await prisma.$queryRaw`
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

    const body = await request.json();
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    
    const dateStr = body.date.includes('T') ? body.date : `${body.date}T12:00:00.000Z`;
    const txDate = new Date(dateStr).toISOString();

    let categoryId = body.categoryId;

    if (!categoryId) {
      const type = body.type || 'EXPENSE';
      const categoryName = 'Outros';
      
      const existing: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE name = ${categoryName} AND type = ${type}::"TransactionType" AND "userId" = ${session.user.id} LIMIT 1`;
      
      if (existing && existing.length > 0) {
        categoryId = existing[0].id;
      } else {
        const catId = Math.random().toString(36).substring(2, 10);
        await prisma.$executeRaw`INSERT INTO "Category" (id, name, type, "userId") VALUES (${catId}, ${categoryName}, ${type}::"TransactionType", ${session.user.id})`;
        categoryId = catId;
      }
    }

    await prisma.$executeRaw`
      INSERT INTO "Transaction" (
        id, description, amount, date, type, "categoryId", "accountId", "userId",
        payee, payer, "bankRefId", "externalId", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${body.description}, ${Number(body.amount)}, ${txDate}::timestamp, ${body.type}::"TransactionType", 
        ${categoryId}, ${body.accountId}, ${session.user.id}, ${body.payee || null}, ${body.payer || null}, 
        ${body.bankRefId || null}, ${body.externalId || null}, ${now}::timestamp, ${now}::timestamp
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
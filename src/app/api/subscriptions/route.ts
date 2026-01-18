import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const userId = session.user.id;
    const subs = await prisma.$queryRaw`
      SELECT s.*, c.name as "categoryName", a.name as "accountName"
      FROM "RecurringTransaction" s
      LEFT JOIN "Category" c ON s."categoryId" = c.id
      LEFT JOIN "Account" a ON s."accountId" = a.id
      WHERE s."userId" = ${userId}
      ORDER BY s."nextRun" ASC
    `;

    return NextResponse.json(Array.isArray(subs) ? subs : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    // Validate Account Ownership
    const account: any[] = await prisma.$queryRaw`SELECT id FROM "Account" WHERE id = ${body.accountId} AND "userId" = ${userId} LIMIT 1`;
    if (!account || account.length === 0) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    // Validate Category Ownership
    const category: any[] = await prisma.$queryRaw`SELECT id FROM "Category" WHERE id = ${body.categoryId} AND "userId" = ${userId} LIMIT 1`;
    if (!category || category.length === 0) {
      return NextResponse.json({ message: 'Categoria inválida ou não encontrada' }, { status: 403 });
    }

    const id = crypto.randomUUID().substring(0, 12);
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      INSERT INTO "RecurringTransaction" (id, description, amount, type, frequency, "nextRun", active, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.description}, ${Math.abs(Number(body.amount))}, ${body.type}, ${body.frequency}, ${new Date(body.nextRun).toISOString()}, true, ${body.categoryId}, ${body.accountId}, ${userId}, ${now}, ${now})
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao criar assinatura' }, { status: 500 });
  }
}

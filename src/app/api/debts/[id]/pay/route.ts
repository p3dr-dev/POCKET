import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, accountId, date } = body;

    if (!amount || !accountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;
    const now = new Date().toISOString();

    // 1. Validate Debt Ownership
    const debts: any[] = await prisma.$queryRaw`
      SELECT id, description FROM "Debt" WHERE id = ${id} AND "userId" = ${userId} LIMIT 1
    `;
    if (!debts || debts.length === 0) {
      return NextResponse.json({ message: 'Dívida não encontrada' }, { status: 404 });
    }

    // 2. Validate Account Ownership
    const accounts: any[] = await prisma.$queryRaw`
      SELECT id FROM "Account" WHERE id = ${accountId} AND "userId" = ${userId} LIMIT 1
    `;
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    // Buscar categoria de dívidas ou criar se não existir
    const categories: any[] = await prisma.$queryRaw`
      SELECT id FROM "Category" WHERE name = 'Dívidas' AND type = 'EXPENSE' AND "userId" = ${userId} LIMIT 1
    `;

    let categoryId: string;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      categoryId = crypto.randomUUID().substring(0, 8);
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, type, "userId") 
        VALUES (${categoryId}, 'Dívidas', 'EXPENSE', ${userId})
      `;
    }

    // 3. Atualizar o saldo pago da dívida
    await prisma.$executeRaw`
      UPDATE "Debt" SET "paidAmount" = "paidAmount" + ${Number(amount)}, "updatedAt" = ${now} WHERE id = ${id} AND "userId" = ${userId}
    `;

    // 4. Criar transação de saída da conta
    const txId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
      VALUES (${txId}, ${`Pagamento: ${debts[0].description}`}, ${Number(amount)}, ${now}, 'EXPENSE', ${categoryId}, ${accountId}, ${userId}, ${now}, ${now})
    `;

    return NextResponse.json({ message: 'Pagamento processado com sucesso' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Erro ao processar pagamento' }, { status: 500 });
  }
}

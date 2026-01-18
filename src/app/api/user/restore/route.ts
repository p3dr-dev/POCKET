import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.user.id;

    const data = await req.json();
    const { accounts, categories, transactions, investments, debts, goals, recurring } = data;

    // Restaurar via transação Prisma Client para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Limpar dados existentes do usuário (Ordem inversa das chaves estrangeiras)
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.investment.deleteMany({ where: { userId } });
      await tx.debt.deleteMany({ where: { userId } });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });

      // 2. Restaurar Categorias
      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          await tx.category.upsert({
            where: { id: cat.id },
            update: {
              name: cat.name,
              type: cat.type,
              color: cat.color || '#000000',
              monthlyLimit: cat.monthlyLimit
            },
            create: {
              id: cat.id,
              name: cat.name,
              type: cat.type,
              color: cat.color || '#000000',
              monthlyLimit: cat.monthlyLimit,
              userId
            }
          });
        }
      }

      // 3. Restaurar Contas
      if (accounts && Array.isArray(accounts)) {
        for (const acc of accounts) {
          await tx.account.create({
            data: {
              id: acc.id,
              name: acc.name,
              type: acc.type,
              color: acc.color,
              createdAt: acc.createdAt,
              updatedAt: acc.updatedAt,
              userId
            }
          });
        }
      }

      // 4. Restaurar Transações
      if (transactions && Array.isArray(transactions)) {
        for (const t of transactions) {
          await tx.transaction.create({
            data: {
              id: t.id,
              description: t.description,
              amount: t.amount,
              date: t.date,
              type: t.type,
              categoryId: t.categoryId,
              accountId: t.accountId,
              userId,
              externalId: t.externalId,
              payee: t.payee,
              payer: t.payer,
              bankRefId: t.bankRefId,
              transferId: t.transferId,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt
            }
          });
        }
      }

      // 5. Restaurar Assinaturas (RecurringTransaction)
      if (recurring && Array.isArray(recurring)) {
        for (const r of recurring) {
          await tx.recurringTransaction.create({
            data: {
              id: r.id,
              description: r.description,
              amount: r.amount,
              type: r.type,
              frequency: r.frequency,
              nextRun: r.nextRun,
              active: r.active,
              categoryId: r.categoryId,
              accountId: r.accountId,
              userId,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt
            }
          });
        }
      }

      // 6. Restaurar Investimentos
      if (investments && Array.isArray(investments)) {
        for (const inv of investments) {
          await tx.investment.create({
            data: {
              id: inv.id,
              name: inv.name,
              type: inv.type,
              amount: inv.amount,
              currentValue: inv.currentValue,
              accountId: inv.accountId,
              userId,
              createdAt: inv.createdAt,
              updatedAt: inv.updatedAt
            }
          });
        }
      }

      // 7. Restaurar Dívidas
      if (debts && Array.isArray(debts)) {
        for (const d of debts) {
          await tx.debt.create({
            data: {
              id: d.id,
              description: d.description,
              totalAmount: d.totalAmount,
              paidAmount: d.paidAmount,
              dueDate: d.dueDate,
              userId,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt
            }
          });
        }
      }

      // 8. Restaurar Objetivos
      if (goals && Array.isArray(goals)) {
        for (const g of goals) {
          await tx.goal.create({
            data: {
              id: g.id,
              name: g.name,
              targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              deadline: g.deadline,
              color: g.color,
              userId,
              createdAt: g.createdAt,
              updatedAt: g.updatedAt
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Dados restaurados com sucesso' });
  } catch (error: any) {
    console.error('Erro na restauração:', error);
    return NextResponse.json({ error: 'Falha ao restaurar dados: ' + error.message }, { status: 500 });
  }
}

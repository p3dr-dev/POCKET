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

    // Iniciar restauração via transação Raw SQL para garantir persistência e contornar erros de permissão
    await prisma.$transaction(async (tx) => {
      // 1. Limpar dados existentes do usuário (Ordem inversa das chaves estrangeiras)
      await tx.$executeRaw`DELETE FROM "Transaction" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "RecurringTransaction" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "Investment" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "Debt" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "Goal" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "Account" WHERE "userId" = ${userId}`;
      await tx.$executeRaw`DELETE FROM "Category" WHERE "userId" = ${userId}`;

      // 2. Restaurar Categorias
      if (categories) {
        for (const cat of categories) {
          await tx.$executeRaw`
            INSERT INTO "Category" (id, name, type, "monthlyLimit", "userId")
            VALUES (${cat.id}, ${cat.name}, ${cat.type}, ${cat.monthlyLimit}, ${userId})
          `;
        }
      }

      // 3. Restaurar Contas
      if (accounts) {
        for (const acc of accounts) {
          await tx.$executeRaw`
            INSERT INTO "Account" (id, name, type, color, "createdAt", "updatedAt", "userId")
            VALUES (${acc.id}, ${acc.name}, ${acc.type}, ${acc.color}, ${acc.createdAt}, ${acc.updatedAt}, ${userId})
          `;
        }
      }

      // 4. Restaurar Transações
      if (transactions) {
        for (const t of transactions) {
          await tx.$executeRaw`
            INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "externalId", payee, payer, "bankRefId", "transferId", "createdAt", "updatedAt")
            VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.type}, ${t.categoryId}, ${t.accountId}, ${userId}, ${t.externalId}, ${t.payee}, ${t.payer}, ${t.bankRefId}, ${t.transferId}, ${t.createdAt}, ${t.updatedAt})
          `;
        }
      }

      // 5. Restaurar Assinaturas (RecurringTransaction)
      if (recurring) {
        for (const r of recurring) {
          await tx.$executeRaw`
            INSERT INTO "RecurringTransaction" (id, description, amount, type, frequency, "nextRun", active, "categoryId", "accountId", "userId", "createdAt", "updatedAt")
            VALUES (${r.id}, ${r.description}, ${r.amount}, ${r.type}, ${r.frequency}, ${r.nextRun}, ${r.active}, ${r.categoryId}, ${r.accountId}, ${userId}, ${r.createdAt}, ${r.updatedAt})
          `;
        }
      }

      // 6. Restaurar Investimentos
      if (investments) {
        for (const inv of investments) {
          await tx.$executeRaw`
            INSERT INTO "Investment" (id, name, type, amount, "currentValue", "accountId", "createdAt", "updatedAt", "userId")
            VALUES (${inv.id}, ${inv.name}, ${inv.type}, ${inv.amount}, ${inv.currentValue}, ${inv.accountId}, ${inv.createdAt}, ${inv.updatedAt}, ${userId})
          `;
        }
      }

      // 7. Restaurar Dívidas
      if (debts) {
        for (const d of debts) {
          await tx.$executeRaw`
            INSERT INTO "Debt" (id, description, "totalAmount", "paidAmount", "dueDate", "createdAt", "updatedAt", "userId")
            VALUES (${d.id}, ${d.description}, ${d.totalAmount}, ${d.paidAmount}, ${d.dueDate}, ${d.createdAt}, ${d.updatedAt}, ${userId})
          `;
        }
      }

      // 8. Restaurar Objetivos
      if (goals) {
        for (const g of goals) {
          await tx.$executeRaw`
            INSERT INTO "Goal" (id, name, "targetAmount", "currentAmount", "deadline", color, "createdAt", "updatedAt", "userId")
            VALUES (${g.id}, ${g.name}, ${g.targetAmount}, ${g.currentAmount}, ${g.deadline}, ${g.color}, ${g.createdAt}, ${g.updatedAt}, ${userId})
          `;
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Dados restaurados com sucesso' });
  } catch (error: any) {
    console.error('Erro na restauração:', error);
    return NextResponse.json({ error: 'Falha ao restaurar dados: ' + error.message }, { status: 500 });
  }
}

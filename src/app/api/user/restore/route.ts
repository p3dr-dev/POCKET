import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  console.log(`[DIAGNOSTICO - Restore API] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[DIAGNOSTICO - Restore API] DATABASE_URL (raw): ${process.env.DATABASE_URL ? 'SET' : 'UNDEFINED'}`);
  if (process.env.DATABASE_URL) {
    console.log(`[DIAGNOSTICO - Restore API] DATABASE_URL (prefix): ${process.env.DATABASE_URL.substring(0, 10)}...`);
  }
  
  try {
    const data = await req.json();
    const { accounts, categories, transactions, investments, debts, goals } = data;

    // Iniciar restauração via transação Raw SQL para garantir persistência e contornar erros de permissão
    await prisma.$transaction(async (tx) => {
      // 1. Limpar dados existentes (Ordem inversa das chaves estrangeiras)
      await tx.$executeRaw`DELETE FROM "Transaction"`;
      await tx.$executeRaw`DELETE FROM Investment`;
      await tx.$executeRaw`DELETE FROM Debt`;
      await tx.$executeRaw`DELETE FROM Goal`;
      await tx.$executeRaw`DELETE FROM Account`;
      await tx.$executeRaw`DELETE FROM Category`;

      // 2. Restaurar Categorias
      for (const cat of categories) {
        await tx.$executeRaw`
          INSERT INTO Category (id, name, type, monthlyLimit)
          VALUES (${cat.id}, ${cat.name}, ${cat.type}, ${cat.monthlyLimit})
        `;
      }

      // 3. Restaurar Contas
      for (const acc of accounts) {
        await tx.$executeRaw`
          INSERT INTO Account (id, name, type, color, createdAt, updatedAt)
          VALUES (${acc.id}, ${acc.name}, ${acc.type}, ${acc.color}, ${acc.createdAt}, ${acc.updatedAt})
        `;
      }

      // 4. Restaurar Transações
      for (const t of transactions) {
        await tx.$executeRaw`
          INSERT INTO "Transaction" (id, description, amount, date, type, categoryId, accountId, externalId, payee, payer, bankRefId, transferId, createdAt, updatedAt)
          VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.type}, ${t.categoryId}, ${t.accountId}, ${t.externalId}, ${t.payee}, ${t.payer}, ${t.bankRefId}, ${t.transferId}, ${t.createdAt}, ${t.updatedAt})
        `;
      }

      // 5. Restaurar Investimentos
      for (const inv of investments) {
        await tx.$executeRaw`
          INSERT INTO Investment (id, name, type, amount, currentValue, accountId, createdAt, updatedAt)
          VALUES (${inv.id}, ${inv.name}, ${inv.type}, ${inv.amount}, ${inv.currentValue}, ${inv.accountId}, ${inv.createdAt}, ${inv.updatedAt})
        `;
      }

      // 6. Restaurar Dívidas
      for (const d of debts) {
        await tx.$executeRaw`
          INSERT INTO Debt (id, description, totalAmount, paidAmount, dueDate, createdAt, updatedAt)
          VALUES (${d.id}, ${d.description}, ${d.totalAmount}, ${d.paidAmount}, ${d.dueDate}, ${d.createdAt}, ${d.updatedAt})
        `;
      }

      // 7. Restaurar Objetivos
      for (const g of goals) {
        await tx.$executeRaw`
          INSERT INTO Goal (id, name, targetAmount, currentAmount, deadline, color, createdAt, updatedAt)
          VALUES (${g.id}, ${g.name}, ${g.targetAmount}, ${g.currentAmount}, ${g.deadline}, ${g.color}, ${g.createdAt}, ${g.updatedAt})
        `;
      }
    });

    return NextResponse.json({ success: true, message: 'Dados restaurados com sucesso' });
  } catch (error: any) {
    console.error('Erro na restauração:', error);
    return NextResponse.json({ error: 'Falha ao restaurar dados: ' + error.message }, { status: 500 });
  }
}

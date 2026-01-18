import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
  try {
    const filePath = path.join(process.cwd(), 'pocket_backup_2026-01-16.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Pegar o primeiro usuário (Admin)
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('Nenhum usuário encontrado no banco.');

    const userId = user.id;
    console.log(`Restaurando dados para o usuário: ${user.name} (${userId})`);

    const { accounts, categories, transactions, investments, debts, goals } = data;

    // Transação gigante
    await prisma.$transaction(async (tx) => {
      // 1. Limpar (Cuidado: apaga o que tem lá)
      console.log('Limpando dados antigos...');
      await tx.$executeRaw`DELETE FROM "Transaction" WHERE "userId" = ${userId} OR "userId" IS NULL`;
      await tx.$executeRaw`DELETE FROM "Investment" WHERE "userId" = ${userId} OR "userId" IS NULL`;
      await tx.$executeRaw`DELETE FROM "Debt" WHERE "userId" = ${userId} OR "userId" IS NULL`;
      await tx.$executeRaw`DELETE FROM "Goal" WHERE "userId" = ${userId} OR "userId" IS NULL`;
      // Contas e Categorias são delicadas pois podem ter FKs se não limparmos Transactions antes.
      // Como já limpamos transactions, ok.
      await tx.$executeRaw`DELETE FROM "Account" WHERE "userId" = ${userId} OR "userId" IS NULL`;
      await tx.$executeRaw`DELETE FROM "Category" WHERE "userId" = ${userId} OR "userId" IS NULL`;

      // 2. Categorias
      console.log(`Restaurando ${categories.length} categorias...`);
      for (const cat of categories) {
        await tx.$executeRaw`
          INSERT INTO "Category" (id, name, type, "monthlyLimit", "userId")
          VALUES (${cat.id}, ${cat.name}, ${cat.type}::"TransactionType", ${cat.monthlyLimit}, ${userId})
        `;
      }

      // 3. Contas
      console.log(`Restaurando ${accounts.length} contas...`);
      for (const acc of accounts) {
        await tx.$executeRaw`
          INSERT INTO "Account" (id, name, type, color, "createdAt", "updatedAt", "userId")
          VALUES (${acc.id}, ${acc.name}, ${acc.type}::"AccountType", ${acc.color}, ${acc.createdAt}::timestamp, ${acc.updatedAt}::timestamp, ${userId})
        `;
      }

      // 4. Transações
      console.log(`Restaurando ${transactions.length} transações...`);
      for (const t of transactions) {
        // Fallback para campos que podem não existir no JSON antigo
        const externalId = t.externalId || null;
        const payee = t.payee || null;
        const payer = t.payer || null;
        const bankRefId = t.bankRefId || null;
        const transferId = t.transferId || null;

        await tx.$executeRaw`
          INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "externalId", payee, payer, "bankRefId", "transferId", "createdAt", "updatedAt", "userId")
          VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}::timestamp, ${t.type}::"TransactionType", ${t.categoryId}, ${t.accountId}, ${externalId}, ${payee}, ${payer}, ${bankRefId}, ${transferId}, ${t.createdAt}::timestamp, ${t.updatedAt}::timestamp, ${userId})
        `;
      }

      // 5. Dívidas
      console.log(`Restaurando ${debts.length} dívidas...`);
      for (const d of debts) {
        await tx.$executeRaw`
          INSERT INTO "Debt" (id, description, "totalAmount", "paidAmount", "dueDate", "createdAt", "updatedAt", "userId")
          VALUES (${d.id}, ${d.description}, ${d.totalAmount}, ${d.paidAmount}, ${d.dueDate}::timestamp, ${d.createdAt}::timestamp, ${d.updatedAt}::timestamp, ${userId})
        `;
      }

      // 6. Metas
      console.log(`Restaurando ${goals.length} metas...`);
      for (const g of goals) {
        await tx.$executeRaw`
          INSERT INTO "Goal" (id, name, "targetAmount", "currentAmount", deadline, color, "createdAt", "updatedAt", "userId")
          VALUES (${g.id}, ${g.name}, ${g.targetAmount}, ${g.currentAmount}, ${g.deadline}::timestamp, ${g.color}, ${g.createdAt}::timestamp, ${g.updatedAt}::timestamp, ${userId})
        `;
      }
    });

    console.log('✅ Restauração Concluída com Sucesso!');

  } catch (e) {
    console.error('❌ Erro na restauração:', e);
  } finally {
    await prisma.$disconnect();
  }
}

restore();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('--- DIAGNÓSTICO DO BANCO DE DADOS ---');
    
    const users = await prisma.user.count();
    const accounts = await prisma.account.count();
    const transactions = await prisma.transaction.count();
    const debts = await prisma.debt.count();
    const investments = await prisma.investment.count();

    console.log(`Usuários: ${users}`);
    console.log(`Contas: ${accounts}`);
    console.log(`Transações: ${transactions}`);
    console.log(`Dívidas: ${debts}`);
    console.log(`Investimentos: ${investments}`);

    console.log('-------------------------------------');

    // Verificar quantos estão órfãos (sem userId)
    const orphanedTx = await prisma.transaction.count({ where: { userId: null } });
    console.log(`Transações "Invisíveis" (Sem Dono): ${orphanedTx}`);
    
    if (orphanedTx > 0) {
        console.log('\n✅ SEUS DADOS ESTÃO SALVOS! Eles apenas precisam ser vinculados.');
        console.log('Vá em Configurações > Resgatar Dados no app para corrigir.');
    } else if (transactions === 0) {
        console.log('\n⚠️ O banco de dados está realmente vazio.');
    }

  } catch (e) {
    console.error('Erro ao conectar:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

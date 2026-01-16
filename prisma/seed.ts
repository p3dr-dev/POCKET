import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Alimentação', type: 'EXPENSE' },
    { name: 'Moradia', type: 'EXPENSE' },
    { name: 'Transporte', type: 'EXPENSE' },
    { name: 'Lazer', type: 'EXPENSE' },
    { name: 'Saúde', type: 'EXPENSE' },
    { name: 'Educação', type: 'EXPENSE' },
    { name: 'Salário', type: 'INCOME' },
    { name: 'Investimentos', type: 'INCOME' },
    { name: 'Presentes', type: 'INCOME' },
  ];

  console.log('Seeding categories...');
  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name }
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          type: category.type as 'INCOME' | 'EXPENSE',
        },
      });
    }
  }

  const accounts = [
    { name: 'Conta Corrente', type: 'BANK', color: '#3b82f6' },
    { name: 'Dinheiro', type: 'CASH', color: '#10b981' },
    { name: 'Cartão de Crédito', type: 'CREDIT_CARD', color: '#f43f5e' },
  ];

  console.log('Seeding accounts...');
  for (const account of accounts) {
    const existing = await prisma.account.findFirst({
      where: { name: account.name }
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          name: account.name,
          type: account.type as 'BANK' | 'CASH' | 'CREDIT_CARD',
          color: account.color,
        },
      });
    }
  }

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
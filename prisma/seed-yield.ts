import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const yieldCategory = await prisma.category.findUnique({ where: { name: 'Rendimentos' } });
  
  if (!yieldCategory) {
    await prisma.category.create({
      data: {
        name: 'Rendimentos',
        type: 'INCOME'
      }
    });
    console.log('Category "Rendimentos" created.');
  } else {
    console.log('Category "Rendimentos" already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

// O prisma.config.ts gerenciará a configuração do datasource
// e o Next.js/Vercel injetará as variáveis de ambiente.

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL; // Esta deve ser a URL do Accelerate na Vercel

  console.log(`🔌 [Prisma] Usando DATABASE_URL: ${databaseUrl ? databaseUrl.substring(0, 10) + '...' : 'Nenhuma'}`);
  
  // Se DATABASE_URL não estiver definida, o Prisma vai tentar usar o default do schema.prisma
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Em desenvolvimento, garantimos que o globalThis.prisma seja o mesmo para hot-reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente no início

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL; // URL direta para db push e fallback
  const accelerateUrl = process.env.PRISMA_ACCELERATE_ENDPOINT; // URL do Accelerate para a aplicação

  // Prioriza Accelerate se disponível
  const finalUrl = accelerateUrl || databaseUrl;

  console.log(`🔌 [Prisma] Usando URL: ${finalUrl ? finalUrl.substring(0, 10) + '...' : 'Nenhuma'}`);
  return new PrismaClient({
    datasources: {
      db: {
        url: finalUrl,
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

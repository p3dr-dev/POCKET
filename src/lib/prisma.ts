import { PrismaClient } from '@prisma/client';

// O prisma.config.ts gerenciará a configuração do datasource
// e o Next.js/Vercel injetará as variáveis de ambiente.

const prismaClientSingleton = () => {
  // Tenta obter a URL de conexão de várias variáveis comuns
  const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

  console.log(`🔌 [Prisma Runtime Init] Usando URL: ${databaseUrl ? databaseUrl.substring(0, 10) + '...' : 'NENHUMA URL DETECTADA'}`);
  
  // Não passamos 'datasources' explicitamente para que o Prisma use o que está no schema.prisma
  // (que já aponta para env("POSTGRES_PRISMA_URL") ou similar)
  const prisma = new PrismaClient();

  // Health Check: Tenta conectar e fazer uma query simples logo na inicialização
  prisma.$connect()
    .then(async () => {
      console.log('✅ [Prisma Runtime Init] Conexão com o banco de dados estabelecida.');
    })
    .catch((e: any) => {
      console.error('❌ [Prisma Runtime Init] FALHA CRÍTICA na conexão ou query de teste:', e.message);
      if (e.stack) console.error(e.stack);
    });

  return prisma;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Em desenvolvimento, garantimos que o globalThis.prisma seja o mesmo para hot-reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

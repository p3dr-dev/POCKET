import { PrismaClient } from '@prisma/client';

// O prisma.config.ts gerenciará a configuração do datasource
// e o Next.js/Vercel injetará as variáveis de ambiente.

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL; // Esta deve ser a URL do Accelerate na Vercel

  console.log(`🔌 [Prisma Init] Usando DATABASE_URL: ${databaseUrl ? databaseUrl.substring(0, 10) + '...' : 'Nenhuma'}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Health Check: Tenta conectar e fazer uma query simples logo na inicialização
  prisma.$connect()
    .then(async () => {
      console.log('✅ [Prisma Init] Conexão com o banco de dados estabelecida.');
      await prisma.$queryRaw`SELECT 1;`;
      console.log('✅ [Prisma Init] Query de teste executada com sucesso. Tabelas OK.');
    })
    .catch((e: any) => {
      console.error('❌ [Prisma Init] Falha na conexão ou query de teste:', e.message);
      console.error('❌ [Prisma Init] Verifique se a DATABASE_URL está correta e se as migrações foram aplicadas.');
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
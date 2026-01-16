import { PrismaClient } from '@prisma/client';

// O prisma.config.ts gerenciará a configuração do datasource
// e o Next.js/Vercel injetará as variáveis de ambiente.

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL; // Esta deve ser a URL do Accelerate na Vercel

  console.log(`🔌 [Prisma Runtime Init] Usando DATABASE_URL: ${databaseUrl ? databaseUrl.substring(0, 10) + '... (Conferir Vercel Env Vars)' : 'NENHUMA URL DETECTADA'}`);
  
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
      console.log('✅ [Prisma Runtime Init] Conexão com o banco de dados estabelecida.');
      await prisma.$queryRaw`SELECT 1;`;
      console.log('✅ [Prisma Runtime Init] Query de teste executada com sucesso. Tabelas OK.');
    })
    .catch((e: any) => {
      console.error('❌ [Prisma Runtime Init] FALHA CRÍTICA na conexão ou query de teste:', e.message);
      console.error('❌ [Prisma Runtime Init] VERIFIQUE: 1. `DATABASE_URL` na Vercel (deve ser o Accelerate). 2. Restrições de IP no seu banco.');
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

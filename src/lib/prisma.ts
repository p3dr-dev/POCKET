import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Garante que .env seja carregado se não estiver em ambiente de deploy

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const nodeEnv = process.env.NODE_ENV;

  console.log(`[DIAGNOSTICO - Prisma Singleton] NODE_ENV: ${nodeEnv}`);
  console.log(`[DIAGNOSTICO - Prisma Singleton] DATABASE_URL (raw): ${databaseUrl ? 'SET' : 'UNDEFINED'}`);
  if (databaseUrl) {
    console.log(`[DIAGNOSTICO - Prisma Singleton] DATABASE_URL (prefix): ${databaseUrl.substring(0, 10)}...`);
  }
  console.log(`[DIAGNOSTICO - Prisma Singleton] AUTH_TOKEN (raw): ${authToken ? 'SET' : 'UNDEFINED'}`);


  const isTursoEnabled = 
    typeof databaseUrl === 'string' && 
    databaseUrl.length > 10 && 
    (databaseUrl.startsWith('libsql:') || databaseUrl.startsWith('https:'));

  if (isTursoEnabled) {
    try {
      console.log('🔌 [Prisma] Tentando conexão Turso...');
      // Log aqui para ver o valor exato que createClient recebe
      console.log(`[DIAGNOSTICO - createClient] URL final para client: ${databaseUrl ? databaseUrl.substring(0, 10) + '...' : 'UNDEFINED'}`);

      const libsql = createClient({
        url: databaseUrl as string,
        authToken: authToken || '',
      });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({ adapter });
    } catch (e: any) {
      console.error('❌ [Prisma] Erro ao conectar ao Turso:', e.message);
      if (e.stack) console.error(e.stack);
    }
  }

  console.log('🏠 [Prisma] Usando SQLite Local (dev.db)');
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

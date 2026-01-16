import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente no início

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Verificação rigorosa: URL válida para Turso
  const isTursoEnabled = 
    typeof databaseUrl === 'string' && 
    databaseUrl.length > 10 && // Para evitar strings vazias ou muito curtas
    (databaseUrl.startsWith('libsql:') || databaseUrl.startsWith('https:')); // Suporte para libsql e HTTPS (proxy)

  if (isTursoEnabled) {
    try {
      console.log('🔌 [Prisma] Tentando conexão Turso...');
      const libsql = createClient({
        url: databaseUrl as string,
        authToken: authToken || '',
      });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('❌ [Prisma] Erro ao conectar ao Turso:', e);
    }
  }

  // Fallback para SQLite local (dev.db)
  console.log('🏠 [Prisma] Usando SQLite Local (dev.db)');
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Em desenvolvimento, garantimos que o globalThis.prisma seja o mesmo para hot-reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
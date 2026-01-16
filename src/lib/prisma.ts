import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const prismaClientSingleton = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Verificação rigorosa para evitar erro de 'undefined' no build da Vercel
  if (isProduction && databaseUrl && databaseUrl.startsWith('libsql')) {
    console.log('🔌 Conectando ao Turso (Produção)...');
    const libsql = createClient({
      url: databaseUrl,
      authToken: authToken || '',
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter });
  }

  // Fallback para SQLite local (Desenvolvimento ou Build sem variáveis)
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

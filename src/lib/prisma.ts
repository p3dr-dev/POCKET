import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Verificação rigorosa: deve ser string e começar com libsql: ou http: (para turso)
  const isLibsql = typeof databaseUrl === 'string' && 
                   databaseUrl.trim() !== '' && 
                   (databaseUrl.startsWith('libsql:') || databaseUrl.startsWith('https:'));

  if (isLibsql) {
    try {
      console.log('🔌 [Prisma] Conectando ao Turso...');
      const libsql = createClient({
        url: databaseUrl as string,
        authToken: authToken || '',
      });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('❌ [Prisma] Erro ao inicializar Turso:', e);
    }
  }

  // Fallback para SQLite local se não houver URL válida do Turso
  console.log('🏠 [Prisma] Usando SQLite Local');
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

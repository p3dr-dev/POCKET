import { PrismaClient } from '@prisma/client';
import path from 'path';

const prismaClientSingleton = () => {
  // Se estivermos na Vercel, precisamos garantir que o caminho do SQLite seja absoluto
  const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  if (isVercel && process.env.DATABASE_URL?.startsWith('file:')) {
    // Forçar o caminho para a raiz do projeto no ambiente Vercel
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    process.env.DATABASE_URL = `file:${dbPath}`;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

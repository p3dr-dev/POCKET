import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente no início

const prismaClientSingleton = () => {
  // A conexão é gerenciada pelo schema.prisma agora.
  // Se DATABASE_URL estiver setado, ele usará.
  // Caso contrário, usará o default do schema.prisma (file:./dev.db)
  console.log('🔌 [Prisma] Inicializando Cliente Padrão...');
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Em desenvolvimento, garantimos que o globalThis.prisma seja o mesmo para hot-reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

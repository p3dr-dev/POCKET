import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUsers: any[] = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email} LIMIT 1
    `;

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email já cadastrado.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Verificar se é o primeiro usuário
    const counts: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    const userCount = Number(counts[0]?.count || 0);
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    await prisma.$executeRaw`
      INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${role}, ${now}, ${now})
    `;

    // --- MIGRAÇÃO AUTOMÁTICA DE DADOS ORFÃOS ---
    // Vincular TUDO que não tem userId a este novo usuário.
    
    await prisma.$executeRaw`UPDATE "Account" SET "userId" = ${userId} WHERE "userId" IS NULL`;
    await prisma.$executeRaw`UPDATE "Category" SET "userId" = ${userId} WHERE "userId" IS NULL`;
    await prisma.$executeRaw`UPDATE "Goal" SET "userId" = ${userId} WHERE "userId" IS NULL`;
    await prisma.$executeRaw`UPDATE "Debt" SET "userId" = ${userId} WHERE "userId" IS NULL`;
    await prisma.$executeRaw`UPDATE "Investment" SET "userId" = ${userId} WHERE "userId" IS NULL`;
    await prisma.$executeRaw`UPDATE "Transaction" SET "userId" = ${userId} WHERE "userId" IS NULL`;

    // --- CRIAR CATEGORIAS PADRÃO ---
    const defaultCategories = [
      { name: 'Alimentação', type: 'EXPENSE' },
      { name: 'Transporte', type: 'EXPENSE' },
      { name: 'Lazer', type: 'EXPENSE' },
      { name: 'Saúde', type: 'EXPENSE' },
      { name: 'Educação', type: 'EXPENSE' },
      { name: 'Moradia', type: 'EXPENSE' },
      { name: 'Assinaturas', type: 'EXPENSE' },
      { name: 'Rendimentos', type: 'INCOME' },
      { name: 'Transferências', type: 'EXPENSE' },
      { name: 'Outros', type: 'EXPENSE' }
    ];

    for (const cat of defaultCategories) {
      const catId = crypto.randomUUID().substring(0, 8);
      await prisma.$executeRaw`
        INSERT INTO "Category" (id, name, type, "userId")
        VALUES (${catId}, ${cat.name}, ${cat.type}, ${userId})
      `;
    }

    return NextResponse.json({ message: 'Usuário criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erro ao criar conta', error: error.message }, { status: 500 });
  }
}

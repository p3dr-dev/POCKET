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

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email já cadastrado.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      }
    });

    const userId = user.id;

    // --- MIGRAÇÃO AUTOMÁTICA DE DADOS ORFÃOS ---
    // Vincular TUDO que não tem userId a este novo usuário.
    await Promise.all([
      prisma.account.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.category.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.goal.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.debt.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.investment.updateMany({ where: { userId: null }, data: { userId } }),
      prisma.transaction.updateMany({ where: { userId: null }, data: { userId } }),
    ]);

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

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        name: cat.name,
        type: cat.type,
        userId: userId
      })),
      skipDuplicates: true
    });

    return NextResponse.json({ message: 'Usuário criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erro ao criar conta', error: error.message }, { status: 500 });
  }
}

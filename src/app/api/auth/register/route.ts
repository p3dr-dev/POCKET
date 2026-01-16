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
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email já cadastrado.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // --- MIGRAÇÃO AUTOMÁTICA DE DADOS ORFÃOS ---
    // Se for o primeiro usuário ou se decidirmos vincular dados "sem dono" a ele.
    // Como o projeto era single-tenant, vamos vincular TUDO que não tem userId a este novo usuário.
    // Isso garante que o usuário antigo não perca dados ao se cadastrar.
    
    // 1. Atualizar Contas
    await prisma.account.updateMany({
      where: { userId: null },
      data: { userId: user.id }
    });

    // 2. Atualizar Categorias
    await prisma.category.updateMany({
      where: { userId: null },
      data: { userId: user.id }
    });

    // 3. Atualizar Objetivos
    await prisma.goal.updateMany({
      where: { userId: null },
      data: { userId: user.id }
    });

    // 4. Atualizar Dívidas
    await prisma.debt.updateMany({
      where: { userId: null },
      data: { userId: user.id }
    });

    // 5. Atualizar Investimentos
    await prisma.investment.updateMany({
      where: { userId: null },
      data: { userId: user.id }
    });

    return NextResponse.json({ message: 'Usuário criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Dados inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erro ao criar conta', error: error.message }, { status: 500 });
  }
}

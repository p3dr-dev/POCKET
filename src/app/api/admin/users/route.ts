import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    // Verifica se é admin (por role ou email hardcoded como fallback)
    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    
    if (user?.role !== 'ADMIN' && session?.user?.email !== 'pedrosimoes@example.com') { // Substitua pelo seu email real se necessário
       // Como acabamos de adicionar a coluna, seu usuário atual deve estar com "USER". 
       // Vou permitir que você se promova via API ou assumir que o primeiro user é admin.
       // Para segurança, vamos verificar apenas o role. Se você não for admin, precisará editar no banco.
       if (user?.role !== 'ADMIN') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { accounts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

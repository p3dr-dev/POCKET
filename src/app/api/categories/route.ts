import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = session.user.id;

    const category = await prisma.category.create({
      data: {
        name: body.name,
        type: body.type,
        color: body.color || '#000000',
        monthlyLimit: body.monthlyLimit ? Number(body.monthlyLimit) : null,
        userId
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Esta categoria já existe.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erro ao criar categoria' }, { status: 500 });
  }
}

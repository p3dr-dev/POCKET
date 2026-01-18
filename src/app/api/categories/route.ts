import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const categories = await prisma.$queryRaw`
      SELECT * FROM "Category" WHERE "userId" = ${session.user.id} ORDER BY name ASC
    `;
    return NextResponse.json(Array.isArray(categories) ? categories : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id = crypto.randomUUID().substring(0, 8);
    const userId = session.user.id;

    await prisma.$executeRaw`
      INSERT INTO "Category" (id, name, type, "monthlyLimit", "userId")
      VALUES (${id}, ${body.name}, ${body.type}, ${Number(body.monthlyLimit) || null}, ${userId})
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ message: 'Esta categoria já existe.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, name, monthlyLimit } = await request.json();

    if (!id) return NextResponse.json({ message: 'ID não fornecido' }, { status: 400 });

    await prisma.$executeRaw`
      UPDATE "Category" 
      SET name = ${name}, "monthlyLimit" = ${monthlyLimit ? Number(monthlyLimit) : null}
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

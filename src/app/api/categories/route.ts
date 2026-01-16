import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await prisma.$queryRaw`
      SELECT * FROM "Category" ORDER BY name ASC
    `;
    return NextResponse.json(Array.isArray(categories) ? categories : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {

  try {

    const { name, type, monthlyLimit } = await request.json();

    if (!name || !type) return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });



    const id = Math.random().toString(36).substring(2, 10);

    

    await prisma.$executeRaw`

      INSERT INTO "Category" (id, name, type, "monthlyLimit") 

      VALUES (${id}, ${name}, ${type}::"TransactionType", ${monthlyLimit ? Number(monthlyLimit) : null})

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

    const { id, name, monthlyLimit } = await request.json();

    if (!id) return NextResponse.json({ message: 'ID não fornecido' }, { status: 400 });



    await prisma.$executeRaw`

      UPDATE "Category" 

      SET name = ${name}, "monthlyLimit" = ${monthlyLimit ? Number(monthlyLimit) : null}

      WHERE id = ${id}

    `;



    return NextResponse.json({ success: true });

  } catch (error) {

    return NextResponse.json({ message: 'Erro ao atualizar categoria' }, { status: 500 });

  }

}

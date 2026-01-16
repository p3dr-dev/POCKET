import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const goals = await prisma.$queryRaw`SELECT * FROM "Goal" ORDER BY deadline ASC`;
    return NextResponse.json(Array.isArray(goals) ? goals : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    
    const dateStr = body.deadline.includes('T') ? body.deadline : `${body.deadline}T12:00:00.000Z`;
    const deadline = new Date(dateStr).toISOString();

    await prisma.$executeRaw`
      INSERT INTO "Goal" (id, name, "targetAmount", "currentAmount", deadline, color, "createdAt", "updatedAt")
      VALUES (${id}, ${body.name}, ${Number(body.targetAmount)}, ${Number(body.currentAmount || 0)}, ${deadline}::timestamp, ${body.color || '#000000'}, ${now}::timestamp, ${now}::timestamp)
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao salvar objetivo' }, { status: 500 });
  }
}

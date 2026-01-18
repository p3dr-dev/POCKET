import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const goals = await prisma.$queryRaw`
      SELECT * FROM "Goal" 
      WHERE "userId" = ${session.user.id} 
      ORDER BY "deadline" ASC
    `;
    return NextResponse.json(Array.isArray(goals) ? goals : []);
  } catch (error) {
    console.error('Goals GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const deadlineStr = body.deadline.includes('T') ? body.deadline : `${body.deadline}T12:00:00.000Z`;
    const deadline = new Date(deadlineStr).toISOString();

    await prisma.$executeRaw`
      INSERT INTO "Goal" (id, name, "targetAmount", "currentAmount", "deadline", color, "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${body.name}, ${Number(body.targetAmount)}, ${Number(body.currentAmount || 0)}, ${deadline}, ${body.color || '#000000'}, ${session.user.id}, ${now}, ${now})
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('Goals POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar objetivo', details: error.message }, { status: 500 });
  }
}

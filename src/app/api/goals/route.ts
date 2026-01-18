import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { deadline: 'asc' }
    });
    return NextResponse.json(goals);
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
    const userId = session.user.id;
    
    const deadlineStr = body.deadline.includes('T') ? body.deadline : `${body.deadline}T12:00:00.000Z`;
    const deadline = new Date(deadlineStr);

    const goal = await prisma.goal.create({
      data: {
        name: body.name,
        targetAmount: Number(body.targetAmount),
        currentAmount: Number(body.currentAmount || 0),
        deadline,
        color: body.color || '#000000',
        userId
      }
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error('Goals POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar objetivo', details: error.message }, { status: 500 });
  }
}

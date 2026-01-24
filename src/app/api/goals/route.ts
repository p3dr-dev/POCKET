import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { goalSchema } from '@/lib/validations';
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
    
    const validation = goalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Dados inválidos', 
        errors: validation.error.format() 
      }, { status: 400 });
    }

    const { name, targetAmount, currentAmount, deadline: deadlineStr, color } = validation.data;
    const userId = session.user.id;
    
    const deadlineDate = deadlineStr.includes('T') ? deadlineStr : `${deadlineStr}T12:00:00.000Z`;
    const deadline = new Date(deadlineDate);

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount,
        currentAmount,
        deadline,
        color,
        userId
      }
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error('Goals POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar objetivo', details: error.message }, { status: 500 });
  }
}

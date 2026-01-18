import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const debts = await prisma.$queryRaw`SELECT * FROM "Debt" WHERE "userId" = ${session.user.id} ORDER BY "dueDate" ASC`;
    return NextResponse.json(Array.isArray(debts) ? debts : []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const type = body.type || 'SINGLE';
    const count = type === 'SINGLE' ? 1 : (body.installmentsCount || 2);
    const initialDateStr = body.dueDate ? (body.dueDate.includes('T') ? body.dueDate : `${body.dueDate}T12:00:00.000Z`) : null;
    const initialDate = initialDateStr ? new Date(initialDateStr) : null;
    const now = new Date().toISOString();

    const addMonths = (date: Date, months: number) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      if (d.getDate() !== date.getDate()) {
        d.setDate(0);
      }
      return d;
    };

    for (let i = 0; i < count; i++) {
      const id = crypto.randomUUID();
      const dueDate = (initialDate && type !== 'SINGLE') ? addMonths(initialDate, i).toISOString() : initialDateStr;
      
      let description = body.description;
      if (type === 'INSTALLMENT') {
        description = `${body.description} (${i + 1}/${count})`;
      }

      await prisma.$executeRaw`
        INSERT INTO "Debt" (id, description, "totalAmount", "paidAmount", "dueDate", "userId", "createdAt", "updatedAt")
        VALUES (
          ${id}, 
          ${description}, 
          ${Math.abs(Number(body.totalAmount))}, 
          ${Math.abs(Number(body.paidAmount || 0))}, 
          ${dueDate}, 
          ${session.user.id},
          ${now}, 
          ${now}
        )
      `;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Erro ao salvar dívida' }, { status: 500 });
  }
}

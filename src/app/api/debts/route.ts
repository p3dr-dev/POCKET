import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const debts = await prisma.debt.findMany({
      where: { userId: session.user.id },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(debts);
  } catch (error) {
    console.error('Debts GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const userId = session.user.id;
        const body = await request.json();
    
        if (!body.description || body.totalAmount === undefined) {
          return NextResponse.json({ message: 'Descrição e valor total são obrigatórios' }, { status: 400 });
        }
    
        const type = body.type || 'SINGLE';
        const count = type === 'SINGLE' ? 1 : (Number(body.installmentsCount) || 2);
        const amountPerInstallment = Math.abs(Number(body.totalAmount));
        
        if (isNaN(amountPerInstallment)) {
          return NextResponse.json({ message: 'Valor total inválido' }, { status: 400 });
        }
    
        let initialDate: Date | null = null;
        if (body.dueDate) {
          const dateStr = body.dueDate.includes('T') ? body.dueDate : `${body.dueDate}T12:00:00.000Z`;
          initialDate = new Date(dateStr);
        }
    
        const groupId = type !== 'SINGLE' ? crypto.randomUUID() : null;
        const debtsData = [];
    
        for (let i = 0; i < count; i++) {
          let dueDate: Date | null = null;
          if (initialDate) {
            dueDate = new Date(initialDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            // Ajuste para último dia do mês se necessário para evitar pulos (ex: 31 Jan -> 28 Fev)
            if (dueDate.getDate() !== initialDate.getDate() && initialDate.getDate() > 28) {
              dueDate.setDate(0);
            }
          }
    
          let description = body.description;
          if (type === 'INSTALLMENT') {
            description = `${body.description} (${i + 1}/${count})`;
          }
    
          debtsData.push({
            description,
            totalAmount: amountPerInstallment,
            paidAmount: i === 0 ? Math.abs(Number(body.paidAmount || 0)) : 0,
            dueDate,
            groupId,
            userId
          });
        }
    
        // Usar createMany para inserção em massa eficiente
        await prisma.debt.createMany({
          data: debtsData
        });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Debts POST Error:', error);
    return NextResponse.json({ message: 'Erro ao salvar dívida', details: error.message }, { status: 500 });
  }
}

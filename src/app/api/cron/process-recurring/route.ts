import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Em produção, verificar um cabeçalho de segredo (CRON_SECRET)
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    
    // 1. Buscar assinaturas pendentes
    const dueSubs = await prisma.recurringTransaction.findMany({
      where: {
        active: true,
        nextRun: { lte: now }
      }
    });

    const results = [];

    // 2. Processar cada uma
    for (const sub of dueSubs) {
      // Criar transação
      await prisma.transaction.create({
        data: {
          description: sub.description,
          amount: sub.amount,
          type: sub.type,
          date: now,
          categoryId: sub.categoryId,
          accountId: sub.accountId,
          externalId: `SUB-${sub.id}-${now.toISOString().split('T')[0]}` // Evitar duplicata no mesmo dia
        }
      });

      // Calcular próxima data
      const nextDate = new Date(sub.nextRun);
      if (sub.frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (sub.frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (sub.frequency === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      // Atualizar assinatura
      await prisma.recurringTransaction.update({
        where: { id: sub.id },
        data: { nextRun: nextDate }
      });

      results.push(`Processed: ${sub.description}`);
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}

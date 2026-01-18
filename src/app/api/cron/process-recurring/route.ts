import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Verificação de segredo para segurança em produção
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized CRON attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // 1. Buscar assinaturas pendentes
    const dueSubs = await prisma.recurringTransaction.findMany({
      where: {
        active: true,
        nextRun: { lte: now, not: null },
        amount: { not: null }
      }
    });

    const results = [];

    // 2. Processar cada uma
    for (const sub of dueSubs) {
      const nowIso = new Date().toISOString();
      const externalId = `SUB-${sub.id}-${nowIso.split('T')[0]}`;
      const absAmount = Math.abs(Number(sub.amount));

      try {
        await prisma.$transaction(async (tx) => {
          // Criar transação
          await tx.transaction.create({
            data: {
              description: sub.description,
              amount: absAmount,
              date: new Date(),
              type: sub.type as any,
              categoryId: sub.categoryId,
              accountId: sub.accountId,
              userId: sub.userId,
              externalId
            }
          });

          // Calcular próxima data
          const nextDate = new Date(sub.nextRun);
          if (sub.frequency === 'MONTHLY') {
            const currentMonth = nextDate.getMonth();
            nextDate.setMonth(currentMonth + 1);
            if (nextDate.getMonth() > (currentMonth + 1) % 12) {
              nextDate.setDate(0);
            }
          } else if (sub.frequency === 'WEEKLY') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (sub.frequency === 'YEARLY') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          // Atualizar assinatura
          await tx.recurringTransaction.update({
            where: { id: sub.id },
            data: { nextRun: nextDate }
          });
        });

        results.push(`Processed: ${sub.description}`);
      } catch (e: any) {
        if (e.message?.includes('Unique constraint')) {
           results.push(`Skipped (Duplicate): ${sub.description}`);
        } else {
           results.push(`Error: ${sub.description} - ${e.message}`);
        }
      }
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error) {
    console.error('Recurring Process Error:', error);
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}

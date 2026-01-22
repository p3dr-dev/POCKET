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
      if (!sub.nextRun) continue;

      // Usamos a data prevista da execução como data da transação, não o "agora"
      // Isso garante que se o cron atrasar, o registro financeiro continue correto.
      const scheduledDate = new Date(sub.nextRun);
      const dateKey = scheduledDate.toISOString().split('T')[0];
      const externalId = `RECURRING-${sub.id}-${dateKey}`;
      const absAmount = Math.abs(Number(sub.amount));

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Criar a transação com a data agendada
          await tx.transaction.create({
            data: {
              description: sub.description,
              amount: absAmount,
              date: scheduledDate, // Data original do vencimento
              type: sub.type as any,
              categoryId: sub.categoryId,
              accountId: sub.accountId,
              userId: sub.userId,
              externalId
            }
          });

          // 2. Calcular próxima data de execução de forma robusta
          const nextDate = new Date(scheduledDate);
          if (sub.frequency === 'MONTHLY') {
            const expectedMonth = (nextDate.getMonth() + 1) % 12;
            nextDate.setMonth(nextDate.getMonth() + 1);
            // Se o dia do mês "pulou" (ex: de 31/jan para 02/mar), retrocede para o último dia do mês correto
            if (nextDate.getMonth() !== expectedMonth) {
              nextDate.setDate(0);
            }
          } else if (sub.frequency === 'WEEKLY') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (sub.frequency === 'YEARLY') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          // 3. Atualizar assinatura para a próxima data
          await tx.recurringTransaction.update({
            where: { id: sub.id },
            data: { nextRun: nextDate }
          });
        });

        results.push(`Processed: ${sub.description} for ${dateKey}`);
      } catch (e: any) {
        // P2002 é erro de Unique Constraint no Prisma (Deduplicação)
        if (e.code === 'P2002' || e.message?.includes('Unique constraint')) {
           results.push(`Skipped (Already Processed): ${sub.description} for ${dateKey}`);
           
           // Mesmo que já tenha sido processado, precisamos avançar a data da assinatura
           // para que ela não fique "presa" no passado infinitamente tentando rodar
           const nextDate = new Date(scheduledDate);
           if (sub.frequency === 'MONTHLY') {
             nextDate.setMonth(nextDate.getMonth() + 1);
           } else if (sub.frequency === 'WEEKLY') {
             nextDate.setDate(nextDate.getDate() + 7);
           } else if (sub.frequency === 'YEARLY') {
             nextDate.setFullYear(nextDate.getFullYear() + 1);
           }

           await prisma.recurringTransaction.update({
             where: { id: sub.id },
             data: { nextRun: nextDate }
           });
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

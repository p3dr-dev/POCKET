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
    const nowIso = now.toISOString();
    
    // 1. Buscar assinaturas pendentes
    const dueSubs: any[] = await prisma.$queryRaw`
      SELECT * FROM "RecurringTransaction" 
      WHERE active = true AND "nextRun" <= ${nowIso}
    `;

    const results = [];

    // 2. Processar cada uma
    for (const sub of dueSubs) {
      const txId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const externalId = `SUB-${sub.id}-${nowIso.split('T')[0]}`;
      const absAmount = Math.abs(Number(sub.amount));

      try {
        // Criar transação (Usando executeRaw)
        await prisma.$executeRaw`
          INSERT INTO "Transaction" (id, description, amount, date, type, "categoryId", "accountId", "userId", "externalId", "createdAt", "updatedAt")
          VALUES (${txId}, ${sub.description}, ${absAmount}, ${nowIso}, ${sub.type}, ${sub.categoryId}, ${sub.accountId}, ${sub.userId}, ${externalId}, ${nowIso}, ${nowIso})
        `;

        // Calcular próxima data (Robusto para meses com menos dias)
        const nextDate = new Date(sub.nextRun);
        if (sub.frequency === 'MONTHLY') {
          const currentMonth = nextDate.getMonth();
          nextDate.setMonth(currentMonth + 1);
          // Se o mês "saltou" mais do que o esperado (ex: 31 Jan -> Mar), ajustar para o último dia do mês anterior
          if (nextDate.getMonth() > (currentMonth + 1) % 12) {
            nextDate.setDate(0);
          }
        } else if (sub.frequency === 'WEEKLY') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (sub.frequency === 'YEARLY') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        // Atualizar assinatura
        await prisma.$executeRaw`
          UPDATE "RecurringTransaction" 
          SET "nextRun" = ${nextDate.toISOString()}, "updatedAt" = ${nowIso}
          WHERE id = ${sub.id}
        `;

        results.push(`Processed: ${sub.description}`);
      } catch (e: any) {
        if (e.message?.includes('UNIQUE')) {
           results.push(`Skipped (Duplicate): ${sub.description}`);
        } else {
           results.push(`Error: ${sub.description} - ${e.message}`);
        }
      }
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}

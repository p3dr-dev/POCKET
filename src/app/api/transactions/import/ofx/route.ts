import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseOfx } from '@/lib/ofx-parser';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;

    if (!file || !accountId) {
      return NextResponse.json({ message: 'Arquivo e Conta são obrigatórios' }, { status: 400 });
    }

    const text = await file.text();
    const transactions = parseOfx(text);

    if (transactions.length === 0) {
      return NextResponse.json({ message: 'Nenhuma transação válida encontrada no OFX' }, { status: 400 });
    }

    // Buscar categoria padrão
    let defaultCategory = await prisma.category.findFirst({
      where: { userId, name: 'Geral' }
    });

    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: { name: 'Geral', type: 'EXPENSE', userId }
      });
    }

    let importedCount = 0;
    const duplicates = [];

    for (const t of transactions) {
      // Verificar duplicidade via ExternalID (FITID)
      const exists = await prisma.transaction.findFirst({
        where: { 
          externalId: t.fitId,
          accountId // FITID é único por banco, mas garantimos por conta
        }
      });

      if (exists) {
        duplicates.push(t.fitId);
        continue;
      }

      await prisma.transaction.create({
        data: {
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date,
          accountId,
          categoryId: defaultCategory.id,
          userId,
          externalId: t.fitId, // A Chave Mágica da Deduplicação
          payee: t.memo // OFX Memo often has useful info
        }
      });
      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      duplicates: duplicates.length,
      message: `${importedCount} transações importadas. ${duplicates.length} duplicatas ignoradas.`
    });

  } catch (error) {
    console.error('OFX Import Error:', error);
    return NextResponse.json({ message: 'Erro ao processar OFX' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { text } = await request.json();
    const userId = session.user.id;
    
    const [categories, accounts] = await Promise.all([
      prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
      prisma.account.findMany({ where: { userId }, select: { id: true, name: true } })
    ]);

    const categoryNames = categories.map(c => c.name).join(', ');
    const accountNames = accounts.map(a => a.name).join(', ');
    const today = new Date().toISOString().split('T')[0];

    const system = `Você é um processador de transações financeiras.
    Analise o texto do usuário e extraia os dados para o formato JSON.
    
    REGRAS:
    1. Se não houver data, use hoje: ${today}.
    2. Identifique se é INCOME, EXPENSE ou TRANSFER.
    3. Para TRANSFER, identifique a conta de origem (fromAccount) e destino (toAccount).
    4. Escolha a categoria MAIS PRÓXIMA de: [${categoryNames}].
    5. Escolha a conta MAIS PRÓXIMA de: [${accountNames}].
    6. O valor deve ser um número positivo.
    
    Retorne APENAS o JSON:
    {
      "description": "...", 
      "amount": 0.00, 
      "date": "YYYY-MM-DD", 
      "type": "INCOME"|"EXPENSE"|"TRANSFER", 
      "categoryName": "...", 
      "accountName": "...",
      "fromAccountName": "...",
      "toAccountName": "..."
    }`;

    const aiResponse = await askAI(`Texto: "${text}"`, system);
    
    let parsed: any = {};
    try {
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0].trim());
      } else {
        throw new Error('JSON não encontrado');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({ message: 'Não foi possível entender o texto. Tente ser mais específico.' }, { status: 422 });
    }

    // Smart Matching Utility
    const findMatch = (aiName: string, list: { id: string, name: string }[]) => {
      if (!aiName) return null;
      const normalizedAi = aiName.toLowerCase();
      return list.find(item => {
        const normalizedItem = item.name.toLowerCase();
        return normalizedItem === normalizedAi || normalizedItem.includes(normalizedAi) || normalizedAi.includes(normalizedItem);
      });
    };

    const category = findMatch(parsed.categoryName, categories);
    const account = findMatch(parsed.accountName, accounts);
    const fromAccount = findMatch(parsed.fromAccountName, accounts);
    const toAccount = findMatch(parsed.toAccountName, accounts);

    return NextResponse.json({
      ...parsed,
      categoryId: category?.id,
      accountId: account?.id,
      fromAccountId: fromAccount?.id,
      toAccountId: toAccount?.id
    });
  } catch (error) {
    console.error('Magic Parse Error:', error);
    return NextResponse.json({ message: 'Erro ao interpretar texto' }, { status: 500 });
  }
}

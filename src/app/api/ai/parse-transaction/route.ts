import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    // Obter categorias e contas reais para a IA fazer o match
    const [categories, accounts] = await Promise.all([
      prisma.$queryRaw`SELECT id, name FROM "Category"`,
      prisma.$queryRaw`SELECT id, name FROM "Account"`
    ]) as [{ id: string, name: string }[], { id: string, name: string }[]];

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
    
    const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

    // Resolver IDs
    const category = categories.find(c => c.name.toLowerCase() === parsed.categoryName?.toLowerCase());
    const account = accounts.find(a => a.name.toLowerCase() === parsed.accountName?.toLowerCase());

    return NextResponse.json({
      ...parsed,
      categoryId: category?.id,
      accountId: account?.id
    });
  } catch (error) {
    console.error('Magic Parse Error:', error);
    return NextResponse.json({ message: 'Erro ao interpretar texto' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const stats = await request.json();
    
    console.log('--- AI Insights Request ---');
    console.log('Stats received:', stats);

    const prompt = `Você é o estrategista financeiro pessoal do usuário (POCKET). 
    Analise os dados financeiros abaixo e forneça um insight curto (máx 3 frases), direto e acionável. Foque no maior problema ou oportunidade.
    
    DADOS ATUAIS (Mês Atual):
    - Saldo Líquido Total: R$ ${stats.liquid?.toFixed(2)}
    - Patrimônio (Net Worth): R$ ${stats.netWorth?.toFixed(2)}
    - Receita Período: R$ ${stats.periodIncomes?.toFixed(2)}
    - Despesas Período: R$ ${stats.periodExpenses?.toFixed(2)}
    - Dívidas Pendentes: R$ ${stats.monthDebtsRemaining?.toFixed(2)}
    - Maiores Gastos: ${stats.topCategories || 'Sem dados suficientes'}
    
    DIRETRIZES DE CONSULTORIA:
    1. Se houver Dívidas Pendentes > 0, priorize o alerta sobre elas.
    2. Se as Despesas estiverem altas, cite especificamente a categoria vilã dos "Maiores Gastos".
    3. Se o Saldo for alto e dívidas zero, sugira investimento agressivo.
    4. Tom de voz: Executivo de Banco Privado, motivador mas severo com gastos fúteis.
    5. Retorne APENAS o texto do conselho. Nada de "Olá" ou "Com base nos dados".`;

    console.log('Sending prompt to AI...');
    const content = await askAI(prompt, "Você é um consultor de Wealth Management de elite.");
    console.log('AI Response:', content);
    
    if (!content) {
      throw new Error('Sem resposta da IA');
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI Insights Error:', error);
    return NextResponse.json({ 
      content: "O consultor virtual está indisponível no momento. Verifique se o serviço de IA local está ativo." 
    });
  }
}

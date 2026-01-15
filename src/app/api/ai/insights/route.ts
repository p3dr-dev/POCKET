import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const stats = await request.json();
    
    const prompt = `Você é o estrategista financeiro do sistema POCKET. 
    Analise os dados atuais do usuário e forneça um insight curto (máx 3 frases), motivador e altamente estratégico.
    
    DADOS ATUAIS:
    - Saldo Líquido: R$ ${stats.liquid?.toFixed(2)}
    - Patrimônio (Saldo + Investimentos): R$ ${stats.netWorth?.toFixed(2)}
    - Receita no período selecionado: R$ ${stats.periodIncomes?.toFixed(2)}
    - Despesas no período selecionado: R$ ${stats.periodExpenses?.toFixed(2)}
    - Dívidas Pendentes (Mês): R$ ${stats.monthDebtsRemaining?.toFixed(2)}
    - Meta de Faturamento Diário: R$ ${stats.dailyGoal?.toFixed(2)}
    
    DIRETRIZES:
    1. Se a Meta Diária for alta em relação à receita, sugira foco em novas fontes ou cortes urgentes.
    2. Se o Saldo Líquido for alto, sugira aportar mais em investimentos.
    3. Seja direto, use um tom premium e profissional.
    4. Responda APENAS o texto do insight, sem saudações ou explicações.`;

    const content = await askAI(prompt, "Você é um consultor de Wealth Management de elite.");
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ content: "Continue monitorando seus lançamentos para uma análise precisa." });
  }
}

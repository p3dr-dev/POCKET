import { askAI } from '@/lib/ai';
import { TransactionService } from './transaction.service';
import prisma from '@/lib/prisma';

type IntentType = 'TRANSACTION_CREATE' | 'DATA_QUERY' | 'ADVICE' | 'UNKNOWN';

interface AIActionResponse {
  type: IntentType;
  message: string;
  data?: any;
}

export class AIRouterService {
  static async process(userId: string, input: string): Promise<AIActionResponse> {
    // 1. Identificar Intenção via IA
    const intentPrompt = `
      Analise a entrada do usuário e classifique em uma das intenções abaixo (responda APENAS o JSON):
      
      1. TRANSACTION_CREATE: O usuário quer registrar um gasto, receita ou transferência. (Ex: "Gastei 50", "Recebi 100", "Transferi 20")
      2. DATA_QUERY: O usuário quer saber sobre seus dados passados ou atuais. (Ex: "Quanto gastei em mercado?", "Qual meu saldo?")
      3. ADVICE: O usuário quer uma opinião, dica ou análise subjetiva. (Ex: "Estou gastando muito?", "Como investir melhor?")
      
      Entrada: "${input}"
      
      Formato JSON esperado:
      { "type": "INTENT_NAME", "confidence": 0-1, "extracted_data": { ...campos relevantes se houver } }
    `;

    const rawIntent = await askAI(intentPrompt, "Você é um classificador de intenções preciso. Responda apenas JSON válido.");
    let intent;
    
    try {
      // Limpeza básica do JSON (remover blocos de código se a IA mandar ```json ... ```)
      const cleanJson = rawIntent?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      intent = JSON.parse(cleanJson);
    } catch (e) {
      return { type: 'UNKNOWN', message: 'Não entendi o que você quis dizer.' };
    }

    // 2. Roteamento
    switch (intent.type) {
      case 'TRANSACTION_CREATE':
        return await this.handleTransaction(userId, input); // Passamos o input original para parsing detalhado
      case 'DATA_QUERY':
        return await this.handleQuery(userId, input);
      case 'ADVICE':
        return await this.handleAdvice(userId, input);
      default:
        return { type: 'UNKNOWN', message: 'Não consegui processar sua solicitação.' };
    }
  }

  private static async handleTransaction(userId: string, input: string): Promise<AIActionResponse> {
    // Parser especializado para extrair dados da transação
    const parsePrompt = `
      Extraia os dados financeiros desta frase para JSON.
      Frase: "${input}"
      Hoje é: ${new Date().toISOString()}
      
      Campos: description, amount (positivo), type (INCOME/EXPENSE), date (ISO), accountName (opcional)
    `;
    
    const rawData = await askAI(parsePrompt, "Extraia dados JSON estritos.");
    try {
      const cleanJson = rawData?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const data = JSON.parse(cleanJson);
      
      // Buscar conta padrão se não especificada
      let accountId;
      if (data.accountName) {
        const acc = await prisma.account.findFirst({
          where: { userId, name: { contains: data.accountName, mode: 'insensitive' } }
        });
        accountId = acc?.id;
      }
      
      if (!accountId) {
        const defaultAcc = await prisma.account.findFirst({ where: { userId } });
        accountId = defaultAcc?.id;
      }

      if (!accountId) return { type: 'TRANSACTION_CREATE', message: 'Nenhuma conta encontrada para registrar.' };

      const tx = await TransactionService.create({
        userId,
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        date: data.date,
        accountId: accountId
      });

      return { 
        type: 'TRANSACTION_CREATE', 
        message: `Registrado: ${tx.description} (R$ ${tx.amount})`, 
        data: tx 
      };
    } catch (e) {
      return { type: 'TRANSACTION_CREATE', message: 'Entendi que é uma transação, mas faltam detalhes (valor ou descrição).' };
    }
  }

  private static async handleQuery(userId: string, input: string): Promise<AIActionResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. Buscas Paralelas Eficientes (Agregações)
    const [balanceAgg, expenseAgg, incomeAgg, categoryAgg, recentTxs] = await Promise.all([
      // Saldo Geral (Income - Expense)
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true }
      }),
      // Gastos do Mês
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      // Ganhos do Mês
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      // Top 5 Categorias do Mês
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5
      }),
      // Últimas 5 transações para contexto recente
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        select: { description: true, amount: true, date: true, type: true }
      })
    ]);

    // 2. Resolver nomes das categorias
    const categoryIds = categoryAgg.map(c => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });

    // 3. Montar Sumário para a IA
    const totalIncome = balanceAgg.find(b => b.type === 'INCOME')?._sum.amount || 0;
    const totalExpense = balanceAgg.find(b => b.type === 'EXPENSE')?._sum.amount || 0;
    const currentBalance = totalIncome - totalExpense;
    
    const monthExpense = expenseAgg._sum.amount || 0;
    const monthIncome = incomeAgg._sum.amount || 0;

    const topCategories = categoryAgg.map(c => {
      const name = categories.find(cat => cat.id === c.categoryId)?.name || 'Outros';
      return `${name}: R$ ${c._sum.amount?.toFixed(2)}`;
    }).join(', ');

    const context = JSON.stringify({
      current_balance: currentBalance.toFixed(2),
      month_stats: {
        income: monthIncome.toFixed(2),
        expense: monthExpense.toFixed(2),
        balance: (monthIncome - monthExpense).toFixed(2)
      },
      top_expenses_this_month: topCategories,
      recent_activity: recentTxs.map(t => `${t.description} (${t.amount})`).join(', ')
    });

    const answer = await askAI(
      `Dados Financeiros (Sumário): ${context}.
       Pergunta do usuário: "${input}".
       
       Responda de forma direta, analítica e amigável. Use formatação Markdown.`,
      "Você é um CFO pessoal (Chief Financial Officer). Seja conciso."
    );

    return { type: 'DATA_QUERY', message: answer || 'Não consegui analisar seus dados no momento.' };
  }

  private static async handleAdvice(userId: string, input: string): Promise<AIActionResponse> {
    const answer = await askAI(input, "Você é um conselheiro financeiro sábio e conservador.");
    return { type: 'ADVICE', message: answer || 'Sem conselho disponível.' };
  }
}

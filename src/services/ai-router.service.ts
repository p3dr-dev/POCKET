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
    // Implementação simplificada: Passar para a IA responder com base em um resumo
    // Em produção, isso faria queries SQL reais. Por enquanto, vamos dar o contexto do mês.
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      select: { description: true, amount: true, type: true, category: { select: { name: true } } }
    });

    const context = JSON.stringify(transactions);
    const answer = await askAI(
      `Com base nestes dados do mês atual (JSON): ${context}. Responda à pergunta do usuário: "${input}". Seja breve.`,
      "Você é um analista financeiro."
    );

    return { type: 'DATA_QUERY', message: answer || 'Sem resposta.' };
  }

  private static async handleAdvice(userId: string, input: string): Promise<AIActionResponse> {
    const answer = await askAI(input, "Você é um conselheiro financeiro sábio e conservador.");
    return { type: 'ADVICE', message: answer || 'Sem conselho disponível.' };
  }
}

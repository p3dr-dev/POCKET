import { askAI } from '@/lib/ai';
import { TransactionService } from './transaction.service';
import { AiContextService } from './ai-context.service';
import prisma from '@/lib/prisma';

type IntentType = 'TRANSACTION_CREATE' | 'DATA_QUERY' | 'ADVICE' | 'FINANCIAL_AUDIT' | 'UNKNOWN';

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
      
      1. TRANSACTION_CREATE: Registrar gasto/receita.
      2. DATA_QUERY: Perguntas sobre fatos (Ex: "Quanto gastei em mercado?", "Qual meu saldo?").
      3. FINANCIAL_AUDIT: Análise profunda, diagnósticos, revisão de assinaturas e dicas de economia. (Ex: "Como está minha vida financeira?", "Onde estou gastando muito?", "Auditoria").
      4. ADVICE: Opiniões subjetivas gerais.
      
      Entrada: "${input}"
      
      Formato JSON esperado:
      { "type": "INTENT_NAME" }
    `;

    const rawIntent = await askAI(intentPrompt, "Classificador de intenções JSON estrito.");
    let intent;
    
    try {
      const cleanJson = rawIntent?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      intent = JSON.parse(cleanJson);
    } catch (e) {
      return { type: 'UNKNOWN', message: 'Não entendi o que você quis dizer.' };
    }

    // 2. Roteamento
    switch (intent.type) {
      case 'TRANSACTION_CREATE':
        return await this.handleTransaction(userId, input);
      case 'DATA_QUERY':
        return await this.handleQuery(userId, input);
      case 'FINANCIAL_AUDIT':
        return await this.handleAudit(userId, input);
      case 'ADVICE':
        return await this.handleAdvice(userId, input);
      default:
        // Fallback to Advice/Query if unknown
        return await this.handleQuery(userId, input);
    }
  }

  private static async handleTransaction(userId: string, input: string): Promise<AIActionResponse> {
    // Parser especializado
    const parsePrompt = `
      Extraia dados financeiros para JSON.
      Frase: "${input}"
      Hoje: ${new Date().toISOString()}
      
      Campos: description, amount (num), type (INCOME/EXPENSE), date (ISO), accountName (opcional)
    `;
    
    const rawData = await askAI(parsePrompt, "Parser JSON financeiro.");
    try {
      const cleanJson = rawData?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
      const data = JSON.parse(cleanJson);
      
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

      if (!accountId) return { type: 'TRANSACTION_CREATE', message: 'Nenhuma conta encontrada.' };

      const tx = await TransactionService.create({
        userId,
        description: data.description || 'Transação rápida',
        amount: Number(data.amount),
        type: data.type || 'EXPENSE',
        date: data.date || new Date(),
        accountId: accountId
      });

      return { 
        type: 'TRANSACTION_CREATE', 
        message: `✅ Registrado: ${tx.description} (R$ ${tx.amount})`, 
        data: tx 
      };
    } catch (e) {
      return { type: 'TRANSACTION_CREATE', message: 'Não consegui entender os detalhes da transação.' };
    }
  }

  private static async handleAudit(userId: string, input: string): Promise<AIActionResponse> {
    const context = await AiContextService.buildContext(userId);

    const answer = await askAI(
      `CONTEXTO FINANCEIRO COMPLETO (JSON):
       ${JSON.stringify(context, null, 2)}
       
       PERGUNTA/PEDIDO: "${input}"
       
       INSTRUÇÃO: Faça um diagnóstico brutal e honesto. 
       1. Verifique se o saldo futuro (forecast) é perigoso.
       2. Analise se as assinaturas (subscriptions) estão pesando muito.
       3. Veja se o "Hustle" (Meta Diária) está sendo cumprido.
       4. Identifique categorias de gasto que parecem fora de controle.
       
       Seja sarcástico mas útil (Estilo Pickle Rick). Use Markdown denso com listas e negrito.`,
      "Você é o Pocket AI Auditor. Você não tem medo de dizer a verdade."
    );

    return { type: 'FINANCIAL_AUDIT', message: answer || 'Sem diagnóstico.' };
  }

  private static async handleQuery(userId: string, input: string): Promise<AIActionResponse> {
    // 1. Build Full Context
    const context = await AiContextService.buildContext(userId);

    // 2. Ask AI with Context
    const answer = await askAI(
      `CONTEXTO FINANCEIRO DO USUÁRIO (JSON):
       ${JSON.stringify(context, null, 2)}
       
       PERGUNTA DO USUÁRIO: "${input}"
       
       INSTRUÇÃO: Use os dados do contexto para responder com precisão. Se não souber, diga que não encontrou nos dados. Use Markdown.`,
      "Você é o Pocket AI, um assistente financeiro pessoal ultra-competente. Você tem acesso total aos dados do usuário."
    );

    return { type: 'DATA_QUERY', message: answer || 'Sem resposta.' };
  }

  private static async handleAdvice(userId: string, input: string): Promise<AIActionResponse> {
    const context = await AiContextService.buildContext(userId);

    const answer = await askAI(
      `CONTEXTO FINANCEIRO (JSON):
       ${JSON.stringify(context, null, 2)}
       
       PEDIDO DE CONSELHO: "${input}"
       
       INSTRUÇÃO: Dê um conselho acionável, curto e direto, baseado na situação financeira real do usuário (Dívidas, Investimentos, Saldo).`,
      "Você é um consultor financeiro sênior. Seja honesto e direto."
    );
    
    return { type: 'ADVICE', message: answer || 'Sem conselho.' };
  }
}

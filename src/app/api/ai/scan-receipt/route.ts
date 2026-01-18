import { NextResponse } from 'next/server';
import { askAI } from '@/lib/ai';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import os from 'os';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let tempFilePath = '';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ message: 'Arquivo não enviado' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const ext = file.type.startsWith('image/') ? 
      (file.type.includes('png') ? '.png' : '.jpg') : 
      '.pdf';
      
    // Usar diretório temporário do SO
    const fileName = `receipt_${Date.now()}${ext}`;
    tempFilePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tempFilePath, buffer);

    let text = "";

    if (file.type.startsWith('image/')) {
      // Remover Tesseract.js e usar a IA para descrever a imagem
      const base64Image = buffer.toString('base64');
      const imagePrompt = `Descreva o texto contido nesta imagem. Extraia qualquer informação financeira relevante, como valores, datas, descrições, recebedores ou pagadores. Retorne apenas o texto puro da imagem.`;
      
      const aiResponse = await askAI(imagePrompt, "Você é um assistente de visão computacional especializado em extrair texto de imagens, focando em dados financeiros.", base64Image);
      text = aiResponse || ''; // Se a IA não retornar texto, assume vazio
      
    } else {
      // Process PDF with external script
      const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf.js');
      text = execSync(`node "${scriptPath}" "${tempFilePath}"`, { encoding: 'utf8' });
    }

    if (!text || text.length < 10) return NextResponse.json({ message: 'Não foi possível ler o comprovante (Texto insuficiente ou IA não retornou)' }, { status: 400 });

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;

    const [categories, accounts] = await Promise.all([
      prisma.$queryRaw`SELECT id, name FROM "Category" WHERE "userId" = ${userId}`,
      prisma.$queryRaw`SELECT id, name FROM "Account" WHERE "userId" = ${userId}`
    ]) as [{ id: string, name: string }[], { id: string, name: string }[]];

    const categoryList = categories.map(c => c.name).join(', ');
    const accountList = accounts.map(a => a.name).join(', ');

    const prompt = `Você é um scanner de comprovantes bancários de alta precisão. 
    Analise o texto abaixo e extraia os dados financeiros.
    
    REGRAS DE OURO:
    1. Identifique se é uma TRANSFERÊNCIA entre contas do mesmo titular (mesmo nome/CPF) ou para um terceiro.
    2. Se for transferência entre contas do usuário, use o tipo "TRANSFER".
    3. Identifique a CONTA DE ORIGEM (fromAccountName) e a CONTA DE DESTINO (toAccountName) com base em: [${accountList}].
    4. Se não for transferência, use INCOME ou EXPENSE e escolha a categoria MAIS PRÓXIMA de: [${categoryList}].
    5. Extraia VALOR, DATA (YYYY-MM-DD), DESCRIÇÃO, RECEBEDOR (payee), PAGADOR (payer) e ID da Transação (bankRefId).
    
    Retorne APENAS um JSON:
    {
      "type": "TRANSFER"|"INCOME"|"EXPENSE",
      "description": "...", 
      "amount": 0.00, 
      "date": "YYYY-MM-DD", 
      "categoryName": "...", 
      "payee": "...", 
      "payer": "...", 
      "bankRefId": "...",
      "fromAccountName": "...",
      "toAccountName": "..."
    }
    
    Texto do Comprovante:
    ${text}`;

    const aiResponse = await askAI(prompt, "Você é um assistente de entrada de dados financeiros especializado em Open Finance Brasil.");
    
    // Robust JSON Extraction
    let parsed: any = {};
    try {
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Clean potential markdown or extra text around JSON
        let jsonStr = jsonMatch[0].trim();
        parsed = JSON.parse(jsonStr);
      } else {
        throw new Error('JSON não encontrado na resposta da IA');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({ message: 'A IA retornou um formato inválido. Tente novamente ou use a entrada manual.' }, { status: 422 });
    }

    // Gerar um hash único baseado nos dados do comprovante para evitar duplicidade
    const externalId = parsed.bankRefId ? 
      crypto.createHash('md5').update(parsed.bankRefId).digest('hex') : 
      null;

    // Smart Matching for Category
    const category = categories.find(c => {
      const name = c.name.toLowerCase();
      const aiName = parsed.categoryName?.toLowerCase() || '';
      return name === aiName || name.includes(aiName) || aiName.includes(name);
    });
    
    // Smart Matching for Accounts
    const findAccount = (aiName: string) => {
      if (!aiName) return null;
      const normalizedAi = aiName.toLowerCase();
      return accounts.find(a => {
        const normalizedAcc = a.name.toLowerCase();
        return normalizedAcc === normalizedAi || normalizedAcc.includes(normalizedAi) || normalizedAi.includes(normalizedAcc);
      });
    };

    const fromAccount = findAccount(parsed.fromAccountName);
    const toAccount = findAccount(parsed.toAccountName);

    // Lógica de conta principal: se for INCOME, a conta é a de destino. Se for EXPENSE/TRANSFER, é a de origem.
    const finalAccountId = parsed.type === 'INCOME' ? 
      (toAccount?.id || accounts[0]?.id) : 
      (fromAccount?.id || accounts[0]?.id);

    return NextResponse.json({
      ...parsed,
      categoryId: category?.id,
      fromAccountId: fromAccount?.id,
      toAccountId: toAccount?.id,
      accountId: finalAccountId,
      externalId
    });

  } catch (error) {
    console.error('Scan Receipt Error:', error);
    return NextResponse.json({ message: 'Erro ao processar comprovante' }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
  }
}

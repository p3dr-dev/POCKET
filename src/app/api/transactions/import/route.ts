import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { askAI } from '@/lib/ai';
import { auth } from '@/auth';
import { parseOfx } from '@/lib/ofx-parser';

export const dynamic = 'force-dynamic';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  payer?: string;
  payee?: string;
  bankRefId?: string;
  fitId?: string;
}

// Fallback de categorização baseada em regras simples
function getFallbackCategory(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('uber') || desc.includes('99') || desc.includes('posto') || desc.includes('combustivel')) return 'Transporte';
  if (desc.includes('ifood') || desc.includes('restaurante') || desc.includes('padaria') || desc.includes('mercado')) return 'Alimentação';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon')) return 'Assinaturas';
  if (desc.includes('farmacia') || desc.includes('drogaria') || desc.includes('medico')) return 'Saúde';
  if (desc.includes('pix') || desc.includes('transferencia')) return 'Transferências';
  return 'Outros';
}

async function batchGetSmartCategories(transactions: ParsedTransaction[], categories: { name: string, type: string }[]) {
  try {
    const descriptions = transactions.map(t => t.description);
    const categoryNames = categories.map(c => c.name).join(', ');
    const system = `Você é um classificador financeiro. Categorias existentes: [${categoryNames}]. 
    Regras:
    1. Para cada descrição, retorne APENAS o nome da categoria.
    2. Se não encaixar em nenhuma, crie uma nova categoria curta e precisa.
    3. Retorne um JSON array de strings: ["Cat1", "Cat2", ...]`;
    
    // Tenta IA
    const result = await askAI(`Classifique estas ${descriptions.length} transações: ${JSON.stringify(descriptions)}`, system);
    const cleaned = result?.match(/[\[\s\S]*\]/);
    if (cleaned) {
      return JSON.parse(cleaned[0]) as string[];
    }
    throw new Error('AI Failed');
  } catch { 
    // Fallback regex
    return transactions.map(t => getFallbackCategory(t.description));
  }
}

/**
 * GERA FINGERPRINT ÚNICO
 */
function generateFingerprint(tx: ParsedTransaction, accountId: string) {
  const amount = Math.abs(tx.amount).toFixed(2);
  const dateStr = tx.date; 
  // Normalizar descrição: minúsculas e sem espaços extras
  const cleanDesc = tx.description.toLowerCase().replace(/\s+/g, ' ').trim();
  const content = `${dateStr}|${cleanDesc}|${amount}|${accountId}|${tx.bankRefId || ''}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

function cleanHeaderTerms(text: string): string {
    const headerTerms = [
        "Nome do Pagador", "Nome do Recebedor", "ID da Transação", "Valor", 
        "Status", "Data", "Pagador", "Recebedor", "Beneficiário", 
        "Código de", "Linha", "ID Pix", "Banco do", "Nome do destinatário", "Dados"
    ];
    let cleaned = text;
    headerTerms.forEach(term => {
        const regex = new RegExp(term, "gi");
        cleaned = cleaned.replace(regex, "");
    });
    return cleaned.replace(/\s+/g, " ").trim();
}

function determineDirection(amount: number, payer: string, payee: string, accountOwner: string) {
  const ownerUpper = accountOwner.toUpperCase().trim();
  const payerUpper = payer.toUpperCase().trim();
  const payeeUpper = payee.toUpperCase().trim();
  
  let finalAmount = Math.abs(amount);
  let type: 'INCOME' | 'EXPENSE' = 'INCOME';

  if (payerUpper && ownerUpper && (payerUpper.includes(ownerUpper) || ownerUpper.includes(payerUpper))) {
      finalAmount = -finalAmount;
      type = 'EXPENSE';
  } 
  else if (payeeUpper && ownerUpper && (payeeUpper.includes(ownerUpper) || ownerUpper.includes(payeeUpper))) {
      finalAmount = Math.abs(finalAmount);
      type = 'INCOME';
  }
  else if (amount < 0) {
      type = 'EXPENSE';
  }
  
  return { finalAmount, type };
}

function parsePicPayDispatcher(rawText: string): ParsedTransaction[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
  let accountOwner = "";
  for(let i=0; i<15; i++) {
     if(lines[i] && !lines[i].includes("PicPay") && !lines[i].includes("CPF:") && !lines[i].includes("Relatório") && lines[i].length > 5 && !lines[i].match(/\d/)) {
         accountOwner = lines[i];
         break;
     }
  }

  if (rawText.includes("Relatório de Pagamentos de Boletos")) return parsePicPayBoleto(lines, accountOwner);
  else if (rawText.includes("Relatório de Transferências Entre Contas PicPay")) return parsePicPayInternal(lines, accountOwner);
  else if (rawText.includes("Relatório de Transferências PIX") || rawText.includes("Relatório de Transferência PIX")) return parsePicPayPix(lines, accountOwner);

  return [];
}

function parsePicPayInternal(lines: string[], accountOwner: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  let currentBlock: string[] = [];
  const statusRegex = /^(Concluída|Cancelada|Em análise|Devolvida)$/i;

  for (let i = 0; i < lines.length; i++) {
    currentBlock.push(lines[i]);
    if (statusRegex.test(lines[i])) {
       if (lines[i].toLowerCase() === 'concluída') {
           const tx = processPicPayBlockGeneric(currentBlock, accountOwner);
           if (tx) transactions.push(tx);
       }
       currentBlock = [];
    }
  }
  return transactions;
}

function parsePicPayPix(lines: string[], accountOwner: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const pixIdRegex = /^[ED]\d{10,}[a-zA-Z0-9]+/;

  for (let i = 0; i < lines.length; i++) {
    const dateMatch = lines[i].match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      let bankRefId = "";
      let amount = 0;
      let payee = "";
      let payer = "";
      
      const preLines = lines.slice(Math.max(0, i - 3), i).filter(l => !l.match(/\d{2}\/\d{2}\/\d{4}/) && l.length > 3);
      payer = cleanHeaderTerms(preLines.join(" "));

      for (let j = 1; j <= 10; j++) { 
        if (i + j >= lines.length) break;
        const line = lines[i + j];
        if (line.match(/(\d{2}\/\d{2}\/\d{4})/) && !line.includes(dateStr)) break;
        if (pixIdRegex.test(line) && !bankRefId) bankRefId = line;
        
        const vMatch = line.match(/R\$\s*(-?[\d.,]+)/);
        if (vMatch && amount === 0) {
             const raw = vMatch[1].replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
             amount = parseFloat(raw);
        }
        
        if (amount !== 0 && bankRefId && !payee) {
            const potentialPayee = lines[i + j + 1];
            if (potentialPayee && !potentialPayee.match(/R\$/) && !potentialPayee.match(/^[ED]\d/) && potentialPayee.length > 3) payee = potentialPayee;
        }
      }

      if (amount !== 0) {
          const { finalAmount, type } = determineDirection(amount, payer, payee, accountOwner);
          transactions.push({
              date: dateStr.split('/').reverse().join('-'),
              description: type === 'EXPENSE' ? `Pix enviado: ${payee || 'Destinatário'}` : `Pix recebido: ${payer || 'Remetente'}`,
              amount: finalAmount,
              payer: payer || "Desconhecido",
              payee: payee || "Desconhecido",
              bankRefId: bankRefId || undefined
          });
      }
    }
  }
  return transactions;
}

function parsePicPayBoleto(lines: string[], accountOwner: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  for (let i = 0; i < lines.length; i++) {
    const dateMatch = lines[i].match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
        const dateStr = dateMatch[1];
        let amount = 0;
        let isSettled = false;
        
        for(let k=0; k<=5; k++) {
            const l = lines[i+k] || "";
            const vMatch = l.match(/R\$\s*([\d.,]+)/);
            if(vMatch && amount === 0) {
                const raw = vMatch[1].replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
                amount = parseFloat(raw);
            }
            if(l.toLowerCase().includes("liquidado")) isSettled = true;
        }

        if (amount > 0 && isSettled) {
            let payee = "Beneficiário";
            for(let k=1; k<=8; k++) {
                const prev = lines[i-k];
                if(!prev) continue;
                const isBarcode = prev.replace(/[^0-9]/g, '').length > 25;
                if (!isBarcode && prev.length > 3 && !prev.includes("Código") && !prev.includes("Beneficiário")) {
                    payee = cleanHeaderTerms(prev);
                    break;
                }
            }
            transactions.push({
                date: dateStr.split('/').reverse().join('-'),
                description: `Boleto: ${payee}`,
                amount: -Math.abs(amount),
                payer: accountOwner,
                payee: payee
            });
        }
    }
  }
  return transactions;
}

function processPicPayBlockGeneric(lines: string[], accountOwner: string): ParsedTransaction | null {
  const dateIndex = lines.findIndex(l => l.match(/(\d{2}\/\d{2}\/\d{4})/));
  if (dateIndex === -1) return null;
  const dateMatch = lines[dateIndex].match(/(\d{2}\/\d{2}\/\d{4})/);
  const dateStr = dateMatch ? dateMatch[1] : "";
  const startIndex = Math.max(0, dateIndex - 3);
  let payer = cleanHeaderTerms(lines.slice(startIndex, dateIndex).join(" "));
  let amount = 0;
  let bankRefId = "";
  let valueIndex = -1;
  const idRegex = /(\d{9,})/

  for (let i = dateIndex + 1; i < lines.length; i++) {
    const l = lines[i];
    const vMatch = l.match(/R\$\s*(-?[\d.,]+)/);
    const idMatch = l.match(idRegex);
    if (idMatch && !bankRefId) bankRefId = idMatch[1];
    if (vMatch) {
      const rawValue = vMatch[1].replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
      amount = parseFloat(rawValue);
      valueIndex = i;
    }
  }
  if (valueIndex === -1) return null;
  const payee = lines.slice(valueIndex + 1, lines.length - 1).join(" ");
  const { finalAmount, type } = determineDirection(amount, payer, payee, accountOwner);
  const description = type === "EXPENSE" ? `Envio para ${payee}` : `Recebido de ${payer}`;

  return {
    date: dateStr.split('/').reverse().join('-'),
    description,
    amount: finalAmount,
    payer,
    payee,
    bankRefId
  };
}

async function parseAdvancedPDF(buffer: Buffer): Promise<ParsedTransaction[]> {
  const tempFilePath = path.join(process.cwd(), `temp_${Date.now()}.pdf`);
  fs.writeFileSync(tempFilePath, buffer);
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf.js');
    const rawText = execSync(`node "${scriptPath}" "${tempFilePath}"`, { encoding: 'utf8' });
    const picPayTxs = parsePicPayDispatcher(rawText);
    if (picPayTxs.length > 0) return picPayTxs;

    const cleanLines = rawText.split('\n').map(l => l.trim()).filter(l => l);
    const transactions: ParsedTransaction[] = [];
    for (let i = 0; i < cleanLines.length; i++) {
      const dateMatch = cleanLines[i].match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        for (let j = 1; j <= 5; j++) {
          const nextLine = cleanLines[i + j] || "";
          const valueMatch = nextLine.match(/(-?\s*R\$\s*[\d.,]+)/);
          if (valueMatch) {
            let description = "";
            for (let k = 1; k < j; k++) {
              if (!cleanLines[i+k].match(/\d{2}:\d{2}:\d{2}/)) description += cleanLines[i+k] + " ";
            }
            const rawValue = valueMatch[1].replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
            let amount = parseFloat(rawValue);
            transactions.push({
              date: dateStr.split('/').reverse().join('-'),
              description: description.trim() || "Movimentação",
              amount
            });
            i += j; 
            break;
          }
        }
      }
    }
    return transactions;
  } finally {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
}

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.split('\n');
  const transactions: ParsedTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.includes(';') ? line.split(';') : line.split(',');
    if (parts.length < 3) continue;
    let dateStr = parts[0].trim();
    let description = parts[1].trim();
    let amountStr = parts[2].trim();
    if (parts[1].match(/^-?[\d.,]+$/) && !parts[2].match(/^-?[\d.,]+$/)) {
       amountStr = parts[1].trim();
       description = parts[2].trim();
    }
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }
    let amount = 0;
    try { amount = parseFloat(amountStr.replace(/[^\d.,-]/g, '').replace(',', '.')); } catch {}
    if (amount !== 0 && description) {
      transactions.push({ date: dateStr, description: description.replace(/"/g, ''), amount });
    }
  }
  return transactions;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;
    const userId = session.user.id;

    // Validate Account Ownership
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId }
    });
    if (!account) {
      return NextResponse.json({ message: 'Conta inválida ou não encontrada' }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    let parsedTxs: ParsedTransaction[] = [];
    if (file.name.toLowerCase().endsWith('.pdf')) parsedTxs = await parseAdvancedPDF(buffer);
    else if (file.name.toLowerCase().endsWith('.csv')) parsedTxs = parseCSV(buffer.toString('utf-8'));
    else if (file.name.toLowerCase().endsWith('.ofx')) {
       const rawOfx = parseOfx(buffer.toString('utf-8'));
       parsedTxs = rawOfx.map(t => ({
         date: t.date.toISOString().split('T')[0],
         description: t.description,
         amount: t.type === 'EXPENSE' ? -Math.abs(t.amount) : Math.abs(t.amount),
         fitId: t.fitId
       }));
    }
    else parsedTxs = await parseAdvancedPDF(buffer);

    if (parsedTxs.length === 0) return NextResponse.json({ message: 'Nenhuma transação encontrada.' }, { status: 400 });

    const categories = await prisma.category.findMany({
      where: { userId }
    });
    const suggestedNames = await batchGetSmartCategories(parsedTxs, categories);

    let importedCount = 0;
    const processedInBatch = new Set<string>();

    // 1. Pre-processar categorias necessárias (Batch Create)
    const uniqueNewCategories = new Set<string>();
    for (let i = 0; i < parsedTxs.length; i++) {
      const type = parsedTxs[i].amount > 0 ? 'INCOME' : 'EXPENSE';
      const name = suggestedNames[i] || "Outros";
      const key = `${name.toLowerCase()}|${type}`;
      if (!categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        uniqueNewCategories.add(key);
      }
    }

    if (uniqueNewCategories.size > 0) {
      const newCatsData = Array.from(uniqueNewCategories).map(key => {
        const [name, type] = key.split('|');
        return { name: name.charAt(0).toUpperCase() + name.slice(1), type: type as any, userId };
      });
      
      // createMany não retorna os IDs no PostgreSQL de forma simples via Prisma sem raw query em versões antigas,
      // mas vamos criar e re-buscar para garantir os IDs.
      await prisma.category.createMany({
        data: newCatsData,
        skipDuplicates: true
      });
      
      // Atualizar lista local de categorias
      const updatedCats = await prisma.category.findMany({ where: { userId } });
      categories.length = 0;
      categories.push(...updatedCats);
    }

    // 2. Preparar transações para criação em massa
    const transactionsToCreate = [];
    
    // Buscar externalIds existentes para esta conta para evitar duplicatas
    const existingExternalIds = new Set(
      (await prisma.transaction.findMany({
        where: { accountId, userId },
        select: { externalId: true }
      })).map(t => t.externalId)
    );

    for (let i = 0; i < parsedTxs.length; i++) {
      const tx = parsedTxs[i];
      const suggestedName = (suggestedNames[i] || "Outros").toLowerCase();
      const type = tx.amount > 0 ? 'INCOME' : 'EXPENSE';
      
      const externalId = tx.fitId || generateFingerprint(tx, accountId);
      
      if (processedInBatch.has(externalId) || existingExternalIds.has(externalId)) continue;

      const category = categories.find(c => c.name.toLowerCase() === suggestedName && c.type === type);
      const txDate = tx.date.includes('T') ? tx.date : `${tx.date}T12:00:00.000Z`;
      
      transactionsToCreate.push({
        description: tx.description,
        amount: Math.abs(tx.amount),
        date: new Date(txDate),
        type,
        categoryId: category?.id || categories[0].id,
        accountId,
        userId,
        payee: tx.payee || null,
        payer: tx.payer || null,
        bankRefId: tx.bankRefId || null,
        externalId
      });
      
      processedInBatch.add(externalId);
    }

    if (transactionsToCreate.length > 0) {
      const result = await prisma.transaction.createMany({
        data: transactionsToCreate,
        skipDuplicates: true
      });
      importedCount = result.count;
    }

    return NextResponse.json({ 
      message: 'Sucesso!', 
      details: `${importedCount} transações novas importadas.` 
    });
  } catch (error) {
    console.error('Import API Error:', error);
    return NextResponse.json({ message: 'Erro no processamento' }, { status: 500 });
  }
}

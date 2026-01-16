import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { askAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  payer?: string;
  payee?: string;
  bankRefId?: string;
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
    
    const result = await askAI(`Classifique estas ${descriptions.length} transações: ${JSON.stringify(descriptions)}`, system);
    const cleaned = result?.match(/[\[\s\S]*\]/);
    if (cleaned) {
      return JSON.parse(cleaned[0]) as string[];
    }
    return descriptions.map(() => "Outros");
  } catch { 
    return transactions.map(() => "Outros");
  }
}

/**
 * GERA FINGERPRINT ÚNICO (Regra de Ouro)
 * Combina Data + Descrição + Valor + Conta para evitar duplicidade.
 */
function generateFingerprint(tx: ParsedTransaction, accountId: string) {
  const amount = Math.abs(tx.amount).toFixed(2);
  const dateStr = tx.date; // YYYY-MM-DD
  const content = `${dateStr}|${tx.description.trim()}|${amount}|${accountId}|${tx.bankRefId || ''}`;
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

/**
 * DETERMINA DIREÇÃO (ENTRADA/SAÍDA)
 * Compara nomes para evitar confusão de valores.
 */
function determineDirection(amount: number, payer: string, payee: string, accountOwner: string) {
  const ownerUpper = accountOwner.toUpperCase().trim();
  const payerUpper = payer.toUpperCase().trim();
  const payeeUpper = payee.toUpperCase().trim();
  
  let finalAmount = Math.abs(amount);
  let type: 'INCOME' | 'EXPENSE' = 'INCOME';

  // Se o pagador sou eu, é uma despesa
  if (payerUpper && ownerUpper && (payerUpper.includes(ownerUpper) || ownerUpper.includes(payerUpper))) {
      finalAmount = -finalAmount;
      type = 'EXPENSE';
  } 
  // Se o recebedor sou eu, é uma renda
  else if (payeeUpper && ownerUpper && (payeeUpper.includes(ownerUpper) || ownerUpper.includes(payeeUpper))) {
      finalAmount = Math.abs(finalAmount);
      type = 'INCOME';
  }
  // Fallback: se o valor no PDF vier explicitamente com sinal de menos
  else if (amount < 0) {
      type = 'EXPENSE';
  }
  
  return { finalAmount, type };
}

function parsePicPayDispatcher(rawText: string): ParsedTransaction[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Identificar o dono da conta no cabeçalho
  let accountOwner = "";
  for(let i=0; i<15; i++) {
     if(lines[i] && 
        !lines[i].includes("PicPay") && 
        !lines[i].includes("CPF:") && 
        !lines[i].includes("Relatório") &&
        lines[i].length > 5 &&
        !lines[i].match(/\d/)) {
         accountOwner = lines[i];
         break;
     }
  }

  if (rawText.includes("Relatório de Pagamentos de Boletos")) {
    return parsePicPayBoleto(lines, accountOwner);
  } else if (rawText.includes("Relatório de Transferências Entre Contas PicPay")) {
    return parsePicPayInternal(lines, accountOwner);
  } else if (rawText.includes("Relatório de Transferências PIX") || rawText.includes("Relatório de Transferência PIX")) {
    return parsePicPayPix(lines, accountOwner);
  }

  return [];
}

function parsePicPayInternal(lines: string[], accountOwner: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  let currentBlock: string[] = [];
  const statusRegex = /^(Concluída|Cancelada|Em análise|Devolvida)$/i;

  for (let i = 0; i < lines.length; i++) {
    currentBlock.push(lines[i]);
    if (statusRegex.test(lines[i])) {
       // Ignorar transações canceladas ou devolvidas para não sujar o financeiro
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
  const pixIdRegex = /^[ED]\d{10,}[a-zA-Z0-9]+/; // Captura IDs Pix começando com E ou D

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
            if (potentialPayee && !potentialPayee.match(/R\$/) && !potentialPayee.match(/^[ED]\d/) && potentialPayee.length > 3) {
                payee = potentialPayee;
            }
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
  
  // CORREÇÃO 1: Limitar o Pagador às últimas 3 linhas antes da data
  // Isso evita pegar o cabeçalho da página (Dono da conta) como se fosse o pagador
  const startIndex = Math.max(0, dateIndex - 3);
  let payer = cleanHeaderTerms(lines.slice(startIndex, dateIndex).join(" "));
  
  let amount = 0;
  let bankRefId = "";
  let valueIndex = -1;
  
  // Regex para ID numérico (9+ dígitos) solto ou colado
  const idRegex = /(\d{9,})/

  for (let i = dateIndex + 1; i < lines.length; i++) {
    const l = lines[i];
    const vMatch = l.match(/R\$\s*(-?[\d.,]+)/);
    
    // Tenta capturar ID na mesma linha ou linhas próximas
    const idMatch = l.match(idRegex);
    if (idMatch && !bankRefId) {
        bankRefId = idMatch[1];
    }
    
    if (vMatch) {
      const rawValue = vMatch[1].replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
      amount = parseFloat(rawValue);
      valueIndex = i;
    }
  }
  
  if (valueIndex === -1) return null;
  
  const payee = lines.slice(valueIndex + 1, lines.length - 1).join(" ");
  
  const { finalAmount, type } = determineDirection(amount, payer, payee, accountOwner);

  const description = type === "EXPENSE" 
      ? `Envio para ${payee}` 
      : `Recebido de ${payer}`;

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
    
    // Tenta processar como PicPay primeiro
    const picPayTxs = parsePicPayDispatcher(rawText);
    if (picPayTxs.length > 0) return picPayTxs;

    // --- FALLBACK GENÉRICO (Caso não seja PicPay) ---
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

export async function POST(request: Request) {

  try {

    const formData = await request.formData();

    const file = formData.get('file') as File;

    const accountId = formData.get('accountId') as string;



    const buffer = Buffer.from(await file.arrayBuffer());

    const transactions = await parseAdvancedPDF(buffer);



    if (transactions.length === 0) {

      return NextResponse.json({ message: 'Nenhuma transação encontrada no arquivo.' }, { status: 400 });

    }



    const categories: { id: string, name: string, type: string }[] = await prisma.$queryRaw`SELECT * FROM "Category"`;

    

    // Obter categorias inteligentes em lote para todas as transações

    const suggestedNames = await batchGetSmartCategories(transactions, categories);



    let importedCount = 0;

    const now = new Date().toISOString();

    const processedInBatch = new Set<string>();



    for (let i = 0; i < transactions.length; i++) {

      const tx = transactions[i];

      const suggestedName = suggestedNames[i] || "Outros";

      const externalId = generateFingerprint(tx, accountId);

      

      if (processedInBatch.has(externalId)) continue;



      const existing: { id: string }[] = await prisma.$queryRaw`SELECT id FROM "Transaction" WHERE "externalId" = ${externalId} LIMIT 1`;



      if (existing.length === 0) {

        const type = tx.amount > 0 ? 'INCOME' : 'EXPENSE';

        let category = categories.find(c => c.name.toLowerCase() === suggestedName.toLowerCase() && c.type === type);

        

        if (!category) {

          const newId = Math.random().toString(36).substring(2, 9);

          await prisma.$executeRaw`INSERT INTO "Category" (id, name, type) VALUES (${newId}, ${suggestedName}, ${type})`;

          category = { id: newId, name: suggestedName, type };

          // Atualiza lista local para evitar duplicar criação de categoria no mesmo loop

          categories.push(category);

        }

        

        const txDate = tx.date.includes('T') ? tx.date : `${tx.date}T12:00:00.000Z`;

        const isoDate = new Date(txDate).toISOString();



        await prisma.$executeRaw`

                    INSERT INTO "Transaction" (

                      id, description, amount, date, type, "categoryId", "accountId", "externalId", 

                      payee, payer, "bankRefId", "createdAt", "updatedAt"

                    )

          VALUES (

            ${Math.random().toString(36).substring(2, 15)}, 

            ${tx.description}, 

            ${Math.abs(tx.amount)}, 

            ${isoDate}, 

            ${type}, 

            ${category.id}, 

            ${accountId},

            ${externalId},

            ${tx.payee || null},

            ${tx.payer || null},

            ${tx.bankRefId || null},

            ${now},

            ${now}

          )

        `;

        importedCount++;

        processedInBatch.add(externalId);

      }

    }



    return NextResponse.json({ 

      message: 'Sucesso!', 

      details: `${importedCount} transações novas importadas de ${transactions.length} totais.` 

    });

  } catch (error) {

    console.error('Import API Error:', error);

    return NextResponse.json({ message: 'Erro no processamento do arquivo' }, { status: 500 });

  }

}

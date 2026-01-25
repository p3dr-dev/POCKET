// Simples e eficiente OFX Parser
// Foca em extrair: TRNTYPE, DTPOSTED, TRNAMT, FITID, NAME, MEMO

export interface OfxTransaction {
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  amount: number;
  fitId: string;
  description: string;
  memo?: string;
}

export function parseOfx(ofxContent: string): OfxTransaction[] {
  const transactions: OfxTransaction[] = [];
  
  // Limpar e normalizar
  const cleanContent = ofxContent.replace(/\r/g, '').replace(/\n/g, '');
  
  // Regex para capturar blocos STMTTRN
  const transactionBlocks = cleanContent.match(/<STMTTRN>.*?<\/STMTTRN>/g) || [];

  for (const block of transactionBlocks) {
    try {
      const typeMatch = block.match(/<TRNTYPE>(.*?)<|$/);
      const dateMatch = block.match(/<DTPOSTED>(.*?)<|$/);
      const amountMatch = block.match(/<TRNAMT>(.*?)<|$/);
      const fitIdMatch = block.match(/<FITID>(.*?)<|$/);
      const nameMatch = block.match(/<NAME>(.*?)<|$/);
      const memoMatch = block.match(/<MEMO>(.*?)<|$/);

      if (!dateMatch?.[1] || !amountMatch?.[1] || !fitIdMatch?.[1]) continue;

      const rawAmount = parseFloat(amountMatch[1].replace(',', '.'));
      const amount = Math.abs(rawAmount);
      const type = rawAmount < 0 ? 'EXPENSE' : 'INCOME';

      // Parse Date: YYYYMMDDHHMMSS...
      const rawDate = dateMatch[1];
      const date = new Date(
        parseInt(rawDate.substring(0, 4)),
        parseInt(rawDate.substring(4, 6)) - 1,
        parseInt(rawDate.substring(6, 8))
      );

      transactions.push({
        type,
        date,
        amount,
        fitId: fitIdMatch[1],
        description: nameMatch?.[1] || memoMatch?.[1] || 'Transação Bancária',
        memo: memoMatch?.[1]
      });
    } catch (e) {
      console.error('Failed to parse OFX block', e);
    }
  }

  return transactions;
}

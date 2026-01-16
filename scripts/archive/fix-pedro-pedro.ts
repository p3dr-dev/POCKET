import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixPedroToPedro() {
  const filePath = path.join(process.cwd(), 'dados1.txt');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extrair o bloco de pix_recebidos manualmente
  const start = content.indexOf('pix_recebidos');
  const end = content.indexOf('pix_enviados');
  const receivedBlock = content.substring(start, end);

  // Regex para capturar linhas onde o pagador é Pedro
  // { "data": "27/12/2025", "pagador": "PEDRO AUGUSTO DE OLIVEIRA SIMÕES", "valor": "R$ 71,96", ... }
  const regex = /"data":\s*"([^"]+)",\s*"pagador":\s*"([^"]+)",\s*"valor":\s*"([^"]+)"/g;
  
  let match;
  let count = 0;

  console.log("--- RESTAURANDO APORTES (PEDRO -> PEDRO) ---");

  while ((match = regex.exec(receivedBlock)) !== null) {
    const dateStr = match[1]; // 27/12/2025
    const payer = match[2];   // PEDRO...
    const valueStr = match[3]; // R$ 71,96

    if (payer.toUpperCase().includes("PEDRO AUGUSTO")) {
        const amount = parseFloat(valueStr.replace('R$ ', '').replace('.', '').replace(',', '.'));
        const isoDate = dateStr.split('/').reverse().join('-');

        // Buscar essa transação no banco (que deve estar como EXPENSE agora)
        const tx = await prisma.transaction.findFirst({
            where: {
                amount: amount,
                // data pode ter variação de fuso, buscar no dia
                date: {
                    gte: new Date(`${isoDate}T00:00:00.000Z`),
                    lt: new Date(`${isoDate}T23:59:59.999Z`),
                }
            }
        });

        if (tx && tx.type === 'EXPENSE') {
            console.log(`Restaurando: ${dateStr} - R$ ${amount} -> INCOME`);
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    type: 'INCOME',
                    description: `Aporte de ${payer}`
                }
            });
            count++;
        }
    }
  }
  console.log(`Total restaurado: ${count}`);
}

fixPedroToPedro().catch(console.error).finally(() => prisma.$disconnect());

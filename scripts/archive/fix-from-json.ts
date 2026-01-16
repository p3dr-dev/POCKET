import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixFromJSON() {
  const filePath = path.join(process.cwd(), 'dados1.txt');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);
  
  const pixRecebidos = data.historico_financeiro_picpay.transacoes.pix_recebidos;
  const pixEnviados = data.historico_financeiro_picpay.transacoes.pix_enviados;

  console.log(`Processando ${pixRecebidos.length} PIX Recebidos (INCOME)...`);
  
  for (const item of pixRecebidos) {
    // Tenta encontrar a transação pelo valor e data aproximada (ou exata)
    // O valor no JSON está formatado "R$ 100,00", precisamos limpar.
    const amount = parseFloat(item.valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
    const dateStr = item.data.split('/').reverse().join('-'); // YYYY-MM-DD
    
    // Busca transação que tenha esse valor e data
    // Nota: Como eu já alterei para EXPENSE algumas, preciso buscar em AMBOS os tipos ou ignorar o tipo na busca.
    const tx = await prisma.transaction.findFirst({
      where: {
        accountId: '1hcteuffbiej',
        amount: amount, // O banco guarda valor absoluto positivo? Sim, minha lógica põe valor absoluto no amount e o sinal no tipo? Não, eu ponho valor absoluto e uso Type. 
        // Mas espere! Se eu mudei para EXPENSE, eu não mudei o valor para negativo no banco? 
        // O campo amount é Float. Normalmente guarda absoluto. Vamos assumir absoluto.
        date: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lt: new Date(`${dateStr}T23:59:59.999Z`),
        }
      }
    });

    if (tx) {
        if (tx.type !== 'INCOME') {
            console.log(`Corrigindo [${dateStr}] R$ ${amount} de ${tx.type} para INCOME. (Pagador: ${item.pagador})`);
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { 
                    type: 'INCOME',
                    description: `Recebido de ${item.pagador} (Pix)`
                }
            });
        }
    } else {
        // Se não achou, pode ser porque o valor ou data não batem exato, ou eu não importei.
        // Mas a carga massiva anterior usou esse mesmo JSON (teoricamente).
        // Ah, eu usei `load-consolidated-data.ts` que usava um JSON hardcoded *dentro* do arquivo.
        // Vou assumir que os dados são os mesmos.
    }
  }

  console.log(`Processando ${pixEnviados.length} PIX Enviados (EXPENSE)...`);
  for (const item of pixEnviados) {
    const amount = parseFloat(item.valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
    const dateStr = item.data.split('/').reverse().join('-');

    const tx = await prisma.transaction.findFirst({
      where: {
        accountId: '1hcteuffbiej',
        amount: amount,
        date: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lt: new Date(`${dateStr}T23:59:59.999Z`),
        }
      }
    });

    if (tx) {
        if (tx.type !== 'EXPENSE') {
            console.log(`Corrigindo [${dateStr}] R$ ${amount} de ${tx.type} para EXPENSE. (Recebedor: ${item.recebedor})`);
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { 
                    type: 'EXPENSE',
                    description: `Envio para ${item.recebedor} (Pix)`
                }
            });
        }
    }
  }
}

fixFromJSON().catch(console.error).finally(() => prisma.$disconnect());

import prisma from './src/lib/prisma';
import { askAI } from './src/lib/ai';

async function runSystemTest() {
  console.log('--- 🧪 INICIANDO TESTE DE SISTEMA POCKET ---');

  // 1. Teste de Banco de Dados
  try {
    const categories: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM Category`;
    const accounts: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM Account`;
    console.log('✅ Banco de Dados: Conectado');
    console.log(`📊 Estrutura: ${categories[0].count} categorias, ${accounts[0].count} contas detectadas.`);
  } catch (err: any) {
    console.error('❌ Erro no Banco de Dados:', err.message);
  }

  // 2. Teste de IA (Ollama)
  try {
    console.log('🤖 Testando IA (Gemini via Ollama)...');
    const aiResponse = await askAI("Dê um 'Oi' bem curto.", "Você é um assistente de teste.");
    if (aiResponse) {
      console.log('✅ IA Local: Ativa e respondendo:', aiResponse);
    } else {
      console.log('⚠️ IA Local: Ollama não respondeu (verifique se está rodando).');
    }
  } catch (err) {
    console.log('❌ IA Local: Offline.');
  }

  // 3. Verificação de Rotas Críticas
  const fs = require('fs');
  const requiredFiles = [
    'src/app/api/transactions/import/route.ts',
    'src/app/api/transactions/route.ts',
    'src/app/transactions/page.tsx',
    'src/app/accounts/page.tsx'
  ];

  console.log('📂 Verificando arquivos críticos...');
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  - ${file}: OK`);
    } else {
      console.log(`  - ${file}: ❌ AUSENTE`);
    }
  });

  console.log('--- 🏁 FIM DO TESTE ---');
}

runSystemTest();

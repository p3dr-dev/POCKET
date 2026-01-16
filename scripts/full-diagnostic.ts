import 'dotenv/config';
import { createClient } from '@libsql/client';
import { createWorker } from 'tesseract.js';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

async function runFullDiagnostics() {
  console.log('--- 🧪 Iniciando Diagnóstico Completo ---\n');

  // 1. Testar conexão com Turso via Prisma (simulando como o app faria)
  console.log('--- 1. Testando Conexão Turso via Prisma Singleton ---');
  try {
    const { default: prisma } = await import('../src/lib/prisma'); // Importa o singleton

    // Força uma query simples para testar a conexão
    const categoryCount = await prisma.category.count();
    console.log(`✅ Turso/Prisma Conectado! Total de Categorias: ${categoryCount}`);
  } catch (e: any) {
    console.error(`❌ Erro na Conexão Turso/Prisma: ${e.message}`);
    // Exibe a stack completa para depuração
    if (e.stack) {
      console.error(e.stack);
    }
  }

  // 2. Testar Inicialização do Tesseract (localmente)
  console.log('\n--- 2. Testando Inicialização Tesseract Local ---');
  try {
    const isProduction = process.env.NODE_ENV === 'production'; // Para ver como o script se comporta
    console.log(`Ambiente NODE_ENV: ${process.env.NODE_ENV}`);

    let worker;
    if (isProduction) {
      console.log('Simulando ambiente de Produção para Tesseract (CDN)');
      worker = await createWorker('por', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
      });
    } else {
      console.log('Simulando ambiente Local para Tesseract (Caminho Relativo)');
      const localWorkerPath = './node_modules/tesseract.js/src/worker-script/node/index.js';
      
      // Verifica se o arquivo existe antes de tentar carregar
      const absoluteWorkerPath = path.join(process.cwd(), localWorkerPath);
      if (!fs.existsSync(absoluteWorkerPath)) {
        throw new Error(`Arquivo do worker Tesseract não encontrado em: ${absoluteWorkerPath}`);
      }
      
      worker = await createWorker('por', 1, {
        workerPath: localWorkerPath,
      });
    }

    console.log('✅ Tesseract inicializado com sucesso para o ambiente Local!');
    await worker.terminate();
  } catch (e: any) {
    console.error(`❌ Erro na Inicialização do Tesseract: ${e.message}`);
    if (e.stack) {
      console.error(e.stack);
    }
  }

  console.log('\n--- 🏁 Diagnóstico Completo Finalizado ---');
}

runFullDiagnostics();

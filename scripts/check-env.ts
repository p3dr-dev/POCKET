import 'dotenv/config';
import { createClient } from '@libsql/client';
import { askAI } from '../src/lib/ai';

async function runDiagnostics() {
  console.log('🔍 Iniciando Diagnóstico do Ecossistema...\n');

  // 1. Testar Turso
  console.log('--- 1. Testando Turso Database ---');
  try {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    
    if (!url) throw new Error('DATABASE_URL ausente no .env');
    
    const client = createClient({ url, authToken });
    const result = await client.execute('SELECT 1 + 1 as test');
    console.log('✅ Turso Conectado! (1 + 1 = ' + result.rows[0].test + ')');
  } catch (e: any) {
    console.error('❌ Erro no Turso:', e.message);
  }

  console.log('\n--- 2. Testando Ollama Cloud ---');
  try {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('OLLAMA_API_KEY ausente no .env');
    
    console.log('📡 Enviando prompt para Ollama Cloud...');
    const response = await askAI('Responda apenas "SISTEMA ONLINE".');
    
    if (response) {
      console.log('✅ Ollama Cloud Respondeu:', response);
    } else {
      throw new Error('Resposta da IA veio vazia ou nula.');
    }
  } catch (e: any) {
    console.error('❌ Erro na IA:', e.message);
  }

  console.log('\n🏁 Diagnóstico Finalizado.');
}

runDiagnostics();

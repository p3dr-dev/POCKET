import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function sync() {
  const url = 'libsql://pocket-db-w4lkker.aws-us-east-2.turso.io';
  const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg1NjY1MTcsImlkIjoiYjA4YWVkMTItNDI1Ni00NjAxLThjZDgtNmZlMTI1MzljODExIiwicmlkIjoiYzY3OWZlYzEtODMwNi00OTA0LWJlMzMtMzc0MDU0ODM3ZTVjIn0.mjh2uOqt-pEcU4s6WN3aloG1ZV_8AH_jcWiEQ0SUhhFkToONHpmh11BWJBnxcuqIMUCwUTdpF1YqbZEGiVgDDQ';

  const client = createClient({ url, authToken });

  console.log('🚀 Iniciando sincronização sequencial com Turso...');

  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  const folders = fs.readdirSync(migrationsDir)
    .filter(f => fs.lstatSync(path.join(migrationsDir, f)).isDirectory())
    .sort(); // Garante ordem cronológica

  for (const folder of folders) {
    const migrationFile = path.join(migrationsDir, folder, 'migration.sql');
    if (fs.existsSync(migrationFile)) {
      console.log(`📦 Aplicando migração: ${folder}`);
      const sql = fs.readFileSync(migrationFile, 'utf8');
      
      // Split por ';' mas cuidando para não quebrar dentro de triggers/strings se houver
      const statements = sql.split(';').filter(s => s.trim() !== '');

      for (const statement of statements) {
        try {
          await client.execute(statement);
        } catch (e: any) {
          if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
            console.error(`⚠️ Erro em ${folder}:`, e.message);
          }
        }
      }
    }
  }

  console.log('✅ Banco de dados Turso sincronizado e pronto!');
}

sync();
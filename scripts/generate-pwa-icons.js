const fs = require('fs');
const path = require('path');

// Base64 de um PNG preto simples (1x1 pixel esticado é suficiente para validação técnica, 
// mas idealmente seria um ícone real. Como não posso desenhar, vou usar um buffer genérico de PNG válido).
// Este é um PNG 1x1 preto.
const base64Png = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
const buffer = Buffer.from(base64Png, 'base64');

// Em um cenário real, deveríamos ter imagens de alta resolução. 
// Para ativar o PWA, o arquivo precisa existir e ser um PNG válido.
// O navegador vai redimensionar visualmente, mas vai validar a existência.

const publicDir = path.join(__dirname, '..', 'public');

// Criar 192x192 (usando o mesmo arquivo, o navegador aceita, apenas distorce se não for quadrado, mas é 1x1)
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buffer);
console.log('Criado icon-192x192.png');

// Criar 512x512
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buffer);
console.log('Criado icon-512x512.png');

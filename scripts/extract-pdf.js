const fs = require('fs');
const pdf = require('pdf-parse');

// Polyfills para evitar erros em ambientes de servidor
if (typeof global.DOMMatrix === 'undefined') global.DOMMatrix = class {};
if (typeof global.ImageData === 'undefined') global.ImageData = class {};
if (typeof global.Path2D === 'undefined') global.Path2D = class {};

async function run() {
  try {
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('Caminho do arquivo não fornecido');
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Imprimir apenas o texto para que o processo pai capture
    process.stdout.write(data.text);
  } catch (err) {
    console.error('Erro na extração isolada:', err.message);
    process.exit(1);
  }
}

run();

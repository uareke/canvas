// Arquivo main.JS
// Arquivo gerenciador da aplicação.

import CanvasManager from './CanvasManager.js';

function main() {
  const canvas = new CanvasManager('meu-canvas');
  canvas.clear();

  // Fundo
  canvas.drawRect(0, 0, canvas.width, canvas.height, '#f9f9f9');

  // Texto título
  canvas.drawText('🎨 Formas básicas no Canvas', 50, 50, '#333', 'bold 28px Arial');

  // Linha divisória
  canvas.drawLine(40, 70, 760, 70, '#999', 3);

  // Retângulos
  canvas.drawText('Retângulos:', 50, 110, '#111', '20px Arial');
  canvas.drawRect(50, 130, 100, 60, '#ff4d4d');
  canvas.drawRect(180, 130, 150, 60, '#4da6ff');

  // Círculos
  canvas.drawText('Círculos:', 50, 240, '#111', '20px Arial');
  canvas.drawCircle(100, 300, 40, '#00cc66');
  canvas.drawCircle(200, 300, 60, '#ffcc00');

  // Linhas
  canvas.drawText('Linhas:', 50, 400, '#111', '20px Arial');
  canvas.drawLine(50, 420, 250, 480, '#ff6600', 5);
  canvas.drawLine(250, 420, 50, 480, '#0066ff', 2);

  // Texto
  canvas.drawText('Texto com drawText():', 400, 240, '#111', '20px Arial');
  canvas.drawText('Canvas é divertido!', 400, 280, '#555', 'italic 24px Verdana');
}

main();
// Arquivo CanvasManager.JS
// Gerenciador do canvas.

class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas '${canvasId}' não encontrado!`);
    
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  // Limpa tudo
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // Desenha um retângulo
  drawRect(x, y, width, height, color = 'black') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  // Desenha um círculo
  drawCircle(x, y, radius, color = 'black') {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Desenha uma linha
  drawLine(startX, startY, endX, endY, color = 'black', lineWidth = 1) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }

  // Escreve um texto
  drawText(text, x, y, color = 'black', font = '16px Arial') {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }
}

export default CanvasManager;
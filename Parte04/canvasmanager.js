// 🧩 Classe que vai gerenciar nosso canvas, desenhar texto, imagens e limpar a tela
class CanvasManager {
    constructor(canvasId) {
        // Pega o elemento <canvas> pelo ID
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Elemento canvas com id "${canvasId}" não foi encontrado.`); 
            // Se não achar o canvas, já avisa que algo tá errado
        }

        // Pega o contexto 2D — aqui é onde a mágica do desenho acontece
        this.ctx = this.canvas.getContext('2d');

        // Guarda largura e altura do canvas pra facilitar a vida
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    // 🧹 Limpa o canvas totalmente, independente de transformações aplicadas
    clear() {
        this.ctx.save(); // salva o estado atual
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reseta qualquer transformação (escala, rotação etc)
        this.ctx.clearRect(0, 0, this.width, this.height); // limpa tudo
        this.ctx.restore(); // restaura o estado original
    }

    // ✍️ Desenha um texto no canvas
    drawText(text, x, y, color, font, textAlign, textBaseline) {
        if (color) this.ctx.fillStyle = color; // cor do texto
        if (font) this.ctx.font = font; // fonte
        if (textAlign) this.ctx.textAlign = textAlign; // alinhamento horizontal
        if (textBaseline) this.ctx.textBaseline = textBaseline; // alinhamento vertical
        this.ctx.fillText(text, x, y); // desenha o texto
    }

    // 🖼️ Desenha uma imagem no canvas
    drawImage(image, x, y, width = null, height = null) {
        if (!image) return; // se não tiver imagem, não faz nada
        if (width && height) {
            this.ctx.drawImage(image, x, y, width, height); // desenha redimensionada
        } else {
            this.ctx.drawImage(image, x, y); // desenha no tamanho original
        }
    }

    // 🔧 Retorna o contexto 2D, caso queira manipular diretamente
    getContext() {
        return this.ctx;
    }
}

// Exporta a classe pra usar em main.js ou qualquer outro lugar
export default CanvasManager;
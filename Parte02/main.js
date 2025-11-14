// main.js
import CanvasManager from './CanvasManager.js';

// Função principal da aplicação
function main() {
    try {
        const canvas = new CanvasManager('meu-canvas');

        // --- SETUP DAS BOLAS ---
        const balls = [];
        const numberOfBalls = 25;

        for (let i = 0; i < numberOfBalls; i++) {
            balls.push({
                radius: Math.random() * 20 + 10, // Raio entre 10 e 30
                x: Math.random() * (canvas.width - 60) + 30,
                y: Math.random() * (canvas.height - 60) + 30,
                vx: (Math.random() - 0.5) * 6, // velocidade horizontal
                vy: (Math.random() - 0.5) * 6, // velocidade vertical
                color: `rgba(${Math.floor(Math.random() * 255)}, 
                             ${Math.floor(Math.random() * 255)}, 
                             ${Math.floor(Math.random() * 255)}, 0.8)`
            });
        }

        // --- LOOP DE ANIMAÇÃO ---
        function animate() {
            requestAnimationFrame(animate);
            canvas.clear();

            balls.forEach(ball => {
                // Desenha bola
                canvas.drawCircle(ball.x, ball.y, ball.radius, ball.color);

                // Atualiza posição
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Colisão com paredes
                if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
                    ball.vx *= -1;
                }
                if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
                    ball.vy *= -1;
                }
            });
        }

        console.log('Iniciando animação...');
        animate();

    } catch (error) {
        console.error('Erro na aplicação:', error);
    }
}

main();

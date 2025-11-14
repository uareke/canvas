// 🧩 Importa nossa classe CanvasManager, que sabe desenhar e limpar o canvas
import CanvasManager from './canvasmanager.js';

/**
 * 🔄 Função que rotaciona um vetor de velocidade
 * Usada internamente na física da colisão — não precisa mexer aqui
 * @param {{x: number, y: number}} velocity - O vetor de velocidade
 * @param {number} angle - O ângulo de rotação em radianos
 * @returns {{x: number, y: number}} - Novo vetor de velocidade rotacionado
 */
function rotate(velocity, angle) {
    return {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };
}

/**
 * 💥 Função que detecta e resolve a colisão entre duas bolas
 * Baseada em colisão elástica 2D — aquela física clássica que dá gosto de ver
 * @param {Object} ballA - Primeira bolinha
 * @param {Object} ballB - Segunda bolinha
 */
function resolveCollision(ballA, ballB) {
    const xVelocityDiff = ballA.vx - ballB.vx;
    const yVelocityDiff = ballA.vy - ballB.vy;

    const xDist = ballB.x - ballA.x;
    const yDist = ballB.y - ballA.y;

    // Previne que bolas que estão se afastando colidam de novo
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
        const angle = -Math.atan2(yDist, xDist);

        // Aqui assumimos massa = raio (porque é fácil e divertido 😎)
        const m1 = ballA.radius;
        const m2 = ballB.radius;

        // Rotaciona as velocidades pra fazer a física funcionar 1D
        const u1 = rotate({ x: ballA.vx, y: ballA.vy }, angle);
        const u2 = rotate({ x: ballB.vx, y: ballB.vy }, angle);
        
        // Fórmula clássica da colisão elástica 1D
        const v1 = { 
            x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), 
            y: u1.y 
        };
        const v2 = { 
            x: u2.x * (m2 - m1) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2),
            y: u2.y 
        };

        // Rotaciona de volta pro sistema 2D
        const finalV1 = rotate(v1, -angle);
        const finalV2 = rotate(v2, -angle);

        // Atualiza as velocidades das bolas — agora elas vão sair quicando de forma realista
        ballA.vx = finalV1.x;
        ballA.vy = finalV1.y;
        ballB.vx = finalV2.x;
        ballB.vy = finalV2.y;
    }
}

// 🚀 Função principal da aplicação — é daqui que a mágica começa
function main() {
    try {
        const canvas = new CanvasManager('meu-canvas');

        // --- ⚙️ Setup das bolinhas ---
        const balls = [];
        const numberOfBalls = 25;

        for (let i = 0; i < numberOfBalls; i++) {
            let radius = Math.random() * 15 + 8; 
            let x = Math.random() * (canvas.width - radius * 2) + radius;
            let y = Math.random() * (canvas.height - radius * 2) + radius;
            let color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
            
            // 🔄 Evita que as bolinhas comecem sobrepostas
            if (i !== 0) {
                for (let j = 0; j < balls.length; j++) {
                    const dx = x - balls[j].x;
                    const dy = y - balls[j].y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance < radius + balls[j].radius) {
                        // Se colidir, escolhe uma posição nova aleatória e reinicia o check
                        x = Math.random() * (canvas.width - radius * 2) + radius;
                        y = Math.random() * (canvas.height - radius * 2) + radius;
                        j = -1; 
                    }
                }
            }
            
            // Adiciona a bola à nossa galera
            balls.push({
                radius,
                x,
                y,
                vx: (Math.random() - 0.5) * 4, // velocidade horizontal inicial
                vy: (Math.random() - 0.5) * 4, // velocidade vertical inicial
                color
            });
        }
        
        // --- 🌀 Loop de animação ---
        function animate() {
            requestAnimationFrame(animate);
            canvas.clear();

            // Atualiza posição de cada bola e checa colisão com paredes
            balls.forEach(ball => {
                ball.x += ball.vx;
                ball.y += ball.vy;

                // 💥 Colisão com paredes horizontais
                if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.vx *= -1;
                // 💥 Colisão com paredes verticais
                if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) ball.vy *= -1;

                // Desenha a bolinha
                canvas.drawCircle(ball.x, ball.y, ball.radius, ball.color);
            });
            
            // --- 💥 Detecção de colisões entre bolinhas ---
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    const ballA = balls[i];
                    const ballB = balls[j];
                    const dx = ballB.x - ballA.x;
                    const dy = ballB.y - ballA.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);

                    // Se estiverem se tocando, resolve a colisão
                    if (distance < ballA.radius + ballB.radius) {
                        resolveCollision(ballA, ballB);
                    }
                }
            }
        }

        console.log('Iniciando animação com detecção de colisão...');
        animate();

    } catch (error) {
        console.error('Ocorreu um erro na aplicação:', error);
    }
}

// 🎬 Chama a função principal pra dar o play na brincadeira
main();
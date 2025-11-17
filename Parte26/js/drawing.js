// drawing.js (VERSÃO CORRIGIDA)

import { state } from './state.js';

let canvasManager;
let ctx;
let canvas;
const handleSize = 8;
export const RULER_SIZE = 30;

export function initDrawing(manager, canvasElement) {
    canvasManager = manager;
    ctx = canvasManager.getContext();
    canvas = canvasElement;
}

export function redrawCanvas() {
    canvasManager.clear();

    const ctx = canvasManager.getContext();
    drawRulers();
    ctx.save();
    ctx.translate(RULER_SIZE, RULER_SIZE);
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.zoom, state.zoom);
    drawGuides();
    state.sceneObjects.forEach(obj => {
        if (obj.isVisible) {
            const { x, y, width, height, rotation, shadow, fill } = obj;
            ctx.save();

            if (shadow && shadow.enabled) {
                ctx.shadowColor = shadow.color;
                ctx.shadowBlur = shadow.blur;
                ctx.shadowOffsetX = shadow.offsetX;
                ctx.shadowOffsetY = shadow.offsetY;
            }

            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(rotation);
            switch (obj.type) {
                case 'image':
                    canvasManager.drawImage(obj.img, -width / 2, -height / 2, width, height);
                    break;
                //ISSO SAI
                // case 'text':
                //     canvasManager.drawText(
                //         obj.content, 0, 0,
                //         obj.fill.color1, // << MUDANÇA AQUI
                //         obj.font, 'center', 'middle'
                //     );
                //     break;
                // case 'rectangle':
                //     canvasManager.drawRect(
                //         -width / 2, -height / 2, width, height,
                //         obj.fill.color1 // << MUDANÇA AQUI
                //     );
                //     break;
                //ISSO ENTRA NO LUGAR
                case 'text':
                case 'rectangle': // A lógica de preenchimento é a mesma para ambos
                    // --- LÓGICA DE PREENCHIMENTO ATUALIZADA ---
                    if (fill.type === 'solid') {
                        ctx.fillStyle = fill.color1;
                    } else if (fill.type === 'linear') {
                        // Cria um gradiente linear da esquerda para a direita do objeto
                        const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
                        gradient.addColorStop(0, fill.color1);
                        gradient.addColorStop(1, fill.color2 || fill.color1); // Usa a cor 2, ou a cor 1 se a 2 não existir
                        ctx.fillStyle = gradient;
                    }

                    // Desenha a forma ou o texto
                    if (obj.type === 'rectangle') {
                        ctx.fillRect(-width / 2, -height / 2, width, height);
                    } else { // é texto
                        ctx.font = obj.font;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(obj.content, 0, 0);
                    }
                    break;
            }
            ctx.restore();
        }
    });

    if (state.selectedIndex !== -1) {
        const selectedObject = state.sceneObjects[state.selectedIndex];
        const { x, y, width, height, rotation } = selectedObject;
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation);
        canvasManager.drawDashedRect(-width / 2, -height / 2, width, height, 'rgba(0, 0, 0, 0.7)', [4, 4]);
        drawHandles(selectedObject);
        ctx.restore();
    }

    // Restaura o canvas ao estado original (sem zoom/pan)
    ctx.restore();

    // A mensagem inicial também precisa ser ajustada para a nova área
    if (state.sceneObjects.length === 0) {
        canvasManager.drawText('Clique para carregar uma imagem.',
            (canvas.width + RULER_SIZE) / 2,
            (canvas.height + RULER_SIZE) / 2,
            '#555', '24px sans-serif', 'center', 'middle');
    }
}

export function getHandlePositions(obj) {
    const { width, height } = obj;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const resizeHandles = {
        'top-left': { x: -halfWidth, y: -halfHeight }, 'top-center': { x: 0, y: -halfHeight }, 'top-right': { x: halfWidth, y: -halfHeight },
        'middle-left': { x: -halfWidth, y: 0 }, 'middle-right': { x: halfWidth, y: 0 },
        'bottom-left': { x: -halfWidth, y: halfHeight }, 'bottom-center': { x: 0, y: halfHeight }, 'bottom-right': { x: halfWidth, y: halfHeight }
    };
    const rotationHandleYOffset = 30;
    const rotationHandle = { x: 0, y: -halfHeight - rotationHandleYOffset };
    return { resize: resizeHandles, rotation: rotationHandle };
}

function drawHandles(obj) {
    const allHandles = getHandlePositions(obj);
    const halfHandle = handleSize / 2;
    for (const name in allHandles.resize) {
        const pos = allHandles.resize[name];
        canvasManager.drawRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'white');
        ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'black');
    }
    const rotHandle = allHandles.rotation;
    const topCenterHandle = allHandles.resize['top-center'];
    canvasManager.drawLine(topCenterHandle.x, topCenterHandle.y, rotHandle.x, rotHandle.y, 'rgba(0, 0, 0, 0.7)');
    canvasManager.drawCircle(rotHandle.x, rotHandle.y, handleSize / 1.5, '#28a745');
    ctx.beginPath();
    ctx.arc(rotHandle.x, rotHandle.y, handleSize / 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

// Função auxiliar para determinar o espaçamento dos "ticks" da régua
function getTickSpacing(zoom) {
    const baseSpacing = 100; // O espaçamento que queremos em zoom 100%
    if (zoom > 5) return baseSpacing / 10;
    if (zoom > 2) return baseSpacing / 5;
    if (zoom > 0.5) return baseSpacing / 2;
    if (zoom > 0.25) return baseSpacing;
    return baseSpacing * 2;
}

// A função principal que desenha as réguas
function drawRulers() {
    const { zoom, offsetX, offsetY } = state;
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textBaseline = 'middle';

    // --- Régua Superior ---
    ctx.fillRect(0, 0, width, RULER_SIZE);
    const tickSpacingX = getTickSpacing(zoom);
    const startX = Math.floor((-offsetX) / tickSpacingX) * tickSpacingX;

    for (let x = startX; (x * zoom + offsetX) < width; x += tickSpacingX) {
        const screenX = x * zoom + offsetX;
        if (screenX < RULER_SIZE) continue;

        ctx.beginPath();
        ctx.moveTo(screenX, RULER_SIZE);
        ctx.lineTo(screenX, RULER_SIZE - 5);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillText(x, screenX, RULER_SIZE / 2);
    }

    // --- Régua Esquerda ---
    ctx.fillRect(0, 0, RULER_SIZE, height);
    const tickSpacingY = getTickSpacing(zoom);
    const startY = Math.floor((-offsetY) / tickSpacingY) * tickSpacingY;

    for (let y = startY; (y * zoom + offsetY) < height; y += tickSpacingY) {
        const screenY = y * zoom + offsetY;
        if (screenY < RULER_SIZE) continue;

        ctx.beginPath();
        ctx.moveTo(RULER_SIZE, screenY);
        ctx.lineTo(RULER_SIZE - 5, screenY);
        ctx.stroke();

        ctx.save();
        ctx.translate(RULER_SIZE / 2, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(y, 0, 0);
        ctx.restore();
    }

    // Canto superior esquerdo
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);
    ctx.restore();
}

function drawGuides() {
    const { vertical, horizontal } = state.guides;
    const { activeGuides } = state.interaction; // Pega as guias ativas do estado
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    const defaultColor = 'rgba(0, 183, 255, 0.7)'; // Ciano
    const activeColor = 'rgba(255, 0, 0, 1)';     // Vermelho
    ctx.lineWidth = 1 / state.zoom;

    // Guias Verticais
    vertical.forEach(xPos => {
        // Se a posição da guia for a mesma da guia ativa, muda a cor
        ctx.strokeStyle = (activeGuides.vertical === xPos) ? activeColor : defaultColor;
        ctx.beginPath();
        ctx.moveTo(xPos, -state.offsetY / state.zoom);
        ctx.lineTo(xPos, (height - state.offsetY) / state.zoom);
        ctx.stroke();
    });

    // Guias Horizontais
    horizontal.forEach(yPos => {
        // Se a posição da guia for a mesma da guia ativa, muda a cor
        ctx.strokeStyle = (activeGuides.horizontal === yPos) ? activeColor : defaultColor;
        ctx.beginPath();
        ctx.moveTo(-state.offsetX / state.zoom, yPos);
        ctx.lineTo((width - state.offsetX) / state.zoom, yPos);
        ctx.stroke();
    });

    ctx.restore();
}
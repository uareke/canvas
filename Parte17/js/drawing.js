// drawing.js (VERSÃO CORRIGIDA)

import { state } from './state.js';

let canvasManager;
let ctx;
let canvas;
const handleSize = 8;

export function initDrawing(manager, canvasElement) {
    canvasManager = manager;
    ctx = canvasManager.getContext();
    canvas = canvasElement;
}

export function redrawCanvas() {
    canvasManager.clear();

    state.sceneObjects.forEach(obj => {
        if (obj.isVisible) {
            const { x, y, width, height, rotation } = obj;
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(rotation);
            switch (obj.type) {
                case 'image':
                    canvasManager.drawImage(obj.img, -width / 2, -height / 2, width, height);
                    break;
                case 'text':
                    canvasManager.drawText(
                        obj.content, 0, 0, obj.color, obj.font, 'center', 'middle'
                    );
                    break;
                case 'rectangle':
                    // Usamos nosso fiel método drawRect do CanvasManager
                    canvasManager.drawRect(-width / 2, -height / 2, width, height, obj.color);
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

    if (state.sceneObjects.length === 0) {
        canvasManager.drawText('Clique para carregar uma imagem.', canvas.width / 2 - 180, canvas.height / 2, '#555', '24px sans-serif');
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
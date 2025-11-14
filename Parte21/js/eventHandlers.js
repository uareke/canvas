import { state } from './state.js';
import * as UI from './ui.js';
import * as Drawing from './drawing.js';
import { ImageFilters } from './ImageFilters.js';

import * as History from './history.js'; //Importe a Historico

let canvas, ctx, fileInput;
let isSpacebarDown = false;

export function initEventHandlers(elements) {
    canvas = elements.canvas;
    ctx = elements.ctx;
    fileInput = elements.fileInput;


    elements.loadButton.addEventListener('click', () => fileInput.click());
    elements.saveButton.addEventListener('click', saveCanvasAsImage);
    elements.saveProjectButton.addEventListener('click', saveProject);
    elements.addTextButton.addEventListener('click', addNewTextObject);
    elements.layerList.addEventListener('click', handleLayerListClick);

    elements.loadProjectButton.addEventListener('click', () => elements.projectFileInput.click());
    elements.projectFileInput.addEventListener('change', handleProjectFileChange);

    // RENOMEIE ESTA LINHA de 'filterPanel' para 'propertiesPanel'
    //elements.filterPanel.addEventListener('click', handleFilterPanelClick);
    elements.propertiesPanel.addEventListener('click', handleFilterPanelClick);

    elements.addRectangleButton.addEventListener('click', addNewRectangleObject);

    // NOVO: Evento 'input' para atualização em tempo real
    elements.colorPicker.addEventListener('input', (event) => {
        if (state.selectedIndex !== -1) {
            const selectedObject = state.sceneObjects[state.selectedIndex];

            // Verifica se o objeto tem a propriedade 'color'
            if ('color' in selectedObject) {
                // Atualiza a cor no estado
                selectedObject.color = event.target.value;
                // Redesenha o canvas para mostrar a nova cor
                Drawing.redrawCanvas();
            }
        }
    });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('wheel', handleWheel); // << ADICIONE AQUI

    window.addEventListener('keydown', handleKeyDown);
    fileInput.addEventListener('change', handleFileChange);

    window.addEventListener('keyup', (event) => {
        if (event.key === ' ') {
            isSpacebarDown = false;
            // Restaura o cursor para o padrão (deixando o updateCursor cuidar disso)
            updateCursor(state.interaction.lastMouseX, state.interaction.lastMouseY);
        }
    });
}


function addNewRectangleObject() {
    const newRectObject = {
        type: 'rectangle',
        color: '#495057', // Um cinza escuro
        x: (canvas.width - 200) / 2, // Centralizado
        y: (canvas.height - 150) / 2,
        width: 200,
        height: 150,
        rotation: 0,
        isVisible: true,
        id: state.objectCounter,
        displayName: `Retângulo ${state.objectCounter}`,
    };
    state.objectCounter++;
    state.sceneObjects.push(newRectObject);
    state.selectedIndex = state.sceneObjects.length - 1;

    History.saveState(state.sceneObjects); //aqui
    // Atualiza toda a UI
    Drawing.redrawCanvas();
    UI.renderLayerPanel();
    UI.updateContextualPanels();
}

function saveCanvasAsImage() {
    const originalSelectedIndex = state.selectedIndex;
    state.selectedIndex = -1;
    Drawing.redrawCanvas();
    const dataURL = canvas.toDataURL('image/png');
    state.selectedIndex = originalSelectedIndex;
    Drawing.redrawCanvas();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'composicao.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addNewTextObject() {
    const textContent = 'Texto Editável';
    const fontSize = 48;
    const font = `${fontSize}px Arial`;
    ctx.font = font;
    const textMetrics = ctx.measureText(textContent);
    const newTextObject = {
        type: 'text', content: textContent, font: font, color: '#343a40',
        x: (canvas.width - textMetrics.width) / 2, y: (canvas.height - fontSize) / 2,
        width: textMetrics.width, height: fontSize, rotation: 0, isVisible: true,
        id: state.objectCounter, displayName: `Texto ${state.objectCounter}`,
    };
    state.objectCounter++;
    state.sceneObjects.push(newTextObject);
    state.selectedIndex = state.sceneObjects.length - 1;

    History.saveState(state.sceneObjects); //AQUI

    Drawing.redrawCanvas();
    UI.renderLayerPanel();
    UI.updateContextualPanels();
}

function deleteObject(indexToDelete) {
    if (indexToDelete < 0 || indexToDelete >= state.sceneObjects.length) return;
    state.sceneObjects.splice(indexToDelete, 1);
    if (state.selectedIndex === indexToDelete) {
        state.selectedIndex = -1;
    } else if (state.selectedIndex > indexToDelete) {
        state.selectedIndex--;
    }
    History.saveState(state.sceneObjects); //aqui
    Drawing.redrawCanvas();
    UI.renderLayerPanel();
    UI.updateContextualPanels();
}

function moveObject(indexToMove, direction) {
    const newIndex = indexToMove + direction;
    if (newIndex < 0 || newIndex >= state.sceneObjects.length) return;
    [state.sceneObjects[indexToMove], state.sceneObjects[newIndex]] = [state.sceneObjects[newIndex], state.sceneObjects[indexToMove]];
    if (state.selectedIndex === indexToMove) {
        state.selectedIndex = newIndex;
    } else if (state.selectedIndex === newIndex) {
        state.selectedIndex = indexToMove;
    }
    History.saveState(state.sceneObjects); //aqui
    Drawing.redrawCanvas();
    UI.renderLayerPanel();
}

function applyFilter(filterName) {
    if (state.selectedIndex === -1 || state.sceneObjects[state.selectedIndex].type !== 'image') return;
    const selectedObject = state.sceneObjects[state.selectedIndex];
    const originalImage = selectedObject.originalImg;
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = originalImage.width;
    offscreenCanvas.height = originalImage.height;
    offscreenCtx.drawImage(originalImage, 0, 0);
    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const filteredImageData = ImageFilters[filterName](imageData);
    offscreenCtx.putImageData(filteredImageData, 0, 0);
    const filteredImage = new Image();
    filteredImage.src = offscreenCanvas.toDataURL();
    filteredImage.onload = () => {
        selectedObject.img = filteredImage;
        History.saveState(state.sceneObjects); //aqui
        Drawing.redrawCanvas();
    };
}

function handleLayerListClick(event) {
    const target = event.target;
    const upBtn = target.closest('.move-up-btn');
    if (upBtn && !upBtn.classList.contains('disabled')) {
        moveObject(parseInt(upBtn.dataset.index, 10), +1); return;
    }
    const downBtn = target.closest('.move-down-btn');
    if (downBtn && !downBtn.classList.contains('disabled')) {
        moveObject(parseInt(downBtn.dataset.index, 10), -1); return;
    }
    const visibilityToggle = target.closest('.visibility-toggle');
    if (visibilityToggle) {
        const index = parseInt(visibilityToggle.dataset.index, 10);
        state.sceneObjects[index].isVisible = !state.sceneObjects[index].isVisible;
        if (state.selectedIndex === index && !state.sceneObjects[index].isVisible) state.selectedIndex = -1;
    }
    const deleteBtn = target.closest('.delete-btn');
    if (deleteBtn) {
        deleteObject(parseInt(deleteBtn.dataset.index, 10)); return;
    }
    const clickedItem = target.closest('.layer-item');
    if (clickedItem) {
        const index = parseInt(clickedItem.dataset.index, 10);
        if (state.sceneObjects[index].isVisible) state.selectedIndex = index;
    }
    Drawing.redrawCanvas();
    UI.renderLayerPanel();
    UI.updateContextualPanels();
}

function handleFilterPanelClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (state.selectedIndex === -1 || state.sceneObjects[state.selectedIndex].type !== 'image') return;
    const filter = button.dataset.filter;
    const selectedObject = state.sceneObjects[state.selectedIndex];
    if (filter === 'reset') {
        selectedObject.img = selectedObject.originalImg;
        History.saveState(state.sceneObjects); //aqui
        Drawing.redrawCanvas();
    } else {
        applyFilter(filter);
    }
}

function handleKeyDown(event) {

    // --- ADICIONE ESTE BLOCO NO INÍCIO DA FUNÇÃO ---
    if (event.key === ' ') {
        event.preventDefault(); // Impede a página de rolar para baixo
        isSpacebarDown = true;
        canvas.style.cursor = 'grab'; // Muda o cursor para a "mãozinha"
    }
    // --------------------------------------------------

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // --- LÓGICA DE DESFAZER (UNDO) ---
    if (isCtrlOrCmd && event.key.toLowerCase() === 'z') {
        console.log("UNDO");
        event.preventDefault();
        const prevState = History.undo();
        if (prevState) {
            // Substituímos todo o nosso estado da cena pelo estado do histórico
            state.sceneObjects = prevState;
            state.selectedIndex = -1; // Limpa a seleção para evitar inconsistências

            // Atualiza toda a UI
            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
        }
        return;
    }

    // --- LÓGICA DE REFAZER (REDO) ---
    if (isCtrlOrCmd && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        console.log("REDO");
        const nextState = History.redo();
        if (nextState) {
            state.sceneObjects = nextState;
            state.selectedIndex = -1;

            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
        }
        return;
    }

    // --- Lógicas existentes ---
    if (isCtrlOrCmd && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        if (state.selectedIndex !== -1) {
            state.clipboard = { ...state.sceneObjects[state.selectedIndex] };
        }
        return;
    }

    if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        if (state.clipboard !== null) {
            const newObject = { ...state.clipboard };
            newObject.x += 20;
            newObject.y += 20;
            newObject.id = state.objectCounter;
            newObject.displayName = state.clipboard.type === 'image' ? `Camada ${state.objectCounter}` : `Texto ${state.objectCounter}`;
            state.objectCounter++;

            state.sceneObjects.push(newObject);
            state.selectedIndex = state.sceneObjects.length - 1;

            History.saveState(state.sceneObjects); // Salva o 'colar' como uma ação

            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
        }
        return;
    }

    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedIndex !== -1) {
        event.preventDefault();
        deleteObject(state.selectedIndex); // deleteObject já chama o saveState
    }
}

function handleFileChange(event) {
    for (const file of event.target.files) {
        if (!file.type.startsWith('image/')) continue;
        const userImage = new Image();
        const imageURL = URL.createObjectURL(file);
        userImage.onload = () => {
            const newImageObject = {
                type: 'image', originalImg: userImage, img: userImage, name: file.name,
                id: state.objectCounter, displayName: `Camada ${state.objectCounter}`,
                x: 0, y: 0, width: 0, height: 0, isVisible: true, rotation: 0
            };
            state.objectCounter++;
            const canvasAspectRatio = canvas.width / canvas.height;
            const imageAspectRatio = userImage.width / userImage.height;
            if (imageAspectRatio > canvasAspectRatio) { newImageObject.width = canvas.width * 0.5; newImageObject.height = (canvas.width * 0.5) / imageAspectRatio; } else { newImageObject.height = canvas.height * 0.5; newImageObject.width = (canvas.height * 0.5) * imageAspectRatio; }
            newImageObject.x = (canvas.width - newImageObject.width) / 2;
            newImageObject.y = (canvas.height - newImageObject.height) / 2;
            state.sceneObjects.push(newImageObject);
            state.selectedIndex = state.sceneObjects.length - 1;
            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
            URL.revokeObjectURL(imageURL);
        };
        userImage.src = imageURL;
    }
    fileInput.value = '';
}

function handleDoubleClick(event) {
    const rect = canvas.getBoundingClientRect();
    // Coordenadas do mouse na tela (espaço da tela)
    const screenMouseX = event.clientX - rect.left;
    const screenMouseY = event.clientY - rect.top;

    // Converte para as coordenadas do "mundo"
    const worldMouse = screenToWorld(screenMouseX, screenMouseY);
    const mouseX = worldMouse.x;
    const mouseY = worldMouse.y;

    // Agora fazemos a verificação de clique com as coordenadas corretas
    // (Esta lógica precisa ser adicionada, pois antes não verificávamos a posição)
    if (state.selectedIndex === -1 || state.sceneObjects[state.selectedIndex].type !== 'text') {
        return;
    }
    const selectedObject = state.sceneObjects[state.selectedIndex];
    //Adicione esse IF 
    // Verifica se o duplo clique foi dentro do objeto de texto selecionado

    if (mouseX >= selectedObject.x && mouseX <= selectedObject.x + selectedObject.width &&
        mouseY >= selectedObject.y && mouseY <= selectedObject.y + selectedObject.height) {

        const newText = prompt("Edite o texto:", selectedObject.content);
        if (newText !== null && newText !== selectedObject.content) {
            selectedObject.content = newText;
            ctx.font = selectedObject.font;
            const textMetrics = ctx.measureText(selectedObject.content);
            const oldWidth = selectedObject.width;
            selectedObject.width = textMetrics.width;
            selectedObject.x += (oldWidth - selectedObject.width) / 2;
            History.saveState(state.sceneObjects); //aqui
            Drawing.redrawCanvas();
            UI.renderLayerPanel();
        }
    }
}

function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const screenMouseX = event.clientX - rect.left;
    const screenMouseY = event.clientY - rect.top;

    if (isSpacebarDown) {
        state.interaction.isPanning = true;
        canvas.style.cursor = 'grabbing';
        // --- CORREÇÃO AQUI: Inicializa as variáveis de Pan ---
        state.interaction.lastPanX = screenMouseX;
        state.interaction.lastPanY = screenMouseY;
        return;
    }


    // Converte para as coordenadas do "mundo"
    const worldMouse = screenToWorld(screenMouseX, screenMouseY);
    const mouseX = worldMouse.x;
    const mouseY = worldMouse.y;

    let previousSelectedIndex = state.selectedIndex;
    state.interaction.lastMouseX = mouseX;
    state.interaction.lastMouseY = mouseY;
    if (state.selectedIndex !== -1) {
        const selectedObject = state.sceneObjects[state.selectedIndex];
        const localMouseX = mouseX - (selectedObject.x + selectedObject.width / 2);
        const localMouseY = mouseY - (selectedObject.y + selectedObject.height / 2);
        const angle = -selectedObject.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedMouseX = localMouseX * cos - localMouseY * sin;
        const rotatedMouseY = localMouseX * sin + localMouseY * cos;
        const allHandles = Drawing.getHandlePositions(selectedObject);
        const halfHandle = 8 / 2;
        const rotationHandleRadius = 8 / 1.5;
        const rotHandle = allHandles.rotation;
        const dxRot = rotatedMouseX - rotHandle.x;
        const dyRot = rotatedMouseY - rotHandle.y;
        if (Math.sqrt(dxRot * dxRot + dyRot * dyRot) <= rotationHandleRadius) {
            state.interaction.isRotating = true;
            return;
        }
        for (const name in allHandles.resize) {
            const pos = allHandles.resize[name];
            if (rotatedMouseX >= pos.x - halfHandle && rotatedMouseX <= pos.x + halfHandle && rotatedMouseY >= pos.y - halfHandle && rotatedMouseY <= pos.y + halfHandle) {
                state.interaction.isResizing = true;
                state.interaction.activeHandle = name;
                return;
            }
        }
    }
    let clickedOnSomething = false;
    for (let i = state.sceneObjects.length - 1; i >= 0; i--) {
        const obj = state.sceneObjects[i];
        if (!obj.isVisible) continue;
        const localMouseX = mouseX - (obj.x + obj.width / 2);
        const localMouseY = mouseY - (obj.y + obj.height / 2);
        const angle = -obj.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedMouseX = localMouseX * cos - localMouseY * sin;
        const rotatedMouseY = localMouseX * sin + localMouseY * cos;
        if (rotatedMouseX >= -obj.width / 2 && rotatedMouseX <= obj.width / 2 && rotatedMouseY >= -obj.height / 2 && rotatedMouseY <= obj.height / 2) {
            state.selectedIndex = i;
            state.interaction.isDragging = true;
            clickedOnSomething = true;
            break;
        }
    }
    if (!clickedOnSomething) {
        state.selectedIndex = -1;
    }
    if (previousSelectedIndex !== state.selectedIndex) {
        Drawing.redrawCanvas();
        UI.renderLayerPanel();
        UI.updateContextualPanels();
    } else {
        Drawing.redrawCanvas();
    }
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const screenMouseX = event.clientX - rect.left;
    const screenMouseY = event.clientY - rect.top;

    if (state.interaction.isPanning) {
        // --- CORREÇÃO AQUI: Usa e atualiza as variáveis de Pan ---
        const dx = screenMouseX - state.interaction.lastPanX;
        const dy = screenMouseY - state.interaction.lastPanY;
        state.offsetX += dx;
        state.offsetY += dy;
        state.interaction.lastPanX = screenMouseX;
        state.interaction.lastPanY = screenMouseY;
        Drawing.redrawCanvas();
        return;
    }
    // ----------------------------------
    updateCursor(screenMouseX, screenMouseY);
    if (state.selectedIndex === -1) {
        return;
    }
    const worldMouse = screenToWorld(screenMouseX, screenMouseY);
    const mouseX = worldMouse.x;
    const mouseY = worldMouse.y;
    
    const selectedObject = state.sceneObjects[state.selectedIndex];
    if (state.interaction.isRotating) {
        const centerX = selectedObject.x + selectedObject.width / 2;
        const centerY = selectedObject.y + selectedObject.height / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        selectedObject.rotation = angle;
        Drawing.redrawCanvas();
    } else if (state.interaction.isResizing) {
        const localMouseX = mouseX - (selectedObject.x + selectedObject.width / 2);
        const localMouseY = mouseY - (selectedObject.y + selectedObject.height / 2);
        const angle = -selectedObject.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedMouseX = localMouseX * cos - localMouseY * sin;
        const rotatedMouseY = localMouseX * sin + localMouseY * cos;
        resizeImage(selectedObject, rotatedMouseX, rotatedMouseY);
        Drawing.redrawCanvas();
    } else if (state.interaction.isDragging) {
        const dx = mouseX - state.interaction.lastMouseX;
        const dy = mouseY - state.interaction.lastMouseY;
        selectedObject.x += dx;
        selectedObject.y += dy;
        state.interaction.lastMouseX = mouseX;
        state.interaction.lastMouseY = mouseY;
        Drawing.redrawCanvas();
    }
    //updateCursor(mouseX, mouseY);
    updateCursor(screenMouseX, screenMouseY);
}

function handleMouseUp() {
    // 🖱️ Quando o usuário solta o mouse, é hora de verificar o que estava rolando!
    // Pode ter sido um arrasto, um redimensionamento ou até uma rotação épica 🔄
    if (state.interaction.isDragging || state.interaction.isResizing || state.interaction.isRotating) {
        // 📸 Momento de eternizar a mudança! 
        // Tiramos uma "foto" do novo estado e guardamos no nosso histórico ⏳
        History.saveState(state.sceneObjects);
    }

    // 🧹 Depois que a ação terminou, limpamos todas as flags de interação
    // (ninguém quer variáveis presas achando que ainda estão mexendo em algo 😅)
    state.interaction.isResizing = false;
    state.interaction.isDragging = false;
    state.interaction.isRotating = false;
    state.interaction.isPanning = false;
    state.interaction.activeHandle = null; // 🔚 E garantimos que nada está "ativo"
}

function resizeImage(obj, rotatedMouseX, rotatedMouseY) {
    const minSize = 20;
    const { activeHandle } = state.interaction;
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    if (obj.type === 'text') {
        const oldFontSize = parseFloat(obj.font);
        let newWidth = obj.width;
        if (activeHandle.includes('right')) { newWidth = Math.max(minSize, rotatedMouseX * 2); }
        else if (activeHandle.includes('left')) { newWidth = Math.max(minSize, -rotatedMouseX * 2); }
        if (activeHandle.includes('top') || activeHandle.includes('bottom')) {
            const newHeight = activeHandle.includes('top') ? Math.max(minSize, -rotatedMouseY * 2) : Math.max(minSize, rotatedMouseY * 2);
            if (obj.height > 0) newWidth = (newHeight / obj.height) * obj.width;
        }
        const newFontSize = (obj.width > 0) ? Math.max(10, (newWidth / obj.width) * oldFontSize) : oldFontSize;
        obj.font = `${newFontSize}px Arial`;
        ctx.font = obj.font;
        const textMetrics = ctx.measureText(obj.content);
        obj.width = textMetrics.width;
        obj.height = newFontSize;
    } else {
        let newWidth = obj.width;
        let newHeight = obj.height;
        if (activeHandle.includes('right')) { newWidth = Math.max(minSize, rotatedMouseX * 2); }
        else if (activeHandle.includes('left')) { newWidth = Math.max(minSize, -rotatedMouseX * 2); }
        if (activeHandle.includes('bottom')) { newHeight = Math.max(minSize, rotatedMouseY * 2); }
        else if (activeHandle.includes('top')) { newHeight = Math.max(minSize, -rotatedMouseY * 2); }
        obj.width = newWidth;
        obj.height = newHeight;
    }
    obj.x = centerX - obj.width / 2;
    obj.y = centerY - obj.height / 2;
}

function updateCursor(screenMouseX, screenMouseY) {
    const worldMouse = screenToWorld(screenMouseX, screenMouseY);
    const mouseX = worldMouse.x;
    const mouseY = worldMouse.y;

    let cursor = 'default';
    if (state.selectedIndex !== -1) {
        const selectedObject = state.sceneObjects[state.selectedIndex];
        if (selectedObject.isVisible) {
            const allHandles = Drawing.getHandlePositions(selectedObject);
            const localMouseX = mouseX - (selectedObject.x + selectedObject.width / 2);
            const localMouseY = mouseY - (selectedObject.y + selectedObject.height / 2);
            const angle = -selectedObject.rotation;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedMouseX = localMouseX * cos - localMouseY * sin;
            const rotatedMouseY = localMouseX * sin + localMouseY * cos;
            const halfHandle = 8 / 2;
            const rotHandle = allHandles.rotation;
            const dxRot = rotatedMouseX - rotHandle.x;
            const dyRot = rotatedMouseY - rotHandle.y;
            if (Math.sqrt(dxRot * dxRot + dyRot * dyRot) <= 8 / 1.5) {
                cursor = 'crosshair';
            } else {
                let onResizeHandle = false;
                for (const name in allHandles.resize) {
                    const pos = allHandles.resize[name];
                    if (rotatedMouseX >= pos.x - halfHandle && rotatedMouseX <= pos.x + halfHandle && rotatedMouseY >= pos.y - halfHandle && rotatedMouseY <= pos.y + halfHandle) {
                        const cursors = { 'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize', 'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize', 'top-center': 'ns-resize', 'bottom-center': 'ns-resize', 'middle-left': 'ew-resize', 'middle-right': 'ew-resize', };
                        cursor = cursors[name];
                        onResizeHandle = true;
                        break;
                    }
                }
                if (!onResizeHandle) {
                    const rotatedBodyX = rotatedMouseX;
                    const rotatedBodyY = rotatedMouseY;
                    if (rotatedBodyX >= -selectedObject.width / 2 && rotatedBodyX <= selectedObject.width / 2 && rotatedBodyY >= -selectedObject.height / 2 && rotatedBodyY <= selectedObject.height / 2) {
                        cursor = 'move';
                    } else {
                        cursor = 'default';
                    }
                }
            }
        }
    }
    canvas.style.cursor = cursor;
}

/**
 * Converte coordenadas da tela para coordenadas do "mundo" (considerando zoom e pan).
 * @param {number} screenX - Coordenada X na tela.
 * @param {number} screenY - Coordenada Y na tela.
 * @returns {{x: number, y: number}} - Coordenadas no mundo.
 */
function screenToWorld(screenX, screenY) {
    return {
        x: (screenX - state.offsetX) / state.zoom,
        y: (screenY - state.offsetY) / state.zoom,
    };
}

function handleWheel(event) {
    // Impede que a página inteira role para cima ou para baixo
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const screenMouseX = event.clientX - rect.left;
    const screenMouseY = event.clientY - rect.top;

    // 1. Onde o mouse está no "mundo" ANTES do zoom
    const worldMouseBeforeZoom = screenToWorld(screenMouseX, screenMouseY);

    // 2. Calcula o novo nível de zoom
    const zoomIntensity = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1; // -1 para zoom out, +1 para zoom in
    const newZoom = state.zoom * (1 + direction * zoomIntensity);

    // Limita o zoom para não ficar muito pequeno ou muito grande
    state.zoom = Math.max(0.1, Math.min(newZoom, 20));

    // 3. Onde o mouse estaria no "mundo" DEPOIS do zoom, se não fizéssemos nada
    const worldMouseAfterZoom = screenToWorld(screenMouseX, screenMouseY);

    // 4. Calcula o "desvio" e ajusta o offset para compensar, mantendo o ponto sob o mouse fixo
    state.offsetX += (worldMouseAfterZoom.x - worldMouseBeforeZoom.x) * state.zoom;
    state.offsetY += (worldMouseAfterZoom.y - worldMouseBeforeZoom.y) * state.zoom;

    // 5. Redesenha tudo com o novo zoom e offset
    Drawing.redrawCanvas();
    updateCursor(screenMouseX, screenMouseY); // Atualiza o cursor, passando as coords da tela
}

/**
 * Função auxiliar que converte um objeto de Imagem HTML para uma string Data URL (base64).
 * @param {HTMLImageElement} imgElement - O elemento de imagem a ser convertido.
 * @returns {string} - A representação da imagem como Data URL.
 */
function imageToDataURL(imgElement) {
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = imgElement.naturalWidth;
    offscreenCanvas.height = imgElement.naturalHeight;
    offscreenCtx.drawImage(imgElement, 0, 0);
    return offscreenCanvas.toDataURL();
}

/**
 * Prepara a cena para ser salva, serializa para JSON e inicia o download.
 */
function saveProject() {
    // 1. Cria uma versão "serializável" do nosso estado.
    const savableObjects = state.sceneObjects.map(obj => {
        if (obj.type === 'image') {
            // Se for uma imagem, não podemos salvar o elemento HTML diretamente.
            // Em vez disso, criamos um novo objeto com as Data URLs das imagens.
            const savableImageObj = { ...obj };
            savableImageObj.imgSrc = imageToDataURL(obj.img);
            savableImageObj.originalImgSrc = imageToDataURL(obj.originalImg);
            
            // Removemos os elementos de imagem que não podem ser serializados.
            delete savableImageObj.img;
            delete savableImageObj.originalImg;

            return savableImageObj;
        }
        // Para outros tipos de objeto (texto, retângulo), podemos simplesmente copiá-los.
        return obj;
    });

    // 2. Converte o array de objetos em uma string de texto JSON formatada.
    // O `null, 2` serve para "embelezar" o JSON com indentação, facilitando a leitura.
    const jsonString = JSON.stringify(savableObjects, null, 2);

    // 3. Usa a técnica do "Blob" para criar um arquivo para download.
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'meu-projeto.json'; // O nome do arquivo salvo

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoga a URL do Blob para liberar memória
    URL.revokeObjectURL(url);
}

/**
 * Lida com a seleção do arquivo de projeto .json.
 * @param {Event} event 
 */
function handleProjectFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Usa a API FileReader para ler o conteúdo do arquivo como texto.
    const reader = new FileReader();

    // Quando a leitura terminar, o evento 'onload' é disparado.
    reader.onload = (e) => {
        try {
            const jsonString = e.target.result;
            const loadedObjects = JSON.parse(jsonString);
            
            // Agora, "hidratamos" a cena para reviver os objetos de imagem.
            hydrateScene(loadedObjects);

        } catch (error) {
            console.error("Erro ao carregar o projeto. O arquivo está corrompido?", error);
            alert("Não foi possível ler o arquivo de projeto. Verifique se ele é válido.");
        }
    };

    // Inicia a operação de leitura.
    reader.readAsText(file);
}


/**
 * "Hidrata" os objetos carregados do JSON, recriando os elementos de imagem.
 * @param {Array} objects - O array de objetos lido do JSON.
 */
function hydrateScene(objects) {
    // Cria um array de Promises. Cada promise representará o carregamento de uma imagem.
    const promises = objects.map(obj => {
        // Se não for uma imagem, o objeto já está "vivo".
        if (obj.type !== 'image') {
            return Promise.resolve(obj);
        }

        // Se for uma imagem, retorna uma Promise que só resolve quando as imagens estiverem carregadas.
        return new Promise((resolve, reject) => {
            const originalImg = new Image();
            const currentImg = new Image();
            
            let loadedCount = 0;
            const checkDone = () => {
                loadedCount++;
                // Só resolve a promise quando AMBAS as imagens (original e atual) estiverem carregadas.
                if (loadedCount === 2) {
                    obj.originalImg = originalImg;
                    obj.img = currentImg;
                    delete obj.originalImgSrc; // Removemos as strings, pois já temos os objetos
                    delete obj.imgSrc;
                    resolve(obj);
                }
            };

            originalImg.onload = checkDone;
            currentImg.onload = checkDone;
            originalImg.onerror = reject;
            currentImg.onerror = reject;
            
            originalImg.src = obj.originalImgSrc;
            currentImg.src = obj.imgSrc;
        });
    });

    // Promise.all espera que TODAS as promises no array sejam resolvidas.
    Promise.all(promises)
        .then(hydratedObjects => {
            // Este bloco só executa quando TODAS as imagens do projeto terminaram de carregar.
            console.log("Cena hidratada com sucesso!", hydratedObjects);
            
            // Encontra o maior ID para continuar nosso contador
            const maxId = Math.max(...hydratedObjects.map(o => o.id), -1);
            state.objectCounter = maxId + 1;

            // Substitui o estado da cena pelos novos objetos "vivos"
            state.sceneObjects = hydratedObjects;
            state.selectedIndex = -1; // Limpa a seleção

            // Atualiza toda a UI
            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
        })
        .catch(error => {
            console.error("Erro ao carregar as imagens do projeto.", error);
            alert("Ocorreu um erro ao carregar uma ou mais imagens do projeto.");
        });
}
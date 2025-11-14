import { state } from './state.js';
import * as UI from './ui.js';
import * as Drawing from './drawing.js';
import { ImageFilters } from './ImageFilters.js';

let canvas, ctx, fileInput;

export function initEventHandlers(elements) {
    canvas = elements.canvas;
    ctx = elements.ctx;
    fileInput = elements.fileInput;

    elements.loadButton.addEventListener('click', () => fileInput.click());
    elements.saveButton.addEventListener('click', saveCanvasAsImage);
    elements.addTextButton.addEventListener('click', addNewTextObject);
    elements.layerList.addEventListener('click', handleLayerListClick);
    
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
    
    window.addEventListener('keydown', handleKeyDown);
    fileInput.addEventListener('change', handleFileChange);
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
        Drawing.redrawCanvas();
    } else {
        applyFilter(filter);
    }
}

function handleKeyDown(event) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    if (isCtrlOrCmd && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        if (state.selectedIndex !== -1) state.clipboard = { ...state.sceneObjects[state.selectedIndex] };
        return;
    }
    if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        if (state.clipboard !== null) {
            const newObject = { ...state.clipboard };
            newObject.x += 20; newObject.y += 20;
            newObject.id = state.objectCounter;
            newObject.displayName = state.clipboard.type === 'image' ? `Camada ${state.objectCounter}` : `Texto ${state.objectCounter}`;
            state.objectCounter++;
            state.sceneObjects.push(newObject);
            state.selectedIndex = state.sceneObjects.length - 1;
            Drawing.redrawCanvas();
            UI.renderLayerPanel();
            UI.updateContextualPanels();
        }
        return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedIndex !== -1) {
        event.preventDefault();
        deleteObject(state.selectedIndex);
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
    if (state.selectedIndex === -1 || state.sceneObjects[state.selectedIndex].type !== 'text') return;
    const selectedObject = state.sceneObjects[state.selectedIndex];
    const newText = prompt("Edite o texto:", selectedObject.content);
    if (newText !== null && newText !== selectedObject.content) {
        selectedObject.content = newText;
        ctx.font = selectedObject.font;
        const textMetrics = ctx.measureText(selectedObject.content);
        const oldWidth = selectedObject.width;
        selectedObject.width = textMetrics.width;
        selectedObject.x += (oldWidth - selectedObject.width) / 2;
        Drawing.redrawCanvas();
        UI.renderLayerPanel();
    }
}

function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
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
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (state.selectedIndex === -1) {
        updateCursor(mouseX, mouseY);
        return;
    }
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
    updateCursor(mouseX, mouseY);
}

function handleMouseUp() {
    state.interaction.isResizing = false;
    state.interaction.isDragging = false;
    state.interaction.isRotating = false;
    state.interaction.activeHandle = null;
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

function updateCursor(mouseX, mouseY) {
    let cursor = 'default';
    if (state.selectedIndex !== -1) {
        const selectedObject = state.sceneObjects[state.selectedIndex];
        if(selectedObject.isVisible) {
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
                     if(rotatedBodyX >= -selectedObject.width/2 && rotatedBodyX <= selectedObject.width/2 && rotatedBodyY >= -selectedObject.height/2 && rotatedBodyY <= selectedObject.height/2) {
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
// VERSÃO COMPLETA E CORRIGIDA - 07/OUT/2025
import CanvasManager from './CanvasManager.js';

document.addEventListener('DOMContentLoaded', main);

function main() {
    try {
const canvasManager = new CanvasManager('meu-canvas');
const canvas = canvasManager.canvas;
const ctx = canvasManager.getContext();

const loadButton = document.getElementById('btnCarregarImagem');
const saveButton = document.getElementById('btnSalvarImagem');
const fileInput = document.getElementById('seletorDeArquivo');
const layerList = document.getElementById('layer-list');
const addTextButton = document.getElementById('btnAdicionarTexto'); //BOTAO ADICIONAR TEXTO

loadButton.addEventListener('click', () => fileInput.click());
saveButton.addEventListener('click', saveCanvasAsImage);
// NOVO EVENT LISTENER
addTextButton.addEventListener('click', addNewTextObject); 

let sceneObjects = [];
let selectedIndex = -1;
let objectCounter = 0;

let clipboard = null; //Adicione aqui "Nossa área de transferência interna"

let interactionState = { isResizing: false, isDragging: false, isRotating: false, activeHandle: null, lastMouseX: 0, lastMouseY: 0 };
const handleSize = 8;

        function saveCanvasAsImage() {
            const originalSelectedIndex = selectedIndex;
            selectedIndex = -1;
            redrawCanvas();
            const dataURL = canvas.toDataURL('image/png');
            selectedIndex = originalSelectedIndex;
            redrawCanvas();
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'composicao.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function deleteObject(indexToDelete) {
            if (indexToDelete < 0 || indexToDelete >= sceneObjects.length) return;
            sceneObjects.splice(indexToDelete, 1);
            if (selectedIndex === indexToDelete) {
                selectedIndex = -1;
            } else if (selectedIndex > indexToDelete) {
                selectedIndex--;
            }
            redrawCanvas();
            renderLayerPanel();
        }

        function moveObject(indexToMove, direction) {
            const newIndex = indexToMove + direction;
            if (newIndex < 0 || newIndex >= sceneObjects.length) return;
            [sceneObjects[indexToMove], sceneObjects[newIndex]] = [sceneObjects[newIndex], sceneObjects[indexToMove]];
            if (selectedIndex === indexToMove) {
                selectedIndex = newIndex;
            } else if (selectedIndex === newIndex) {
                selectedIndex = indexToMove;
            }
            redrawCanvas();
            renderLayerPanel();
        }

        function renderLayerPanel() {
            layerList.innerHTML = '';
            for (let i = sceneObjects.length - 1; i >= 0; i--) {
                const obj = sceneObjects[i];
                const li = document.createElement('li');
                li.className = 'layer-item';
                li.dataset.index = i;
                const nameSpan = document.createElement('span');
                nameSpan.textContent = obj.displayName;
                const iconsDiv = document.createElement('div');
                iconsDiv.className = 'layer-icons';
                const upArrow = document.createElement('span');
                upArrow.className = 'reorder-btn move-up-btn';
                upArrow.innerHTML = '↑';
                upArrow.dataset.index = i;
                const downArrow = document.createElement('span');
                downArrow.className = 'reorder-btn move-down-btn';
                downArrow.innerHTML = '↓';
                downArrow.dataset.index = i;
                if (i >= sceneObjects.length - 1) upArrow.classList.add('disabled');
                if (i <= 0) downArrow.classList.add('disabled');
                const visibilityToggle = document.createElement('span');
                visibilityToggle.className = 'visibility-toggle';
                visibilityToggle.dataset.index = i;
                visibilityToggle.innerHTML = obj.isVisible ? '<i class="bi bi-eye-fill"></i>' : '<i class="bi bi-eye-slash-fill"></i>';
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.dataset.index = i;
                iconsDiv.appendChild(upArrow);
                iconsDiv.appendChild(downArrow);
                iconsDiv.appendChild(visibilityToggle);
                iconsDiv.appendChild(deleteBtn);
                li.appendChild(nameSpan);
                li.appendChild(iconsDiv);
                if (i === selectedIndex) li.classList.add('active');
                if (!obj.isVisible) li.classList.add('is-hidden');
                layerList.appendChild(li);
            }
        }

        layerList.addEventListener('click', (event) => {
            const target = event.target;
            const visibilityToggle = target.closest('.visibility-toggle');
            if (visibilityToggle) {
                const index = parseInt(visibilityToggle.dataset.index, 10);
                sceneObjects[index].isVisible = !sceneObjects[index].isVisible;
                if (selectedIndex === index && !sceneObjects[index].isVisible) selectedIndex = -1;
                redrawCanvas();
                renderLayerPanel();
                return;
            }
            const deleteBtn = target.closest('.delete-btn');
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index, 10);
                deleteObject(index);
                return;
            }
            const upBtn = target.closest('.move-up-btn');
            if (upBtn && !upBtn.classList.contains('disabled')) {
                const index = parseInt(upBtn.dataset.index, 10);
                moveObject(index, +1);
                return;
            }
            const downBtn = target.closest('.move-down-btn');
            if (downBtn && !downBtn.classList.contains('disabled')) {
                const index = parseInt(downBtn.dataset.index, 10);
                moveObject(index, -1);
                return;
            }
            const clickedItem = target.closest('.layer-item');
            if (clickedItem) {
                const index = parseInt(clickedItem.dataset.index, 10);
                if (sceneObjects[index].isVisible) {
                    selectedIndex = index;
                    redrawCanvas();
                    renderLayerPanel();
                }
            }
        });


// --- NOVA FUNÇÃO PARA ADICIONAR TEXTO ---
function addNewTextObject() {
    // Define o conteúdo padrão do texto e sua formatação
    const textContent = 'Texto Editável';
    const fontSize = 48;
    const font = `${fontSize}px Arial`;
    
    // Antes de criar o objeto, precisamos medir o tamanho do texto no canvas
    // Isso nos permite calcular sua largura e definir a posição centralizada
    ctx.font = font;
    const textMetrics = ctx.measureText(textContent);
    
    // Cria o novo objeto de texto com suas propriedades básicas
    const newTextObject = {
        type: 'text',              // Indica que o objeto é do tipo "texto"
        content: textContent,      // Texto que será exibido
        font: font,                // Fonte e tamanho do texto
        color: '#343a40',          // Cor padrão (cinza escuro)
        
        // Posiciona o texto no centro do canvas, considerando sua largura e altura
        x: (canvas.width - textMetrics.width) / 2,
        y: (canvas.height - fontSize) / 2,
        
        // Define dimensões aproximadas para a área de seleção
        width: textMetrics.width,
        height: fontSize,          // Usamos o tamanho da fonte como referência de altura
        
        rotation: 0,               // Sem rotação inicial
        isVisible: true,           // O texto começa visível
        id: objectCounter,         // ID único do objeto
        displayName: `Texto ${objectCounter}`, // Nome que aparece no painel de camadas
    };
    
    // Atualiza o contador global de objetos
    objectCounter++;
    
    // Adiciona o novo texto à lista de objetos da cena
    sceneObjects.push(newTextObject);
    
    // Define o novo texto como o item selecionado
    selectedIndex = sceneObjects.length - 1;
    
    // Atualiza o canvas e o painel de camadas
    redrawCanvas();
    renderLayerPanel();
}


// 🎹 Adiciona um ouvinte global para capturar teclas pressionadas
window.addEventListener('keydown', (event) => {
    // Verifica se o usuário tá segurando Ctrl (Windows/Linux) ou Cmd (Mac)
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // 🧩 --- COPIAR (Ctrl + C) ---
    if (isCtrlOrCmd && event.key.toLowerCase() === 'c') {
        event.preventDefault(); // Cancela o comportamento padrão do navegador
        if (selectedIndex !== -1) {
            // Clona o objeto selecionado usando o spread operator (...)
            // Isso cria uma cópia leve do objeto atual
            clipboard = { ...sceneObjects[selectedIndex] };
            console.log('Objeto copiado para a área de transferência!', clipboard);
        }
        return; // Sai da função (não deixa passar pra outras verificações)
    }

    // 🧩 --- COLAR (Ctrl + V) ---
    if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
        event.preventDefault(); // Evita o colar padrão do navegador
        if (clipboard !== null) {
            // Cria uma nova cópia a partir do conteúdo salvo na área de transferência
            const newObject = { ...clipboard };
            
            // Move um pouquinho pra não colar exatamente em cima do original
            newObject.x += 20;
            newObject.y += 20;

            // Dá uma nova identidade pro clone
            newObject.id = objectCounter;
            newObject.displayName = `Camada ${objectCounter}`;
            objectCounter++;
            
            // Adiciona o clone na cena e seleciona ele
            sceneObjects.push(newObject);
            selectedIndex = sceneObjects.length - 1;

            // Atualiza o canvas e o painel de camadas
            redrawCanvas();
            renderLayerPanel();
        }
        return;
    }
    
    // 🗑️ --- DELETAR (Delete / Backspace) ---
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIndex !== -1) {
        event.preventDefault(); // Evita apagar texto acidentalmente
        deleteObject(selectedIndex); // Remove o objeto selecionado
    }
});

        function redrawCanvas() {
            canvasManager.clear();
            const ctx = canvasManager.getContext();
            sceneObjects.forEach(obj => {
                if (obj.isVisible) {
                    const { x, y, width, height, rotation } = obj;
                    
                    ctx.save();
                    ctx.translate(x + width / 2, y + height / 2);
                    ctx.rotate(rotation);

                    // A "mágica" acontece aqui:
                    switch(obj.type) {
                        case 'image':
                            canvasManager.drawImage(obj.img, -width / 2, -height / 2, width, height);
                            break;
                        case 'text':
                            // Para texto, precisamos definir a fonte e a cor antes de desenhar
                            ctx.font = obj.font;
                            ctx.fillStyle = obj.color;
                            ctx.textAlign = 'center'; // Centraliza o texto na horizontal
                            ctx.textBaseline = 'middle'; // Centraliza o texto na vertical
                            canvasManager.drawText(obj.content, 0, 0); // Desenha no centro (0,0) do nosso canvas girado
                            break;
                    }

                    ctx.restore();
                }
            });
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                const { x, y, width, height, rotation } = selectedObject;
                ctx.save();
                ctx.translate(x + width / 2, y + height / 2);
                ctx.rotate(rotation);
                canvasManager.drawDashedRect(-width / 2, -height / 2, width, height, 'rgba(0, 0, 0, 0.7)', [4, 4]);
                drawHandles(selectedObject);
                ctx.restore();
            }
            if (sceneObjects.length === 0) {
                 canvasManager.drawText('Clique para carregar uma imagem.', canvasManager.width / 2 - 180, canvasManager.height / 2, '#555', '24px sans-serif');
            }
        }

function getHandlePositions(obj) {
    const { width, height } = obj;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const resizeHandles = {
        'top-left':     { x: -halfWidth, y: -halfHeight },
        'top-center':   { x: 0,          y: -halfHeight },
        'top-right':    { x: halfWidth,  y: -halfHeight },
        'middle-left':  { x: -halfWidth, y: 0 },
        'middle-right': { x: halfWidth,  y: 0 },
        'bottom-left':  { x: -halfWidth, y: halfHeight },
        'bottom-center':{ x: 0,          y: halfHeight },
        'bottom-right': { x: halfWidth,  y: halfHeight }
    };
    
    const rotationHandleYOffset = 30;
    const rotationHandle = {
        x: 0, // Alinhado com o centro X
        y: -halfHeight - rotationHandleYOffset // Acima da borda superior
    };

    return { resize: resizeHandles, rotation: rotationHandle };
}

        function drawHandles(obj) {
            const allHandles = getHandlePositions(obj);
            const halfHandle = handleSize / 2;
            for (const name in allHandles.resize) {
                const pos = allHandles.resize[name];
                canvasManager.drawRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'white');
                canvasManager.ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'black');
            }
            const rotHandle = allHandles.rotation;
            const topCenterHandle = allHandles.resize['top-center'];
            canvasManager.drawLine(topCenterHandle.x, topCenterHandle.y, rotHandle.x, rotHandle.y, 'rgba(0, 0, 0, 0.7)');
            canvasManager.drawCircle(rotHandle.x, rotHandle.y, handleSize / 1.5, '#28a745');
            canvasManager.ctx.beginPath();
            canvasManager.ctx.arc(rotHandle.x, rotHandle.y, handleSize / 1.5, 0, Math.PI * 2);
            canvasManager.ctx.strokeStyle = 'black';
            canvasManager.ctx.stroke();
        }

        canvas.addEventListener('mousedown', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let previousSelectedIndex = selectedIndex;
            interactionState.lastMouseX = mouseX;
            interactionState.lastMouseY = mouseY;
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                const localMouseX = mouseX - (selectedObject.x + selectedObject.width / 2);
                const localMouseY = mouseY - (selectedObject.y + selectedObject.height / 2);
                const angle = -selectedObject.rotation;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const rotatedMouseX = localMouseX * cos - localMouseY * sin;
                const rotatedMouseY = localMouseX * sin + localMouseY * cos;
                const allHandles = getHandlePositions(selectedObject);
                const halfHandle = handleSize / 2;
                const rotationHandleRadius = handleSize / 1.5;
                const rotHandle = allHandles.rotation;
                const dxRot = rotatedMouseX - rotHandle.x;
                const dyRot = rotatedMouseY - rotHandle.y;
                if (Math.sqrt(dxRot * dxRot + dyRot * dyRot) <= rotationHandleRadius) {
                    interactionState.isRotating = true;
                    return;
                }
                for (const name in allHandles.resize) {
                    const pos = allHandles.resize[name];
                    if (rotatedMouseX >= pos.x - halfHandle && rotatedMouseX <= pos.x + halfHandle && rotatedMouseY >= pos.y - halfHandle && rotatedMouseY <= pos.y + halfHandle) {
                        interactionState.isResizing = true;
                        interactionState.activeHandle = name;
                        return;
                    }
                }
            }
            let clickedOnSomething = false;
            for (let i = sceneObjects.length - 1; i >= 0; i--) {
                const obj = sceneObjects[i];
                if (!obj.isVisible) continue;
                const localMouseX = mouseX - (obj.x + obj.width / 2);
                const localMouseY = mouseY - (obj.y + obj.height / 2);
                const angle = -obj.rotation;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const rotatedMouseX = localMouseX * cos - localMouseY * sin;
                const rotatedMouseY = localMouseX * sin + localMouseY * cos;
                if (rotatedMouseX >= -obj.width / 2 && rotatedMouseX <= obj.width / 2 && rotatedMouseY >= -obj.height / 2 && rotatedMouseY <= obj.height / 2) {
                    selectedIndex = i;
                    interactionState.isDragging = true;
                    clickedOnSomething = true;
                    break;
                }
            }
            if (!clickedOnSomething) {
                selectedIndex = -1;
            }
            if (previousSelectedIndex !== selectedIndex) {
                redrawCanvas();
                renderLayerPanel();
            } else {
                redrawCanvas();
            }
        });

        canvas.addEventListener('mousemove', (event) => {
            if (selectedIndex === -1) {
                updateCursor(event.clientX - canvas.getBoundingClientRect().left, event.clientY - canvas.getBoundingClientRect().top);
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const selectedObject = sceneObjects[selectedIndex];
            if (interactionState.isRotating) {
                const centerX = selectedObject.x + selectedObject.width / 2;
                const centerY = selectedObject.y + selectedObject.height / 2;
                const dx = mouseX - centerX;
                const dy = mouseY - centerY;
                const angle = Math.atan2(dy, dx) + Math.PI / 2;
                selectedObject.rotation = angle;
                redrawCanvas();
            } else if (interactionState.isResizing) {
                resizeImage(selectedObject, mouseX, mouseY);
                redrawCanvas();
            } else if (interactionState.isDragging) {
                const dx = mouseX - interactionState.lastMouseX;
                const dy = mouseY - interactionState.lastMouseY;
                selectedObject.x += dx;
                selectedObject.y += dy;
                interactionState.lastMouseX = mouseX;
                interactionState.lastMouseY = mouseY;
                redrawCanvas();
            }
            updateCursor(mouseX, mouseY);
        });

        canvas.addEventListener('mouseup', () => {
            interactionState.isResizing = false;
            interactionState.isDragging = false;
            interactionState.isRotating = false;
            interactionState.activeHandle = null;
        });

        canvas.addEventListener('dblclick', (event) => {
    // Só faz algo se um objeto de texto estiver selecionado
    if (selectedIndex === -1 || sceneObjects[selectedIndex].type !== 'text') {
        return;
    }
    
    const selectedObject = sceneObjects[selectedIndex];
    
    // Usa o prompt do navegador para pedir o novo texto ao usuário
    const newText = prompt("Edite o texto:", selectedObject.content);

    // Se o usuário não clicou em "Cancelar"
    if (newText !== null) {
        // 1. Atualiza o conteúdo do texto no nosso objeto de estado
        selectedObject.content = newText;

        // 2. IMPORTANTE: Recalcula a largura e altura do objeto com o novo texto
        ctx.font = selectedObject.font;
        const textMetrics = ctx.measureText(selectedObject.content);
        
        const oldWidth = selectedObject.width;
        selectedObject.width = textMetrics.width;
        
        // Mantém o objeto centralizado após a mudança de largura
        selectedObject.x += (oldWidth - selectedObject.width) / 2;

        // 3. Redesenha o canvas para mostrar a alteração
        redrawCanvas();
        // Também atualizamos o painel de camadas, caso o nome mude no futuro
        renderLayerPanel(); 
    }
});

function resizeImage(obj, mouseX, mouseY) {

    // --- CASO 1: O OBJETO É UMA IMAGEM ---
    if (obj.type === 'image') {
        // Mantém a lógica original para redimensionar imagens
        const { activeHandle } = interactionState;
        const { x, y, width, height } = obj;

        // Variáveis que receberão os novos valores após o redimensionamento
        let newX = x, newY = y, newWidth = width, newHeight = height;
        const minSize = 20; // Define o tamanho mínimo permitido

        // Verifica qual alça de redimensionamento o usuário está movendo
        switch (activeHandle) {
            case 'top-left':
                newWidth = Math.max(x + width - mouseX, minSize);
                newHeight = Math.max(y + height - mouseY, minSize);
                newX = x + width - newWidth;
                newY = y + height - newHeight;
                break;
            case 'top-center':
                newHeight = Math.max(y + height - mouseY, minSize);
                newY = y + height - newHeight;
                break;
            case 'top-right':
                newWidth = Math.max(mouseX - x, minSize);
                newHeight = Math.max(y + height - mouseY, minSize);
                newY = y + height - newHeight;
                break;
            case 'middle-left':
                newWidth = Math.max(x + width - mouseX, minSize);
                newX = x + width - newWidth;
                break;
            case 'middle-right':
                newWidth = Math.max(mouseX - x, minSize);
                break;
            case 'bottom-left':
                newWidth = Math.max(x + width - mouseX, minSize);
                newHeight = Math.max(mouseY - y, minSize);
                newX = x + width - newWidth;
                break;
            case 'bottom-center':
                newHeight = Math.max(mouseY - y, minSize);
                break;
            case 'bottom-right':
                newWidth = Math.max(mouseX - x, minSize);
                newHeight = Math.max(mouseY - y, minSize);
                break;
        }

        // Atualiza as dimensões da imagem
        obj.x = newX;
        obj.y = newY;
        obj.width = newWidth;
        obj.height = newHeight;
    }

    // --- CASO 2: O OBJETO É UM TEXTO ---
    else if (obj.type === 'text') {
        // Calcula o centro do texto atual
        const center_x = obj.x + obj.width / 2;
        const center_y = obj.y + obj.height / 2;

        // Mede a distância horizontal do mouse ao centro
        const dist_x = Math.abs(mouseX - center_x);
        const newWidth = dist_x * 2; // nova largura proporcional

        // Extrai o tamanho atual da fonte e largura antiga do texto
        const oldFontSize = parseFloat(obj.font);
        const oldWidth = obj.width;

        // Calcula o novo tamanho da fonte proporcionalmente à nova largura
        const newFontSize = Math.max(10, (newWidth / oldWidth) * oldFontSize);

        // Atualiza o estilo da fonte
        obj.font = `${newFontSize}px Arial`;

        // Recalcula as novas dimensões do texto com base na nova fonte
        ctx.font = obj.font;
        const textMetrics = ctx.measureText(obj.content);
        obj.width = textMetrics.width;
        obj.height = newFontSize;

        // Reposiciona o texto para continuar centralizado
        obj.x = center_x - obj.width / 2;
        obj.y = center_y - obj.height / 2;
    }
}
        function updateCursor(mouseX, mouseY) {
            let cursor = 'default';
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                if(selectedObject.isVisible) {
                    const allHandles = getHandlePositions(selectedObject);
                    const localMouseX = mouseX - (selectedObject.x + selectedObject.width / 2);
                    const localMouseY = mouseY - (selectedObject.y + selectedObject.height / 2);
                    const angle = -selectedObject.rotation;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    const rotatedMouseX = localMouseX * cos - localMouseY * sin;
                    const rotatedMouseY = localMouseX * sin + localMouseY * cos;
                    const halfHandle = handleSize / 2;
                    const rotHandle = allHandles.rotation;
                    const dxRot = rotatedMouseX - rotHandle.x;
                    const dyRot = rotatedMouseY - rotHandle.y;
                    if (Math.sqrt(dxRot * dxRot + dyRot * dyRot) <= handleSize / 1.5) {
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
        
        fileInput.addEventListener('change', (event) => {
            for (const file of event.target.files) {
                if (!file.type.startsWith('image/')) continue;
                const userImage = new Image();
                const imageURL = URL.createObjectURL(file);
                userImage.onload = () => {
                    const newImageObject = {
                        img: userImage, name: file.name, id: objectCounter,
                        displayName: `Camada ${objectCounter}`,
                        x: 0, y: 0, width: 0, height: 0,
                        isVisible: true,
                        rotation: 0
                    };
                    objectCounter++;
                    const canvasAspectRatio = canvas.width / canvas.height;
                    const imageAspectRatio = userImage.width / userImage.height;
                    if (imageAspectRatio > canvasAspectRatio) { newImageObject.width = canvas.width * 0.5; newImageObject.height = (canvas.width * 0.5) / imageAspectRatio; } else { newImageObject.height = canvas.height * 0.5; newImageObject.width = (canvas.height * 0.5) * imageAspectRatio; }
                    newImageObject.x = (canvas.width - newImageObject.width) / 2;
                    newImageObject.y = (canvas.height - newImageObject.height) / 2;
                    sceneObjects.push(newImageObject);
                    selectedIndex = sceneObjects.length - 1;
                    redrawCanvas();
                    renderLayerPanel();
                    URL.revokeObjectURL(imageURL);
                };
                userImage.src = imageURL;
            }
            fileInput.value = '';
        });

        redrawCanvas();
        renderLayerPanel();
    } catch (error) { console.error('Ocorreu um erro na aplicação:', error); }
}
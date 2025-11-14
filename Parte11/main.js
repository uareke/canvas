import CanvasManager from './canvasmanager.js';

function main() {
    try {
        const canvasManager = new CanvasManager('meu-canvas');
        const canvas = canvasManager.canvas;
        const loadButton = document.getElementById('btnCarregarImagem');
        const fileInput = document.getElementById('seletorDeArquivo');
        const layerList = document.getElementById('layer-list');
        //NOVO BUTTON
        const saveButton = document.getElementById('btnSalvarImagem');

        loadButton.addEventListener('click', () => fileInput.click());

        // NOVO: Conecta o clique do botão de salvar à nossa nova função
        saveButton.addEventListener('click', saveCanvasAsImage);

        let sceneObjects = [];
        let selectedIndex = -1;

        let interactionState = {
            isResizing: false,
            isDragging: false,
            activeHandle: null,
            lastMouseX: 0,
            lastMouseY: 0
        };

        const handleSize = 8;

        //*****************************************************************************************
        // FUNCTIONS 
        // 

        // --- NOVA FUNÇÃO: LÓGICA PARA SALVAR O CANVAS ---
        function saveCanvasAsImage() {
            // 1. Guarda o índice selecionado atualmente para restaurá-lo depois.
            const originalSelectedIndex = selectedIndex;

            // 2. Deseleciona temporariamente o objeto para "limpar" a UI (sem bordas/alças).
            selectedIndex = -1;

            // 3. Redesenha o canvas em seu estado "limpo".
            redrawCanvas();

            // 4. Gera a imagem! toDataURL() converte o canvas em uma string de imagem PNG.
            const dataURL = canvas.toDataURL('image/png');

            // 5. Restaura a seleção original para que o usuário possa continuar trabalhando.
            selectedIndex = originalSelectedIndex;

            // 6. Redesenha o canvas novamente para que a UI de seleção reapareça.
            redrawCanvas();

            // 7. O "truque" do download:
            const link = document.createElement('a'); // Cria um link temporário
            link.href = dataURL; // Define o destino do link como nossa imagem gerada
            link.download = 'composicao.png'; // Define o nome do arquivo a ser baixado

            document.body.appendChild(link); // Adiciona o link ao documento
            link.click(); // Simula um clique no link, iniciando o download
            document.body.removeChild(link); // Remove o link temporário
        }


        function moveObject(indexToMove, direction) {
            const newIndex = indexToMove + direction;

            if (newIndex < 0 || newIndex >= sceneObjects.length) {
                return;
            }

            [sceneObjects[indexToMove], sceneObjects[newIndex]] =
                [sceneObjects[newIndex], sceneObjects[indexToMove]];


            if (selectedIndex === indexToMove) {
                selectedIndex = newIndex;
            } else if (selectedIndex === newIndex) {
                selectedIndex = indexToMove;
            }

            F
            redrawCanvas();
            renderLayerPanel();
        }

        function deleteObject(indexToDelete) {
            if (indexToDelete < 0 || indexToDelete >= sceneObjects.length) return;
            sceneObjects.splice(indexToDelete, 1);
            if (selectedIndex === indexToDelete) selectedIndex = -1;
            else if (selectedIndex > indexToDelete) selectedIndex--;
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
                nameSpan.textContent = `Camada ${i}`;

                const iconsDiv = document.createElement('div');
                iconsDiv.className = 'layer-icons';

                const upArrow = document.createElement('span');
                upArrow.className = 'reorder-btn move-up-btn';
                upArrow.textContent = '↑';
                upArrow.dataset.index = i;

                const downArrow = document.createElement('span');
                downArrow.className = 'reorder-btn move-down-btn';
                downArrow.textContent = '↓';
                downArrow.dataset.index = i;

                if (i >= sceneObjects.length - 1) upArrow.classList.add('disabled');
                if (i <= 0) downArrow.classList.add('disabled');

                const visibilityToggle = document.createElement('span');
                visibilityToggle.className = 'visibility-toggle';
                visibilityToggle.dataset.index = i;
                //visibilityToggle.textContent = obj.isVisible ? '👁️' : '🙈';
                visibilityToggle.innerHTML = obj.isVisible ? '<i class="bi bi-eye-fill"></i>' : '<i class="bi bi-eye-slash-fill"></i>';

                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
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


        function redrawCanvas() {
            canvasManager.clear();
            sceneObjects.forEach(obj => {
                if (obj.isVisible) {
                    canvasManager.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
                }
            });
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                canvasManager.drawDashedRect(selectedObject.x, selectedObject.y, selectedObject.width, selectedObject.height, 'rgba(0, 0, 0, 0.7)', [4, 4]);
                drawHandles(selectedObject);
            }
            if (sceneObjects.length === 0) {
                canvasManager.drawText('Clique para carregar uma imagem.', canvasManager.width / 2 - 180, canvasManager.height / 2, '#555', '24px sans-serif');
            }
        }

        function drawHandles(obj) {
            const handles = getHandlePositions(obj);
            const halfHandle = handleSize / 2;
            for (const name in handles) {
                const pos = handles[name];
                canvasManager.drawRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'white');
                canvasManager.ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'black');
            }
        }

        function getHandlePositions(obj) {
            const { x, y, width, height } = obj;
            return {
                'top-left': { x: x, y: y },
                'top-center': { x: x + width / 2, y: y },
                'top-right': { x: x + width, y: y },
                'middle-left': { x: x, y: y + height / 2 },
                'middle-right': { x: x + width, y: y + height / 2 },
                'bottom-left': { x: x, y: y + height },
                'bottom-center': { x: x + width / 2, y: y + height },
                'bottom-right': { x: x + width, y: y + height }
            };
        }

        function resizeImage(obj, mouseX, mouseY) {
            const { activeHandle } = interactionState;
            const { x, y, width, height } = obj;
            let newX = x, newY = y, newWidth = width, newHeight = height;
            const minSize = 20;

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

            obj.x = newX;
            obj.y = newY;
            obj.width = newWidth;
            obj.height = newHeight;
        }

        function updateCursor(mouseX, mouseY) {
            if (selectedIndex === -1) {
                canvas.style.cursor = 'default';
                return;
            }

            const selectedObject = sceneObjects[selectedIndex];
            const handles = getHandlePositions(selectedObject);
            const halfHandle = handleSize / 2;
            let cursor = 'move';

            for (const name in handles) {
                const pos = handles[name];
                if (mouseX >= pos.x - halfHandle && mouseX <= pos.x + halfHandle && mouseY >= pos.y - halfHandle && mouseY <= pos.y + halfHandle) {
                    const cursors = {
                        'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize',
                        'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize',
                        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',
                        'middle-left': 'ew-resize', 'middle-right': 'ew-resize'
                    };
                    cursor = cursors[name];
                    break;
                }
            }

            if (cursor === 'move' &&
                !(mouseX >= selectedObject.x && mouseX <= selectedObject.x + selectedObject.width &&
                    mouseY >= selectedObject.y && mouseY <= selectedObject.y + selectedObject.height)) {
                cursor = 'default';
            }

            canvas.style.cursor = cursor;
        }

        //*****************************************************************************************
        // EVENTOS 
        // 

        fileInput.addEventListener('change', (event) => {
            for (const file of event.target.files) {
                if (!file.type.startsWith('image/')) continue;
                const userImage = new Image();
                const imageURL = URL.createObjectURL(file);
                userImage.onload = () => {
                    const newImageObject = { img: userImage, name: file.name, x: 0, y: 0, width: 0, height: 0, isVisible: true };
                    const canvasAspectRatio = canvas.width / canvas.height;
                    const imageAspectRatio = userImage.width / userImage.height;
                    if (imageAspectRatio > canvasAspectRatio) {
                        newImageObject.width = canvas.width * 0.5;
                        newImageObject.height = (canvas.width * 0.5) / imageAspectRatio;
                    } else {
                        newImageObject.height = canvas.height * 0.5;
                        newImageObject.width = (canvas.height * 0.5) * imageAspectRatio;
                    }
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

        canvas.addEventListener('mousedown', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            let previousSelectedIndex = selectedIndex;
            interactionState.lastMouseX = mouseX;
            interactionState.lastMouseY = mouseY;
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                const handles = getHandlePositions(selectedObject);
                const halfHandle = handleSize / 2;
                for (const name in handles) {
                    const pos = handles[name];
                    if (mouseX >= pos.x - halfHandle && mouseX <= pos.x + halfHandle && mouseY >= pos.y - halfHandle && mouseY <= pos.y + halfHandle) {
                        interactionState.isResizing = true;
                        interactionState.activeHandle = name;
                        redrawCanvas();
                        renderLayerPanel();
                        return;
                    }
                }
            }
            let clickedOnSomething = false;
            for (let i = sceneObjects.length - 1; i >= 0; i--) {
                const obj = sceneObjects[i];
                if (obj.isVisible && mouseX >= obj.x && mouseX <= obj.x + obj.width && mouseY >= obj.y && mouseY <= obj.y + obj.height) {
                    selectedIndex = i;
                    interactionState.isDragging = true;
                    clickedOnSomething = true;
                    break;
                }
            }
            if (!clickedOnSomething) selectedIndex = -1;
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
            if (interactionState.isResizing) {
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
            interactionState.activeHandle = null;
        });

        layerList.addEventListener('click', (event) => {

            const target = event.target;
            if (target.classList.contains('move-up-btn') && !target.classList.contains('disabled')) {
                const index = parseInt(target.dataset.index, 10);
                moveObject(index, +1); // +1 para mover para um índice maior (mais para frente)
                return;
            }
            if (target.classList.contains('move-down-btn') && !target.classList.contains('disabled')) {
                const index = parseInt(target.dataset.index, 10);
                moveObject(index, -1); // -1 para mover para um índice menor (mais para trás)
                return;
            }

            // Olho 👁️: alterna visibilidade da camada
            const visibilityToggle = target.closest('.visibility-toggle');
            if (visibilityToggle) {
                const index = parseInt(visibilityToggle.dataset.index, 10);
                sceneObjects[index].isVisible = !sceneObjects[index].isVisible;
                if (selectedIndex === index && !sceneObjects[index].isVisible) selectedIndex = -1;
                redrawCanvas();
                renderLayerPanel();
                return;
            }
            if (target.classList.contains('delete-btn')) {
                const index = parseInt(target.dataset.index, 10);
                deleteObject(index);
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

        window.addEventListener('keydown', (event) => {
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIndex !== -1) {
                event.preventDefault();
                deleteObject(selectedIndex);
            }
        });

        redrawCanvas();

    } catch (error) {
        console.error('Ocorreu um erro na aplicação:', error);
    }
}

main();

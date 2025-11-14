import CanvasManager from './canvasmanager.js';

function main() {
    try {
        // 🎨 Inicializa o nosso gerenciador de canvas
        const canvasManager = new CanvasManager('meu-canvas');
        const canvas = canvasManager.canvas; // Atalho pro elemento HTML canvas para eventos e cálculos

        // 📁 Elementos da interface
        const loadButton = document.getElementById('btnCarregarImagem'); // Botão para carregar imagem
        const fileInput = document.getElementById('seletorDeArquivo');   // Input escondido de arquivo
        const layerList = document.getElementById('layer-list');

        // Clique no botão abre o seletor de arquivos escondido
        loadButton.addEventListener('click', () => fileInput.click());
        //-----------------------------------------------------------------------------------------------  
        // --- 1️⃣ GERENCIAMENTO DE ESTADO ---

        let sceneObjects = []; // Array para guardar todos os nossos objetos de imagem
        let selectedIndex = -1; // Índice do objeto selecionado (-1 = nenhum)


        // Estado da interação do mouse
        let interactionState = {
            isResizing: false,
            isDragging: false,
            activeHandle: null,
            lastMouseX: 0,
            lastMouseY: 0
        };

        const handleSize = 8; // tamanho em pixels das alças de redimensionamento
        //-----------------------------------------------------------------------------------------------  
        // --- 2️⃣ FUNCOES ---

        // --- NOVA FUNÇÃO: LÓGICA CENTRAL DE EXCLUSÃO ---
        function deleteObject(indexToDelete) {
            // 🔍 Validação de segurança:
            // Garante que o índice recebido é válido (ou seja, dentro dos limites do array).
            if (indexToDelete < 0 || indexToDelete >= sceneObjects.length) {
                return; // Sai da função se o índice for inválido.
            }

            // 🗑️ Remove o objeto da lista de imagens (camadas).
            // O método splice() deleta o item do array original, alterando-o diretamente.
            sceneObjects.splice(indexToDelete, 1);

            // 🎯 Ajusta a seleção após a exclusão:
            if (selectedIndex === indexToDelete) {
                // Se a camada deletada era a que estava selecionada, limpa a seleção.
                selectedIndex = -1;
            } else if (selectedIndex > indexToDelete) {
                // Se o item removido estava antes da camada selecionada,
                // o índice do item selecionado muda (diminui 1) para manter a referência correta.
                selectedIndex--;
            }

            // 🔄 Atualiza a interface:
            // Re-renderiza o canvas e a lista de camadas para refletir a exclusão.
            redrawCanvas();
            renderLayerPanel();
        }
        // --- FIM NOVA FUNÇÃO: LÓGICA CENTRAL DE EXCLUSÃO ---



        // --- RENDERIZAR O PAINEL DE CAMADAS ---
        //REFATOR
        function renderLayerPanel() {
            layerList.innerHTML = '';
            for (let i = sceneObjects.length - 1; i >= 0; i--) {
                const obj = sceneObjects[i];
                const li = document.createElement('li');
                li.className = 'layer-item';
                li.dataset.index = i;

                // Cria um span para o nome, para não conflitar com o botão
                const nameSpan = document.createElement('span');
                nameSpan.textContent = `Camada ${i}`; // Sua modificação!

                // NOVO: Container para os ícones
                const iconsDiv = document.createElement('div');
                iconsDiv.className = 'layer-icons';

                // NOVO: Cria o ícone de visibilidade (olho)F
                const visibilityToggle = document.createElement('span');
                visibilityToggle.className = 'visibility-toggle';
                visibilityToggle.dataset.index = i;
                // ATUALIZAÇÃO: Define o ícone com base no estado 'isVisible'
                visibilityToggle.textContent = obj.isVisible ? '👁️' : '🙈';

                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.dataset.index = i;

                // ATUALIZAÇÃO: Adiciona os ícones ao container
                iconsDiv.appendChild(visibilityToggle);
                iconsDiv.appendChild(deleteBtn);

                li.appendChild(nameSpan);
                li.appendChild(deleteBtn);

                if (i === selectedIndex) {
                    li.classList.add('active');
                }

                // NOVO: Adiciona classe se a camada estiver oculta
                if (!obj.isVisible) {
                    li.classList.add('is-hidden');
                }

                layerList.appendChild(li);
            }
        }
        //FIM REFATOR

        /**
         * Redesenha todo o conteúdo do canvas.
         * Essa função é responsável por limpar o canvas, redesenhar todas as imagens,
         * exibir a seleção do objeto atual (se houver) e mostrar uma mensagem quando
         * não há nenhuma imagem carregada.
         */
        function redrawCanvas() {
            // 1️⃣ Limpa completamente o canvas antes de redesenhar
            // Isso evita que o conteúdo anterior "sobreponha" o novo desenho.
            canvasManager.clear();

            // 2️⃣ Percorre todos os objetos da cena (as imagens adicionadas)
            // e desenha cada uma delas em sua posição e tamanho atual.
            sceneObjects.forEach(obj => {
                // ATUALIZAÇÃO: Só desenha o objeto se ele estiver visível
                if (obj.isVisible) {
                    canvasManager.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
                }
            });

            // 3️⃣ Verifica se há um objeto selecionado
            if (selectedIndex !== -1) {
                const selectedObject = sceneObjects[selectedIndex];
                canvasManager.drawDashedRect(selectedObject.x, selectedObject.y, selectedObject.width, selectedObject.height, 'rgba(0, 0, 0, 0.7)', [4, 4]);
                drawHandles(selectedObject);
            }
            if (sceneObjects.length === 0) {
                canvasManager.drawText('Clique para carregar uma imagem.', canvasManager.width / 2 - 180, canvasManager.height / 2, '#555', '24px sans-serif');
            }
        }

        /**
         * Desenha as 8 alças de redimensionamento ao redor da imagem.
         */
        function drawHandles(obj) {
            const handles = getHandlePositions(obj);
            const halfHandle = handleSize / 2;
            for (const name in handles) {
                const pos = handles[name];
                canvasManager.drawRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'white');
                canvasManager.ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'black');
            }
        }

        /**
         * Calcula as posições exatas dos "handles" (alças de redimensionamento)
         * em torno de um objeto no canvas.
         * 
         * Cada handle é posicionado em um dos 8 pontos de controle:
         * - Cantos (top-left, top-right, bottom-left, bottom-right)
         * - Lados (top-center, bottom-center, middle-left, middle-right)
         * 
         * @param {Object} obj - O objeto da cena contendo posição e tamanho.
         * @returns {Object} Um dicionário com as coordenadas (x, y) de cada handle.
         */
        function getHandlePositions(obj) {
            // Desestrutura as propriedades principais do objeto
            const { x, y, width, height } = obj;

            // Retorna um mapa com as 8 posições de alças (handles)
            return {
                // Linha superior
                'top-left': { x: x, y: y },              // canto superior esquerdo
                'top-center': { x: x + width / 2, y: y },              // centro da borda superior
                'top-right': { x: x + width, y: y },              // canto superior direito

                // Linha do meio (laterais)
                'middle-left': { x: x, y: y + height / 2 }, // meio da borda esquerda
                'middle-right': { x: x + width, y: y + height / 2 }, // meio da borda direita

                // Linha inferior
                'bottom-left': { x: x, y: y + height },     // canto inferior esquerdo
                'bottom-center': { x: x + width / 2, y: y + height },     // centro da borda inferior
                'bottom-right': { x: x + width, y: y + height }      // canto inferior direito
            };
        }

        function resizeImage(obj, mouseX, mouseY) {
            // 🧠 Essa função é praticamente a mesma que usamos antes, 
            // mas agora ela trabalha de forma genérica com QUALQUER objeto da cena (obj).

            // Pega qual "alça" (handle) o usuário está arrastando.
            const { activeHandle } = interactionState;

            // Extrai as informações atuais do objeto selecionado
            const { x, y, width, height } = obj;

            // Cria variáveis temporárias para armazenar os novos valores
            let newX = x, newY = y, newWidth = width, newHeight = height;

            // Define o tamanho mínimo da imagem (ninguém quer sumir com ela, né?)
            const minSize = 20;

            // 🧩 Lógica central: dependendo da alça clicada, 
            // ajustamos posição e tamanho de forma proporcional
            switch (activeHandle) {
                case 'top-left':
                    // Redimensiona a partir do canto superior esquerdo
                    newWidth = Math.max(x + width - mouseX, minSize);
                    newHeight = Math.max(y + height - mouseY, minSize);
                    newX = x + width - newWidth;
                    newY = y + height - newHeight;
                    break;

                case 'top-center':
                    // Redimensiona apenas verticalmente, puxando o topo
                    newHeight = Math.max(y + height - mouseY, minSize);
                    newY = y + height - newHeight;
                    break;

                case 'top-right':
                    // Redimensiona canto superior direito
                    newWidth = Math.max(mouseX - x, minSize);
                    newHeight = Math.max(y + height - mouseY, minSize);
                    newY = y + height - newHeight;
                    break;

                case 'middle-left':
                    // Redimensiona apenas horizontalmente pelo lado esquerdo
                    newWidth = Math.max(x + width - mouseX, minSize);
                    newX = x + width - newWidth;
                    break;

                case 'middle-right':
                    // Redimensiona apenas horizontalmente pelo lado direito
                    newWidth = Math.max(mouseX - x, minSize);
                    break;

                case 'bottom-left':
                    // Redimensiona canto inferior esquerdo
                    newWidth = Math.max(x + width - mouseX, minSize);
                    newHeight = Math.max(mouseY - y, minSize);
                    newX = x + width - newWidth;
                    break;

                case 'bottom-center':
                    // Redimensiona apenas verticalmente pelo lado inferior
                    newHeight = Math.max(mouseY - y, minSize);
                    break;

                case 'bottom-right':
                    // Redimensiona canto inferior direito (o mais usado)
                    newWidth = Math.max(mouseX - x, minSize);
                    newHeight = Math.max(mouseY - y, minSize);
                    break;
            }

            // 🧮 Atualiza o objeto com as novas dimensões e posição calculadas
            obj.x = newX;
            obj.y = newY;
            obj.width = newWidth;
            obj.height = newHeight;
        }

        function updateCursor(mouseX, mouseY) {
            // 🧠 Essa função atualiza o cursor do mouse conforme a posição dele no canvas.
            // A ideia é dar aquele “feedback visual” ao usuário — tipo “olha, você pode redimensionar aqui!”.

            // 🔹 Se nada estiver selecionado, volta o cursor pro padrão (setinha normal)
            if (selectedIndex === -1) {
                canvas.style.cursor = 'default';
                return;
            }

            // Obtém o objeto atualmente selecionado
            const selectedObject = sceneObjects[selectedIndex];

            // Calcula as posições das alças (handles) de redimensionamento do objeto
            const handles = getHandlePositions(selectedObject);

            // Metade do tamanho da alça — usado pra calcular a área de detecção do mouse
            const halfHandle = handleSize / 2;

            // Cursor padrão: “move”, ou seja, pronto pra arrastar o objeto
            let cursor = 'move';

            // 🔍 Loop em todas as alças pra ver se o mouse está em cima de alguma
            for (const name in handles) {
                const pos = handles[name];
                if (
                    mouseX >= pos.x - halfHandle && mouseX <= pos.x + halfHandle &&
                    mouseY >= pos.y - halfHandle && mouseY <= pos.y + halfHandle
                ) {
                    // 🎨 Define o tipo de cursor dependendo da posição da alça
                    const cursors = {
                        'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize', // ↘↖
                        'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize', // ↗↙
                        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',   // ↑↓
                        'middle-left': 'ew-resize', 'middle-right': 'ew-resize',   // ←→
                    };

                    cursor = cursors[name];
                    break; // Já achamos a alça, pode sair do loop
                }
            }

            // 🧩 Caso o mouse NÃO esteja sobre a imagem nem sobre uma alça, 
            // voltamos o cursor pro normal (pra não confundir o usuário).
            if (
                cursor === 'move' &&
                !(mouseX >= selectedObject.x && mouseX <= selectedObject.x + selectedObject.width &&
                    mouseY >= selectedObject.y && mouseY <= selectedObject.y + selectedObject.height)
            ) {
                cursor = 'default';
            }

            // ✨ Por fim, aplicamos o estilo do cursor calculado
            canvas.style.cursor = cursor;
        }
        //-----------------------------------------------------------------------------------------------  
        // --- 3️⃣ EVENTOS DE INTERAÇÃO ---

        //EVENTO DE ARQUIVOS
        fileInput.addEventListener('change', (event) => {
            for (const file of event.target.files) {
                if (!file.type.startsWith('image/')) continue;
                const userImage = new Image();
                const imageURL = URL.createObjectURL(file);
                userImage.onload = () => {
                    const newImageObject = { img: userImage, name: file.name, x: 0, y: 0, width: 0, height: 0, isVisible: true };
                    const canvasAspectRatio = canvas.width / canvas.height;
                    const imageAspectRatio = userImage.width / userImage.height;
                    if (imageAspectRatio > canvasAspectRatio) { newImageObject.width = canvas.width * 0.5; newImageObject.height = (canvas.width * 0.5) / imageAspectRatio; } else { newImageObject.height = canvas.height * 0.5; newImageObject.width = (canvas.height * 0.5) * imageAspectRatio; }
                    newImageObject.x = (canvas.width - newImageObject.width) / 2; newImageObject.y = (canvas.height - newImageObject.height) / 2;
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



        //-----------------------------------------------------------------------------------------------    
        // ---  4️⃣ EVENTOS DO MOUSE ---
        // MOUSE DOWN: Inicia uma ação (arrastar ou redimensionar)
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


        // MOUSE MOVE: Executa a ação
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

        // MOUSE UP: Finaliza a ação
        canvas.addEventListener('mouseup', () => {
            interactionState.isResizing = false;
            interactionState.isDragging = false;
            interactionState.activeHandle = null;
        });

        // Adiciona um listener de evento de clique na lista de camadas
        layerList.addEventListener('click', (event) => {
            const target = event.target; // Captura o elemento exato que foi clicado

            // ============================
            // Ação 1: Clicou no botão de visibilidade (ícone de olho)
            // ============================
            if (target.classList.contains('visibility-toggle')) {
                const index = parseInt(target.dataset.index, 10); // Pega o índice da camada clicada
                sceneObjects[index].isVisible = !sceneObjects[index].isVisible; // Inverte o estado de visibilidade

                // Se o objeto oculto era o selecionado, deseleciona
                if (selectedIndex === index && !sceneObjects[index].isVisible) {
                    selectedIndex = -1;
                }

                redrawCanvas();      // Redesenha o canvas para refletir a mudança
                renderLayerPanel();  // Atualiza a lista de camadas
                return; // Sai da função para não executar as próximas ações
            }

            // ============================
            // Ação 2: Clicou no botão de deletar (lixeira)
            // ============================
            if (target.classList.contains('delete-btn')) {
                const index = parseInt(target.dataset.index, 10); // Pega o índice da camada a ser deletada
                deleteObject(index); // Remove o objeto da cena
                return; // Sai da função
            }

            // ============================
            // Ação 3: Clicou para selecionar a camada (não nos botões)
            // ============================
            const clickedItem = target.closest('.layer-item'); // Encontra o elemento .layer-item mais próximo do clique
            if (clickedItem) {
                const index = parseInt(clickedItem.dataset.index, 10); // Pega o índice da camada
                // Só permite selecionar se a camada estiver visível
                if (sceneObjects[index].isVisible) {
                    selectedIndex = index;  // Atualiza a camada selecionada
                    redrawCanvas();          // Redesenha o canvas com a camada selecionada em destaque
                    renderLayerPanel();      // Atualiza a lista de camadas para mostrar seleção
                }
            }
        });

        // --- NOVO: OUVINTE DE EVENTO DE TECLADO ---
        window.addEventListener('keydown', (event) => {
            // Verifica se a tecla Delete ou Backspace foi pressionada E se um objeto está selecionado
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIndex !== -1) {
                // Impede o navegador de realizar ações padrão (como voltar a página com Backspace)
                event.preventDefault();
                deleteObject(selectedIndex);
            }
        });
        // --- FIM NOVO: OUVINTE DE EVENTO DE TECLADO ---

        // 🔹 Desenho inicial do canvas
        redrawCanvas();

    } catch (error) {
        console.error('Ocorreu um erro na aplicação:', error);
    }
}

main();

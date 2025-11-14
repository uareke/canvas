import CanvasManager from './canvasmanager.js';

function main() {
    try {
        // 🎨 Inicializa o nosso gerenciador de canvas
        const canvasManager = new CanvasManager('meu-canvas');
        const canvas = canvasManager.canvas; // Atalho pro elemento HTML canvas para eventos e cálculos

        // 📁 Elementos da interface
        const loadButton = document.getElementById('btnCarregarImagem'); // Botão para carregar imagem
        const fileInput = document.getElementById('seletorDeArquivo');   // Input escondido de arquivo

        // --- 1️⃣ GERENCIAMENTO DE ESTADO ---
        // Este objeto guarda tudo sobre a imagem carregada: posição, tamanho e seleção
        let loadedImageState = {
            img: null,       // objeto Image
            x: 0,            // posição X no canvas
            y: 0,            // posição Y no canvas
            width: 0,        // largura da imagem
            height: 0,       // altura da imagem
            isSelected: false, // flag para saber se a imagem está selecionada

            isResizing: false, // NOVO - flag para movimentar a imagem
            isDragging: false, // NOVO - Bônus: vamos adicionar arrastar a imagem também!
            activeHandle: null, // NOVO - handle de enveto ativo no momento
            lastMouseX: 0, // NOVO - ultima posição do mouse coordenada X
            lastMouseY: 0 // NOVO - ultima posição do mouse coordenada Y
        };

        const handleSize = 8; // tamanho em pixels das alças de redimensionamento

        // --- 2️⃣ FUNÇÃO DE DESENHO PRINCIPAL ---
        /**
         * Redesenha todo o canvas com base no estado atual da imagem.
         */
        function redrawCanvas() {
            canvasManager.clear(); // limpa o canvas antes de desenhar tudo de novo

            if (loadedImageState.img) {
                const { img, x, y, width, height, isSelected } = loadedImageState;

                // 🖼️ Desenha a imagem
                canvasManager.drawImage(img, x, y, width, height);

                // ✨ Se a imagem estiver selecionada, adiciona borda tracejada e alças
                if (isSelected) {
                    // 🔹 Borda tracejada
                    canvasManager.drawDashedRect(x, y, width, height, 'rgba(0, 0, 0, 0.7)', [4, 4]);
                    debugger;
                    // 🔹 Alças (handles) de redimensionamento
                    drawHandles();
                }
            } else {
                // 💡 Mensagem inicial caso nenhuma imagem tenha sido carregada
                canvasManager.drawText(
                    'Clique no botão para carregar uma imagem.',
                    canvas.width / 2 - 200, // aproximação para centralizar horizontalmente
                    canvas.height / 2,
                    '#555',
                    '24px sans-serif'
                );
            }
        }

        /**
         * Desenha as 8 alças de redimensionamento ao redor da imagem.
         */
function drawHandles() {
    const handles = getHandlePositions();
    const halfHandle = handleSize / 2;
    for (const name in handles) {
        const pos = handles[name];
        canvasManager.drawRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'white');
        canvasManager.ctx.strokeRect(pos.x - halfHandle, pos.y - halfHandle, handleSize, handleSize, 'black');
    }
}

function getHandlePositions() {
    const { x, y, width, height } = loadedImageState;
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

        //NOVO
        function resizeImage(mouseX, mouseY) {
            const { activeHandle, x, y, width, height } = loadedImageState;
            let newX = x, newY = y, newWidth = width, newHeight = height;
            const minSize = 20; // Tamanho mínimo para a imagem

            // A lógica aqui atualiza as dimensões E a posição para que o lado oposto permaneça fixo.
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
            loadedImageState.x = newX;
            loadedImageState.y = newY;
            loadedImageState.width = newWidth;
            loadedImageState.height = newHeight;
        }

        //NOVO
        function updateCursor(mouseX, mouseY) {
            if (!loadedImageState.isSelected) {
                canvas.style.cursor = 'default';
                return;
            }

            const handles = getHandlePositions();
            const halfHandle = handleSize / 2;
            let cursor = 'move'; // Cursor padrão para arrastar a imagem

            for (const name in handles) {
                const pos = handles[name];
                if (mouseX >= pos.x - halfHandle && mouseX <= pos.x + halfHandle &&
                    mouseY >= pos.y - halfHandle && mouseY <= pos.y + halfHandle) {
                    // Mapeia o nome da alça para o estilo do cursor
                    const cursors = {
                        'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize',
                        'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize',
                        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',
                        'middle-left': 'ew-resize', 'middle-right': 'ew-resize',
                    };
                    cursor = cursors[name];
                    break;
                }
            }
            canvas.style.cursor = cursor;
        }


        // --- 3️⃣ EVENTOS DE INTERAÇÃO ---
        // Clique no botão abre o seletor de arquivos escondido
        loadButton.addEventListener('click', () => fileInput.click());

        // Quando o usuário seleciona um arquivo
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return; // 🛑 Se não escolher nada, sai fora

            const userImage = new Image();
            const imageURL = URL.createObjectURL(file); // cria uma URL temporária pro arquivo local

            userImage.onload = () => {
                // 🔄 Atualiza o estado da imagem carregada
                loadedImageState.img = userImage;
                loadedImageState.isSelected = true; // seleciona a imagem por padrão

                // 📏 Ajusta proporção da imagem para o canvas
                const canvasAspectRatio = canvas.width / canvas.height;
                const imageAspectRatio = userImage.width / userImage.height;

                if (imageAspectRatio > canvasAspectRatio) {
                    loadedImageState.width = canvas.width;
                    loadedImageState.height = canvas.width / imageAspectRatio;
                } else {
                    loadedImageState.height = canvas.height;
                    loadedImageState.width = canvas.height * imageAspectRatio;
                }

                // 🖼️ Centraliza a imagem
                loadedImageState.x = (canvas.width - loadedImageState.width) / 2;
                loadedImageState.y = (canvas.height - loadedImageState.height) / 2;

                redrawCanvas(); // 🔄 Desenha a imagem e as alças
                URL.revokeObjectURL(imageURL); // libera memória da URL temporária
            };

            // Dispara o carregamento da imagem
            userImage.src = imageURL;
        });

        // Clique no canvas para selecionar ou desmarcar a imagem
        canvas.addEventListener('click', (event) => {
            if (!loadedImageState.img) return; // 🛑 Nada acontece se não houver imagem

            // 📌 Converte coordenadas do mouse para o canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const { x, y, width, height } = loadedImageState;

            // ✅ Verifica se o clique caiu dentro da imagem
            if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                loadedImageState.isSelected = true;
            } else {
                loadedImageState.isSelected = false;
            }

            redrawCanvas(); // 🔄 Atualiza a seleção visual
        });

        //NOVO
        // ---  4. EVENTOS DO MOUSE ---
        // MOUSE DOWN: Inicia uma ação (arrastar ou redimensionar)
        canvas.addEventListener('mousedown', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (!loadedImageState.img || !loadedImageState.isSelected) return;

            loadedImageState.lastMouseX = mouseX;
            loadedImageState.lastMouseY = mouseY;

            // Verifica se clicou em uma alça
            const handles = getHandlePositions();
            const halfHandle = handleSize / 2;
            for (const name in handles) {
                const pos = handles[name];
                if (mouseX >= pos.x - halfHandle && mouseX <= pos.x + halfHandle &&
                    mouseY >= pos.y - halfHandle && mouseY <= pos.y + halfHandle) {
                    loadedImageState.isResizing = true;
                    loadedImageState.activeHandle = name;
                    redrawCanvas();
                    return; // Encontrou a alça, não precisa verificar mais nada
                }
            }

            // Se não clicou em uma alça, verifica se clicou na imagem para arrastá-la
            const { x, y, width, height } = loadedImageState;
            if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                loadedImageState.isDragging = true;
            }
        });
        //NOVO
        // MOUSE MOVE: Executa a ação
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Lógica para mudar o cursor (UX)
            updateCursor(mouseX, mouseY);

            if (loadedImageState.isResizing) {
                resizeImage(mouseX, mouseY);
            } else if (loadedImageState.isDragging) {
                const dx = mouseX - loadedImageState.lastMouseX;
                const dy = mouseY - loadedImageState.lastMouseY;
                loadedImageState.x += dx;
                loadedImageState.y += dy;
                loadedImageState.lastMouseX = mouseX;
                loadedImageState.lastMouseY = mouseY;
            }

            if (loadedImageState.isResizing || loadedImageState.isDragging) {
                redrawCanvas();
            }
        });

        //NOVO
        // MOUSE UP: Finaliza a ação
        canvas.addEventListener('mouseup', () => {
            loadedImageState.isResizing = false;
            loadedImageState.isDragging = false;
            loadedImageState.activeHandle = null;
        });


        // 🔹 Desenho inicial do canvas
        redrawCanvas();

    } catch (error) {
        console.error('Ocorreu um erro na aplicação:', error);
    }
}

main();

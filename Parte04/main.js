// 🧩 Importa nosso CanvasManager que sabe limpar, desenhar texto e imagens
import CanvasManager from './CanvasManager.js';

function main() {
    try {
        const canvas = new CanvasManager('meu-canvas'); // Instancia o canvas

        // 1️⃣ Pega referências pros elementos HTML: botão e input de arquivo
        const loadButton = document.getElementById('btnCarregarImagem');
        const fileInput = document.getElementById('seletorDeArquivo');

        // 2️⃣ Quando o botão for clicado, aciona o input de arquivo escondido
        loadButton.addEventListener('click', () => {
            fileInput.click(); // Esse truque é clássico pra esconder input feio
        });

        // 3️⃣ Quando o usuário escolhe um arquivo, dispara esse evento
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];

            // 🔍 Se não tiver arquivo, simplesmente sai
            if (!file) return;

            // 4️⃣ Cria um objeto de imagem e uma URL temporária pro arquivo local
            const userImage = new Image();
            const imageURL = URL.createObjectURL(file);

            // 5️⃣ Espera a imagem carregar antes de desenhar
            userImage.onload = () => {
                console.log('Imagem do usuário carregada com sucesso!');

                // Limpa o canvas antes de desenhar a nova imagem
                canvas.clear();

                // 📐 Calcula proporções pra centralizar e ajustar ao canvas
                const canvasAspectRatio = canvas.width / canvas.height;
                const imageAspectRatio = userImage.width / userImage.height;

                let drawWidth, drawHeight, x, y;

                if (imageAspectRatio > canvasAspectRatio) {
                    // Imagem mais "larga" que o canvas
                    drawWidth = canvas.width;
                    drawHeight = canvas.width / imageAspectRatio;
                } else {
                    // Imagem mais "alta" que o canvas
                    drawHeight = canvas.height;
                    drawWidth = canvas.height * imageAspectRatio;
                }

                // Calcula posição centralizada
                x = (canvas.width - drawWidth) / 2;
                y = (canvas.height - drawHeight) / 2;

                // 6️⃣ Desenha a imagem usando nosso CanvasManager
                canvas.drawImage(userImage, x, y, drawWidth, drawHeight);

                // 💨 Libera a memória da URL temporária
                URL.revokeObjectURL(imageURL);
            };

            // ❌ Tratamento de erro caso o arquivo não seja uma imagem válida
            userImage.onerror = () => {
                console.error("Ocorreu um erro ao carregar o arquivo de imagem selecionado.");
                alert("Não foi possível carregar o arquivo. Por favor, selecione um arquivo de imagem válido.");
            };

            // Atribui a URL ao src da imagem pra iniciar o carregamento
            userImage.src = imageURL;
        });

        // 💬 Desenha uma mensagem inicial no canvas
        canvas.drawText(
            'Clique no botão acima para carregar uma imagem.',
            canvas.width / 2 - 200, // Aproximadamente centralizado
            canvas.height / 2,
            '#555',
            '24px sans-serif'
        );

    } catch (error) {
        console.error('Ocorreu um erro na aplicação:', error);
    }
}

// 🎬 Executa a função principal
main();
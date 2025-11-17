// ImageFilters.js

/**
 * Aplica um filtro de tons de cinza (grayscale) aos dados de uma imagem.
 * @param {ImageData} imageData - O objeto ImageData obtido de um canvas.
 * @returns {ImageData} - O objeto ImageData modificado.
 */
function grayscale(imageData) {
    const data = imageData.data; // data é um array [R, G, B, A, R, G, B, A, ...]
    for (let i = 0; i < data.length; i += 4) {
        // Usamos uma média ponderada para uma conversão mais precisa (percepção humana)
        const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
        // data[i + 3] é o Alfa (transparência), não mexemos nele.
    }
    return imageData;
}

// Exportamos nossas funções de filtro para que o main.js possa usá-las.
export const ImageFilters = {
    grayscale,
    // No futuro, podemos adicionar mais filtros aqui:
    // sepia,
    // invert,
};
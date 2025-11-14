export const state = {
    sceneObjects: [],
    selectedIndex: -1,
    objectCounter: 0,
    clipboard: null,

    // --- ADIÇÕES PARA A "CÂMERA" ---
    zoom: 0.5,      // Nível de zoom (1 = 100%)
    offsetX: 0,   // Deslocamento da visão no eixo X
    offsetY: 0,   // Deslocamento da visão no eixo Y
    // ---------------------------------
    
    interaction: {
        isResizing: false,
        isDragging: false,
        isRotating: false,
        isPanning: false,
        activeHandle: null,
        lastMouseX: 0,
        lastMouseY: 0,
        lastPanX: 0,   // << NOVO: Para a "tela" (panorâmica)
        lastPanY: 0    // << NOVO: Para a "tela" (panorâmica)
    }
};
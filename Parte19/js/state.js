export const state = {
    sceneObjects: [],
    selectedIndex: -1,
    objectCounter: 0,
    clipboard: null,
    
    interaction: {
        isResizing: false,
        isDragging: false,
        isRotating: false,
        activeHandle: null,
        lastMouseX: 0,
        lastMouseY: 0
    }
};
import CanvasManager from './CanvasManager.js';
import * as UI from './ui.js';
import * as Drawing from './drawing.js';
import * as Events from './eventHandlers.js';

import * as History from './history.js'; //<-- Importe aqui
import { state } from './state.js';

// A função principal agora apenas inicializa e conecta os módulos.
function main() {
    try {
        // 1. Inicializa o módulo de desenho de baixo nível
        const canvasManager = new CanvasManager('meu-canvas');

        // 2. Obtém as referências de todos os elementos do DOM
        const elements = {
            canvas: canvasManager.canvas,
            ctx: canvasManager.getContext(),
            loadButton: document.getElementById('btnCarregarImagem'),
            addTextButton: document.getElementById('btnAdicionarTexto'),
            saveButton: document.getElementById('btnSalvarImagem'),
            fileInput: document.getElementById('seletorDeArquivo'),
            layerList: document.getElementById('layer-list'),
            propertiesPanel: document.getElementById('properties-panel'), // Renomeado
            imageFilters: document.getElementById('image-filters'),     // Novo
            shapeProperties: document.getElementById('shape-properties'), // Novo
            colorPicker: document.getElementById('color-picker'),          // Novo
            //add retangle button
            addRectangleButton: document.getElementById('btnAdicionarRetangulo'),
        };

        // 3. Inicializa os outros módulos, injetando as dependências que eles precisam
        UI.initUI(elements);
        Drawing.initDrawing(canvasManager, elements.canvas);
        Events.initEventHandlers(elements);

        // NOVO: Salva o estado inicial (a cena vazia) no histórico
        History.initHistory(state.sceneObjects);

        // 4. Renderização inicial da UI
        Drawing.redrawCanvas();
        UI.renderLayerPanel();

    } catch (error) {
        console.error('Ocorreu um erro na inicialização da aplicação:', error);
    }
}

// Inicia a aplicação quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', main);
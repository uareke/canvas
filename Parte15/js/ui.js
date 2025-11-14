import { state } from './state.js';

// Variáveis locais do módulo para guardar as referências dos elementos do DOM
let layerListEl;
let filterPanelEl;

/**
 * Inicializa o módulo de UI, recebendo os elementos que ele irá controlar.
 * @param {object} elements - Um objeto contendo as referências para os elementos do DOM.
 * @param {HTMLElement} elements.layerList - O elemento <ul> da lista de camadas.
 * @param {HTMLElement} elements.filterPanel - O elemento <div> do painel de filtros.
 */
export function initUI(elements) {
    layerListEl = elements.layerList;
    filterPanelEl = elements.filterPanel;
}

export function renderLayerPanel() {
    if (!layerListEl) return; // Proteção para caso o init não tenha sido chamado

    layerListEl.innerHTML = '';
    for (let i = state.sceneObjects.length - 1; i >= 0; i--) {
        const obj = state.sceneObjects[i];
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

        if (i >= state.sceneObjects.length - 1) upArrow.classList.add('disabled');
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

        if (i === state.selectedIndex) li.classList.add('active');
        if (!obj.isVisible) li.classList.add('is-hidden');

        layerListEl.appendChild(li);
    }
}

export function updateContextualPanels() {
    if (!filterPanelEl) return;

    if (state.selectedIndex !== -1 && state.sceneObjects[state.selectedIndex].type === 'image') {
        filterPanelEl.style.display = 'block';
    } else {
        filterPanelEl.style.display = 'none';
    }
}
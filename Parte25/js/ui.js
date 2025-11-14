import { state } from './state.js';

// Variáveis locais do módulo para guardar as referências dos elementos do DOM
let layerListEl;
let propertiesPanelEl; 
let imageFiltersEl;    
let shapePropertiesEl; 
let colorPickerEl;  
let shadowPropertiesEl;
let shadowEnabledEl, shadowColorEl, shadowBlurEl, shadowOffsetXEl, shadowOffsetYEl;   

/**
 * Inicializa o módulo de UI, recebendo os elementos que ele irá controlar.
 * @param {object} elements - Um objeto contendo as referências para os elementos do DOM.
 * @param {HTMLElement} elements.layerList - O elemento <ul> da lista de camadas.
 * @param {HTMLElement} elements.filterPanel - O elemento <div> do painel de filtros.
 */
export function initUI(elements) {
    layerListEl = elements.layerList;
    propertiesPanelEl = elements.propertiesPanel; 
    imageFiltersEl = elements.imageFilters;      
    shapePropertiesEl = elements.shapeProperties;   
    colorPickerEl = elements.colorPicker;   
    shadowPropertiesEl = elements.shadowProperties;
    shadowEnabledEl = elements.shadowEnabled;
    shadowColorEl = elements.shadowColor;
    shadowBlurEl = elements.shadowBlur;
    shadowOffsetXEl = elements.shadowOffsetX;
    shadowOffsetYEl = elements.shadowOffsetY;      
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

// Função responsável por atualizar o painel lateral de propriedades,
// exibindo apenas as opções relevantes de acordo com o tipo de objeto selecionado.
export function updateContextualPanels() {
    if (!propertiesPanelEl) return;

    const noSelection = state.selectedIndex === -1;
    if (noSelection) {
        propertiesPanelEl.style.display = 'none';
        return;
    }

    propertiesPanelEl.style.display = 'block';
    const selectedObject = state.sceneObjects[state.selectedIndex];

    // Controla a visibilidade das seções
    imageFiltersEl.style.display = selectedObject.type === 'image' ? 'block' : 'none';
    shapePropertiesEl.style.display = (selectedObject.type === 'text' || selectedObject.type === 'rectangle') ? 'block' : 'none';
    shadowPropertiesEl.style.display = 'block'; // Mostra para todos os tipos de objeto

    // Sincroniza os valores dos controles com o estado do objeto selecionado
    if (selectedObject.type === 'text' || selectedObject.type === 'rectangle') {
        colorPickerEl.value = selectedObject.color;
    }

    if (selectedObject.shadow) {
        shadowEnabledEl.checked = selectedObject.shadow.enabled;
        shadowColorEl.value = selectedObject.shadow.color;
        shadowBlurEl.value = selectedObject.shadow.blur;
        shadowOffsetXEl.value = selectedObject.shadow.offsetX;
        shadowOffsetYEl.value = selectedObject.shadow.offsetY;
    }
}
// export function updateContextualPanels() {
//     // Se o painel de propriedades não existir, a função é encerrada.
//     if (!propertiesPanelEl) return;

//     // Verifica se há algum objeto selecionado.
//     const noSelection = state.selectedIndex === -1;
//     if (noSelection) {
//         // Nenhum objeto selecionado → esconde completamente o painel.
//         propertiesPanelEl.style.display = 'none';
//         return;
//     }

//     // Caso haja seleção, exibe o painel.
//     propertiesPanelEl.style.display = 'block';

//     // Recupera o objeto atualmente selecionado no estado global.
//     const selectedObject = state.sceneObjects[state.selectedIndex];

//     // Define o comportamento com base no tipo do objeto selecionado.
//     switch (selectedObject.type) {

//         // 🖼️ Caso o objeto seja uma imagem:
//         case 'image':
//             // Mostra o painel de filtros.
//             imageFiltersEl.style.display = 'block';
//             // Oculta o painel de propriedades de forma.
//             shapePropertiesEl.style.display = 'none';
//             break;

//         // 🔤 Caso o objeto seja texto OU 🔲 retângulo:
//         case 'text':
//         case 'rectangle':
//             // Oculta o painel de filtros.
//             imageFiltersEl.style.display = 'none';
//             // Mostra o painel de propriedades (ex: seletor de cor).
//             shapePropertiesEl.style.display = 'block';
//             // Atualiza o color picker com a cor atual do objeto selecionado.
//             colorPickerEl.value = selectedObject.color;
//             break;

//         // Caso o tipo do objeto não seja reconhecido:
//         default:
//             // Esconde completamente o painel de propriedades.
//             propertiesPanelEl.style.display = 'none';
//     }
// }
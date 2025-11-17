// 🕰️ history.js
// Este módulo é o cérebro da nossa "Máquina do Tempo"! 🧠✨
// Ele controla todo o histórico de ações (Undo/Redo) da aplicação — tipo um "salvar automático" do passado!

let history = [];        // 📸 Aqui ficam armazenadas todas as "fotos" do nosso estado (snapshots).
let historyIndex = -1;   // 📍 Este é o ponteiro do tempo — indica em qual ponto da história estamos.

/**
 * 🚀 Inicializa o histórico com o estado inicial da aplicação.
 * @param {Array} initialState - O primeiro estado dos sceneObjects (nossa cena inicial 🎬).
 */
export function initHistory(initialState) {
    history = [deepClone(initialState)]; // Tiramos a primeira foto da cena.
    historyIndex = 0; // Marcamos o ponto de partida no tempo 🕐.
}

/**
 * 💾 Salva um novo estado no histórico — cada ação do usuário gera uma nova "foto".
 * @param {Array} currentState - O estado atual de sceneObjects a ser salvo.
 */
export function saveState(currentState) {
    // 🔮 Se o usuário usou "Undo" e agora faz uma nova ação,
    // o "futuro alternativo" é apagado (nada de realidades paralelas aqui! 🌀).
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }

    history.push(deepClone(currentState)); // 📷 Tiramos uma nova foto e guardamos no álbum do tempo.
    historyIndex++; // Avançamos o marcador do tempo ⏩.
}

/**
 * ⏪ Desfaz a última ação — volta uma "foto" no tempo.
 * @returns {Array|null} - O estado anterior ou null se já estivermos no início da linha do tempo.
 */
export function undo() {
    if (historyIndex > 0) {
        historyIndex--; // Voltamos uma casa no tempo ⏳.
        return deepClone(history[historyIndex]); // Devolvemos a cena do passado!
    }
    return null; // 🚫 Já estamos no início do tempo — não dá pra voltar mais!
}

/**
 * ⏩ Refaz uma ação — avança uma "foto" no tempo.
 * @returns {Array|null} - O estado refeito ou null se já estivermos no final.
 */
export function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++; // Avançamos para o futuro 🚀.
        return deepClone(history[historyIndex]); // E restauramos aquele estado.
    }
    return null; // 🚫 Sem futuro à frente — fim da linha do tempo!
}

/**
 * 🧬 Cria um clone profundo do objeto/array.
 * Ideal para "fotografar" nosso estado sem vínculos com o original.
 * @param {object|Array} obj - O objeto/array a ser clonado.
 */
function deepClone(obj) {
    // ⚠️ Essa técnica transforma o objeto em JSON e depois reconstrói.
    // Não serve pra funções ou datas, mas é perfeita pros nossos dados simples 🎯.
    return JSON.parse(JSON.stringify(obj));
}
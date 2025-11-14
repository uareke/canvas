# 🎨 Canvas Editor – Ferramenta Avançada de Edição Gráfica

Um editor de canvas moderno, fluido e altamente responsivo, desenvolvido para manipulação precisa de objetos, textos e imagens diretamente no navegador.  
Ideal para aplicações que exigem controles gráficos intuitivos, como designers online, ferramentas de diagramação, simuladores e editores educacionais.

---

# 🏷️ Badges

![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tech-Stack](https://img.shields.io/badge/tech-JS%20%7C%20Canvas%20%7C%20HTML5-orange)

---

# 🖼️ Imagens e GIFs do Projeto

> ⚠️ *Substitua os links abaixo pelas imagens reais quando você tiver os arquivos.*

### 🧩 Interface Principal  

### ✋ Movimentação e Manipulação  

### 🔄 Rotação  

### 🧭 Guias e Réguas  

### 💾 Salvando Projeto  

### 🎞️ GIF – Demonstração Geral  

---

# 🚀 Status Atual do Projeto

A primeira etapa foi finalizada com todas as funcionalidades essenciais da edição gráfica concluídas.

---

# ✅ Funcionalidades Implementadas

### 🔧 **Manipulação de Objetos**
- Redimensionar objetos  
- Movimentar objetos  
- Rotacionar  
- Zoom no objeto e no canvas  
- Pan na área de trabalho  

### 📏 **Guias e Precisão**
- Réguas superior e lateral  
- Linhas-guia personalizadas  
- Snap inteligente para alinhamento preciso  
- Ajustes visuais e interativos suaves

### 🗂️ **Camadas e Visibilidade**
- Ocultar/mostrar objetos  
- Reordenar objetos entre camadas (z-index)  

### ✏️ **Texto**
- Adicionar texto  
- Editar propriedades do texto  
  - Fonte  
  - Cor  
  - Tamanho  
  - Peso  
  - Alinhamento  

### 🖼️ **Imagens**
- Carregar imagens  
- Manipular imagens no canvas  

### 💾 **Persistência**
- Salvar projeto  
- Carregar projeto salvo  
- Serialização inteligente dos elementos  

### ✨ **Refinamentos**
- Maior suavidade nas interações  
- Precisão aumentada na manipulação  
- Correções de colisão e cálculo angular  
- Melhor experiência de zoom e pan  

---

# ⚙️ Arquitetura Técnica (Detalhada)

### 🧠 Core
- Estrutura baseada em **objetos gráficos independentes**
- Cada elemento possui:
  - Representação visual
  - Caixa de seleção (bounding box)
  - Handles de controle (resize, rotate)
  - Estado e metadados

### 🖼️ Renderização
- Utiliza **HTML5 Canvas** com atualização a cada interação  
- Sistema próprio de:
  - *Redraw inteligente*
  - *Invalidation regions*
  - *Hit-test avançado* para deteção de cliques

### ✋ Sistema de Interação
Construído do zero com:
- Drag & Drop
- Escalonamento proporcional ou livre
- Rotação com cálculo angular em relação ao centro
- Snap para guias
- Movimentação suave com desaceleração

### 🧩 Modularidade
Estrutura pensada para expansão:
- Camada de objetos
- Camada de ferramentas
- Camada de interação
- Camada de renderização

### 🛠️ Tecnologias
- JavaScript 
- HTML5 Canvas
- JSON para persistência


---

# 🤝 Contribuição

Sinta-se à vontade para sugerir melhorias.  
Pull Requests, Issues e novas ideias são sempre bem-vindas.

---

# 📜 Licença

Este projeto está sob a licença **MIT**.

---

# 📬 Contato

A segunda etapa já está em desenvolvimento.  
Nos vemos lá! 🚀


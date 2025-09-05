const fileElements = document.querySelectorAll(".draggable-file");
const mainContainer = document.querySelector("main");
const cursorX = document.getElementById("cursor-x");
const cursorY = document.getElementById("cursor-y");
let imageCanvasContext = null;

// Atualiza a posição das linhas do cursor
mainContainer.addEventListener("mousemove", (e) => {
  cursorX.style.top = `${e.clientY}px`;
  cursorY.style.left = `${e.clientX}px`;
});

// Posiciona os elementos aleatoriamente na tela ao carregar a página
fileElements.forEach((item) => {
  const containerRect = mainContainer.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  // Adiciona um padding para evitar que os elementos fiquem colados nas bordas
  const padding = 60;

  const maxTop = containerRect.height - itemRect.height - padding;
  const maxLeft = containerRect.width - itemRect.width - padding;

  // Gera posições aleatórias dentro dos limites
  const randomTop = Math.max(padding, Math.random() * maxTop);
  const randomLeft = Math.max(padding, Math.random() * maxLeft);

  item.style.top = `${randomTop}px`;
  item.style.left = `${randomLeft}px`;
  item.style.zIndex = 1; // Garante que todos os arquivos comecem acima do fundo (z-0)
});

let activeItem = null;
let offsetX = 0;
let offsetY = 0;
let highestZ = 1; // Começa em 1, então o primeiro item arrastado terá z-index 2

const dragStart = (e) => {
  // Se o elemento clicado for um link (<a>), não inicie o arraste.
  if (e.target.closest("a")) {
    return;
  }

  activeItem = e.currentTarget;
  if (e.preventDefault) e.preventDefault();

  highestZ++;
  activeItem.style.zIndex = highestZ;
  activeItem.classList.add("dragging");

  const rect = activeItem.getBoundingClientRect();

  if (e.type === "touchstart") {
    offsetX = e.touches[0].clientX - rect.left;
    offsetY = e.touches[0].clientY - rect.top;
  } else {
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);
  document.addEventListener("touchmove", drag, { passive: false });
  document.addEventListener("touchend", dragEnd);
};

const drag = (e) => {
  if (!activeItem) return;
  if (e.cancelable) e.preventDefault();

  let x, y;
  if (e.type === "touchmove") {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  activeItem.style.left = `${x - offsetX}px`;
  activeItem.style.top = `${y - offsetY}px`;
};

const dragEnd = () => {
  if (!activeItem) return;
  activeItem.classList.remove("dragging");
  activeItem = null;

  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", dragEnd);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", dragEnd);
};

fileElements.forEach((item) => {
  item.addEventListener("mousedown", dragStart);
  item.addEventListener("touchstart", dragStart, { passive: false });
});

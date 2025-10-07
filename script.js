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

const slides = document.querySelectorAll(".sketch-slide");
const prevButton = document.getElementById("prev-sketch");
const nextButton = document.getElementById("next-sketch");
const slideCounter = document.getElementById("slide-counter");

if (slides.length > 0) {
  let currentSlide = 0;
  const totalSlides = slides.length;

  const showSlide = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.toggle("hidden", i !== index);
    });
    if (slideCounter) {
      slideCounter.textContent = `${index + 1} / ${totalSlides}`;
    }
    currentSlide = index;
  };

  nextButton.addEventListener("click", () => {
    const nextIndex = (currentSlide + 1) % totalSlides;
    showSlide(nextIndex);
  });

  prevButton.addEventListener("click", () => {
    const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(prevIndex);
  });

  showSlide(0); // Initialize
}

// --- Efeito de Digitação ---
const typingTextElement = document.getElementById("typing-text");
const sentences = [
  "Matheus Araripe",
  "Teteu",
  "Designer gráfico",
  "Desenvolvedor front-end",
  "Mago do truco",
];

// const sentences = [
//   "Designer gráfico e Desenvolvedor front-end",
//   "Sou apaixonado por criar soluções funcionais e bonitas.",
//   "Gosto de misturar lógica, matemática e design para dar vida a projetos criativos que unem tecnologia e arte.",
// ];

let sentenceIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 150;
const deletingSpeed = 100;
const delayBetweenSentences = 2000;

function type() {
  const currentSentence = sentences[sentenceIndex];
  let displayText = "";

  if (isDeleting) {
    // Deletando o texto
    displayText = currentSentence.substring(0, charIndex - 1);
    charIndex--;
  } else {
    // Digitando o texto
    displayText = currentSentence.substring(0, charIndex + 1);
    charIndex++;
  }

  typingTextElement.textContent = displayText;
  let delay = isDeleting ? deletingSpeed : typingSpeed;

  if (!isDeleting && charIndex === currentSentence.length) {
    // Pausa quando a frase termina de ser digitada
    delay = delayBetweenSentences;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    // Passa para a próxima frase quando termina de apagar
    isDeleting = false;
    sentenceIndex = (sentenceIndex + 1) % sentences.length;
    delay = 500; // Pausa antes de começar a digitar a nova frase
  }

  setTimeout(type, delay);
}

// Inicia o efeito quando o conteúdo da página estiver carregado
document.addEventListener("DOMContentLoaded", function () {
  if (typingTextElement) {
    setTimeout(type, 1500); // Inicia a animação após 1.5s
  }
});

// --- Modo Escuro ---
const themeToggle = document.getElementById("theme-toggle");
const lightIcon = document.getElementById("theme-icon-light");
const darkIcon = document.getElementById("theme-icon-dark");
const themeImage = document.getElementById("theme-image");
const body = document.body;

const lightGrid = "radial-gradient(circle, #CBD5E1 1px, transparent 1px)";
const darkGrid = "radial-gradient(circle, #47694738 1px, transparent 1px)";

const lightImageSrc = "./assets/demos/tt_heatmap.jpg";
const darkImageSrc = "./assets/demos/tt_heatmap2_neg.jpg";

const applyTheme = (theme) => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    darkIcon.classList.add("hidden");
    lightIcon.classList.remove("hidden");
    body.style.backgroundColor = "#000000ff";
    body.style.backgroundImage = darkGrid;
    if (themeImage) themeImage.src = darkImageSrc;
  } else {
    document.documentElement.classList.remove("dark");
    lightIcon.classList.add("hidden");
    darkIcon.classList.remove("hidden");
    body.style.backgroundColor = "#F5F5F5";
    body.style.backgroundImage = lightGrid;
    if (themeImage) themeImage.src = lightImageSrc;
  }
};

themeToggle.addEventListener("click", () => {
  const currentTheme =
    localStorage.getItem("theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme(currentTheme);
});

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

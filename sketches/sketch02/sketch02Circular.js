import canvasSketch from "canvas-sketch";
import random from "canvas-sketch-util/random";
import math from "canvas-sketch-util/math";
import { Pane } from "tweakpane";

const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

const params = {
  cols: 30,
  rows: 30,
  scaleMin: 1,
  scaleMax: 30,
  frequency: 0.001,
};

const dist = (x1, y1, x2, y2) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

const crtCyan = { r: 21, g: 200, b: 197 }; // Cor base rgb(21 200 197)
const hotYellow = { r: 255, g: 255, b: 0 };
const strongRed = { r: 255, g: 40, b: 0 };

const sketch = ({ canvas, width, height }) => {
  // --- CANVAS DE RASTRO ---
  // Criar um canvas extra, fora da tela, para desenhar o rastro
  const trailCanvas = document.createElement("canvas");
  trailCanvas.width = width;
  trailCanvas.height = height;
  const trailContext = trailCanvas.getContext("2d");

  const mouse = { x: -9999, y: -9999 };
  // --- COORDENADAS ---
  canvas.addEventListener("mousemove", (event) => {
    // Pega o tamanho real do elemento na tela
    const bounds = canvas.getBoundingClientRect();

    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;

    mouse.x = event.offsetX * scaleX;
    mouse.y = event.offsetY * scaleY;
  });

  // --- EVENTO MOUSELEAVE ---
  canvas.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // --- ONDA DE CHOQUE ---
  const waves = [];

  // Parâmetros da onda
  const waveSpeed = 800; // Velocidade de propagação da onda em pixels/segundo
  const waveStrength = 20; // Força máxima do deslocamento
  const waveWidth = 20; // Largura da "crista" da onda

  canvas.addEventListener("click", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;

    const clickX = event.offsetX * scaleX;
    const clickY = event.offsetY * scaleY;

    // Adiciona uma nova onda à lista com sua posição e tempo de início
    waves.push({ x: clickX, y: clickY, startTime: Date.now() });
  });

  return ({ context, frame, time }) => {
    context.fillStyle = "#011015";
    context.fillRect(0, 0, width, height);

    const cols = params.cols;
    const rows = params.rows;
    const numCels = cols * rows;

    const gridW = width * 0.9;
    const gridH = height * 0.9;
    const cellW = gridW / cols;
    const cellH = gridH / rows;
    const cellMargx = (width - gridW) / 2;
    const cellMargh = (height - gridH) / 2;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.4;

    const mouseRadius = 70;
    const maxRepelForce = 40;
    // Parâmetro para a força da turbulência
    const turbulenceForce = 200;

    // --- ATUALIZAÇÃO DO RASTRO ---
    trailContext.fillStyle = "rgba(0, 0, 0, 0.1)";
    trailContext.fillRect(0, 0, width, height);

    if (mouse.x > 0 && mouse.y > 0) {
      const brushRadius = 150;
      const gradient = trailContext.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        brushRadius
      );
      gradient.addColorStop(0, "rgba(255, 255, 200, 0.8)");
      gradient.addColorStop(0.25, "rgba(255, 200, 0, 0.6)");
      gradient.addColorStop(0.6, "rgba(255, 100, 0, 0.3)");
      gradient.addColorStop(1, "rgba(255, 40, 0, 0)");

      trailContext.fillStyle = gradient;
      trailContext.fillRect(0, 0, width, height);
    }

    const trailImageData = trailContext.getImageData(0, 0, width, height).data;

    // --- RENDERIZAÇÃO PRINCIPAL (no canvas visível) ---
    context.fillStyle = "#020f14";
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < numCels; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = cellMargx + col * cellW;
      const y = cellMargh + row * cellH;

      const cellCenterX = x + cellW * 0.5;
      const cellCenterY = y + cellH * 0.5;

      const distance = dist(cellCenterX, cellCenterY, centerX, centerY);

      let finalX = cellCenterX;
      let finalY = cellCenterY;

      const distToMouse = dist(cellCenterX, cellCenterY, mouse.x, mouse.y);

      if (distToMouse < mouseRadius) {
        const vecX = cellCenterX - mouse.x;
        const vecY = cellCenterY - mouse.y;
        const repelForce = math.mapRange(
          distToMouse,
          0,
          mouseRadius,
          maxRepelForce,
          0
        );
        const pushX = (vecX / distToMouse) * repelForce;
        const pushY = (vecY / distToMouse) * repelForce;

        // Força de Turbulência com Noise
        // Calcular um ângulo de ruído baseado na posição da bolinha e no tempo
        const noiseAngle =
          random.noise3D(x * 0.01, y * 0.01, time * 0.3) * Math.PI * 2;
        // Criar um vetor de turbulência a partir do ângulo
        const turbulenceX = Math.cos(noiseAngle);
        const turbulenceY = Math.sin(noiseAngle);
        // A força da turbulência também diminui com a distância
        const turbulenceStrength = math.mapRange(
          distToMouse,
          0,
          mouseRadius,
          turbulenceForce,
          0
        );

        finalX += pushX + turbulenceX * turbulenceStrength;
        finalY += pushY + turbulenceY * turbulenceStrength;
      }
      if (distance > radius) {
        continue;
      }

      // --- EFEITO DA ONDA DE CHOQUE ---
      // Para cada onda ativa, calculamos seu efeito na bolinha
      waves.forEach((wave) => {
        const timeSinceClick = (Date.now() - wave.startTime) / 1000; // Tempo em segundos
        const waveFront = timeSinceClick * waveSpeed; // Posição atual da crista da onda

        const distToWaveCenter = dist(cellCenterX, cellCenterY, wave.x, wave.y);

        // Verifica se a bolinha está na área da crista da onda
        if (
          distToWaveCenter > waveFront - waveWidth / 2 &&
          distToWaveCenter < waveFront + waveWidth / 2
        ) {
          const vecX = cellCenterX - wave.x;
          const vecY = cellCenterY - wave.y;

          // A força da onda diminui com a distância
          const forceFade = math.mapRange(distToWaveCenter, 0, width, 1, 0);

          const pushX = (vecX / distToWaveCenter) * waveStrength * forceFade;
          const pushY = (vecY / distToWaveCenter) * waveStrength * forceFade;

          finalX += pushX;
          finalY += pushY;
        }
      });

      const n = random.noise3D(x, y, frame * 10, params.frequency);
      const scale = math.mapRange(n, -1, 1, params.scaleMin, params.scaleMax);

      const fade = math.mapRange(distance, 0, radius, 1, 0, true);
      const finalScale = scale * fade;

      // --- LÓGICA DE COR BASEADA NO RASTRO ---
      const ix = Math.floor(finalX);
      const iy = Math.floor(finalY);

      // Garante que não vai tentar ler pixels fora da tela
      if (ix < 0 || ix >= width || iy < 0 || iy >= height) continue;

      const pixelIndex = (iy * width + ix) * 4;
      const r = trailImageData[pixelIndex];
      const g = trailImageData[pixelIndex + 1];
      const trailIntensity = (r + g) / 510;

      // --- ALTERADO: LÓGICA DE INTERPOLAÇÃO MULTI-ETAPA ---
      let finalR, finalG, finalB;

      if (trailIntensity < 0.5) {
        // Se a intensidade é baixa (0 a 0.5), interpola de Ciano para Amarelo
        const factor = math.mapRange(trailIntensity, 0, 0.5, 0, 1, true);
        finalR = math.mapRange(factor, 0, 1, crtCyan.r, hotYellow.r);
        finalG = math.mapRange(factor, 0, 1, crtCyan.g, hotYellow.g);
        finalB = math.mapRange(factor, 0, 1, crtCyan.b, hotYellow.b);
      } else {
        // Se a intensidade é alta (0.5 a 1), interpola de Amarelo para Vermelho
        const factor = math.mapRange(trailIntensity, 0.5, 1, 0, 1, true);
        finalR = math.mapRange(factor, 0, 1, hotYellow.r, strongRed.r);
        finalG = math.mapRange(factor, 0, 1, hotYellow.g, strongRed.g);
        finalB = math.mapRange(factor, 0, 1, hotYellow.b, strongRed.b);
      }

      const finalColor = `rgb(${Math.floor(finalR)}, ${Math.floor(
        finalG
      )}, ${Math.floor(finalB)})`;

      if (finalScale > 0) {
        context.save();
        context.translate(finalX, finalY);

        context.fillStyle = finalColor;
        context.shadowColor = finalColor;
        context.shadowBlur = 10;

        context.beginPath();
        context.arc(0, 0, finalScale, 0, Math.PI * 2);
        context.fill();

        context.restore();
      }
    }
    // Opcional: Limpa ondas antigas para não sobrecarregar a memória
    if (waves.length > 5) {
      waves.shift();
    }
  };
};

const createPane = () => {
  const pane = new Pane();

  let folder;
  folder = pane.addFolder({ title: "Grid" });
  folder.addInput(params, "cols", { min: 1, max: 60, step: 1 });
  folder.addInput(params, "rows", { min: 1, max: 60, step: 1 });
  folder.addInput(params, "scaleMin", { min: 1, max: 100 });
  folder.addInput(params, "scaleMax", { min: 1, max: 100 });

  folder = pane.addFolder({ title: "Noise" });
  folder.addInput(params, "frequency", { min: -0.001, max: 0.01 });
};
createPane();

canvasSketch(sketch, settings);

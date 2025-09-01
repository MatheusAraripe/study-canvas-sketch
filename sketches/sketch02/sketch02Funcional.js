import canvasSketch from "canvas-sketch";
import { Pane } from "tweakpane";
import {
  setupEventListeners,
  updateTrailCanvas,
  drawParticle,
} from "./utils/utils";

// --- CONFIGURAÇÕES GLOBAIS ---
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

const palette = {
  crtCyan: { r: 21, g: 200, b: 197 },
  hotYellow: { r: 255, g: 255, b: 0 },
  strongRed: { r: 255, g: 40, b: 0 },
};

// --- FUNÇÃO PRINCIPAL DO SKETCH ---

const sketch = ({ canvas, width, height }) => {
  // Setup inicial
  const trailCanvas = document.createElement("canvas");
  trailCanvas.width = width;
  trailCanvas.height = height;
  const trailContext = trailCanvas.getContext("2d");

  const mouse = { x: -9999, y: -9999 };
  const waves = [];
  setupEventListeners(canvas, width, height, mouse, waves);

  // Loop de renderização (retornado pelo sketch)
  return ({ context, frame, time }) => {
    // 1. Atualiza o canvas de rastro
    updateTrailCanvas({ trailContext, mouse, waves, width, height });
    const trailImageData = trailContext.getImageData(0, 0, width, height).data;

    // 2. Prepara o canvas principal
    context.fillStyle = "#011015";
    context.fillRect(0, 0, width, height);

    // 3. Desenha a grade de partículas
    const cols = params.cols;
    const rows = params.rows;
    const gridW = width * 0.9;
    const gridH = height * 0.9;
    const cellW = gridW / cols;
    const cellH = gridH / rows;
    const cellMargx = (width - gridW) / 2;
    const cellMargh = (height - gridH) / 2;

    for (let i = 0; i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const particle = {
        x: cellMargx + col * cellW,
        y: cellMargh + row * cellH,
        centerX: cellMargx + col * cellW + cellW * 0.5,
        centerY: cellMargh + row * cellH + cellH * 0.5,
      };

      drawParticle(particle, params, palette, {
        context,
        width,
        height,
        time,
        frame,
        mouse,
        waves,
        trailImageData,
      });
    }

    // Limpa ondas antigas
    if (waves.length > 5) waves.shift();
  };
};

// --- INICIALIZAÇÃO ---
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

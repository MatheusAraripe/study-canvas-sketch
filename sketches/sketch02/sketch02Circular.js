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

// Função auxiliar para calcular a distância entre dois pontos (x1, y1) e (x2, y2)
const dist = (x1, y1, x2, y2) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

const sketch = ({ canvas, width, height }) => {
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
    // Reseta a posição do mouse para um lugar distante quando ele sai da tela
    mouse.x = -9999;
    mouse.y = -9999;
  });

  return ({ context, frame }) => {
    context.fillStyle = "#011015";
    context.fillRect(0, 0, width, height);

    context.shadowColor = "#00eaff";
    context.shadowBlur = 10;

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

    const mouseRadius = 50;
    const maxRepelForce = 40;

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

        finalX += pushX;
        finalY += pushY;
      }

      if (distance > radius) {
        continue;
      }

      const n = random.noise3D(x, y, frame * 10, params.frequency);
      const scale = math.mapRange(n, -1, 1, params.scaleMin, params.scaleMax);

      const fade = math.mapRange(distance, 0, radius, 1, 0, true);
      const finalScale = scale * fade;

      if (finalScale > 0) {
        context.save();
        context.translate(finalX, finalY);

        context.fillStyle = "#15C8C5";
        context.beginPath();
        context.arc(0, 0, finalScale, 0, Math.PI * 2);
        context.fill();

        context.restore();
      }
    }
  };
};

const createPane = () => {
  const pane = new Pane();

  let folder;
  folder = pane.addFolder({ title: "Grid" });
  folder.addInput(params, "cols", { min: 1, max: 50, step: 1 });
  folder.addInput(params, "rows", { min: 1, max: 50, step: 1 });
  folder.addInput(params, "scaleMin", { min: 1, max: 100 });
  folder.addInput(params, "scaleMax", { min: 1, max: 100 });

  folder = pane.addFolder({ title: "Noise" });
  folder.addInput(params, "frequency", { min: -0.001, max: 0.01 });
};
createPane();

canvasSketch(sketch, settings);

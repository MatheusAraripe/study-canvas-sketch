import canvasSketch from "canvas-sketch";
import random from "canvas-sketch-util/random";
import math from "canvas-sketch-util/math";
import { Pane } from "tweakpane";

const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

const params = {
  cols: 50,
  rows: 50,
  scaleMin: 1,
  scaleMax: 30,
  frequency: 0.001,
  amplitude: 0.2,
};

const sketch = () => {
  return ({ context, width, height, frame }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const cols = params.cols;
    const rows = params.rows;

    const numCels = cols * rows;

    const gridW = width * 0.8;
    const gridH = height * 0.8;
    const cellW = gridW / cols;
    const cellH = gridH / rows;
    const cellMargx = ((width - gridW) * 1) / 2;
    const cellMargh = ((height - gridH) * 1) / 2;

    for (let i = 0; i < numCels; i++) {
      // usando módulo para calcular o grid
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = col * cellW;
      const y = row * cellH;
      const w = cellW * 0.8;
      const h = cellH * 0.8;

      // const n = random.noise2D(x + frame * 10, y, params.frequency);
      const n = random.noise3D(x, y, frame * 10, params.frequency);

      const angle = n * Math.PI * params.amplitude;
      const scale = math.mapRange(n, -1, 1, params.scaleMin, params.scaleMax);

      // desenhando grid
      context.save();
      context.translate(x, y);
      context.translate(cellMargx, cellMargh);
      context.translate(cellW * 0.5, cellH * 0.5);
      context.rotate(angle);

      context.lineWidth = scale;

      context.beginPath();
      context.moveTo(w * -0.5, 0);
      context.lineTo(w * 0.5, 0);
      context.stroke();
      context.restore();
    }
  };
};

const createPane = () => {
  const pane = new Pane();

  let folder;
  folder = pane.addFolder({ title: "Grid" });
  folder.addInput(params, "cols", { min: 1, max: 100, step: 1 });
  folder.addInput(params, "rows", { min: 1, max: 100, step: 1 });
  folder.addInput(params, "scaleMin", { min: 1, max: 100 });
  folder.addInput(params, "scaleMax", { min: 1, max: 100 });

  folder = pane.addFolder({ title: "Noise" });
  folder.addInput(params, "frequency", { min: -0.001, max: 0.01 });
  folder.addInput(params, "amplitude", { min: 0, max: 1 });
};
createPane();

canvasSketch(sketch, settings);

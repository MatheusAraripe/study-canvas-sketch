import canvasSketch from "canvas-sketch";
import math from "canvas-sketch-util/math";
import random from "canvas-sketch-util/random";
import {
  drawGrid,
  highlightGridCell,
  createAgent,
  updateAgent,
  bounceAgent,
  resolveCollision,
  drawAgent,
  drawConnection,
} from "./utils01";
import { color } from "canvas-sketch-util";

const settings = {
  dimensions: [window.innerWidth, window.innerHeight],
  resizeCanvas: true, // permite redimensionar junto com a janela
  scaleToView: true,
  animate: true,
};

const randomColors = [
  "#79B4B7",
  "#BFA2DB",
  "#DEBA9D",
  "#87A8A4",
  "#DE8971",
  "#E6B566",
  "#F2AAAA",
  "#95D2B3",
  "#CA8787",
  "#93C6E7",
  "#FAAB78",
  "#9ADCFF",
  "#D77FA1",
];

const colors = {
  lines: "#1E1E1E",
  agents: randomColors,
  bg: "#FFFCF2",
  gridLines: "#C7BFA6",
  gridCells: "rgba(200, 200, 255, 0.3)",
};

const cellGridSize = 35;

// Sketch

const sketch = ({ width, height }) => {
  let agents = Array.from({ length: 40 }, () =>
    createAgent(
      random.range(0, width),
      random.range(0, height),
      colors.agents.length
    )
  );

  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    // Pinta células onde há agentes
    highlightGridCell(context, agents, cellGridSize, colors);

    // Grid por cima do fundo
    drawGrid(context, width, height, cellGridSize, colors);

    // Desenhar conexões + colisões
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        drawConnection(context, agents[i], agents[j], colors);

        let [ai, aj] = resolveCollision(agents[i], agents[j]);
        agents[i] = ai;
        agents[j] = aj;
      }
    }

    // Atualizar + desenhar agentes
    agents = agents
      .map((a) => updateAgent(a))
      .map((a) => bounceAgent(a, width, height));

    agents.forEach((a) => drawAgent(context, a, colors));
  };
};

canvasSketch(sketch, settings);

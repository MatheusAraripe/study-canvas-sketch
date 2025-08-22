import canvasSketch from "canvas-sketch";
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
  drawHoverCell,
} from "./utils01";

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

// estado do mouse (em coords do canvas!)
const mouse = { x: -1, y: -1, inside: false };

// Sketch

const sketch = ({ width, height, canvas }) => {
  let agents = Array.from({ length: 60 }, () =>
    createAgent(
      random.range(0, width),
      random.range(0, height),
      colors.agents.length
    )
  );

  // const onMove = (e) => {
  //   const rect = canvas.getBoundingClientRect();
  //   const scaleX = canvas.width / rect.width; // considera devicePixelRatio
  //   const scaleY = canvas.height / rect.height; // idem
  //   mouse.x = (e.clientX - rect.left) * scaleX;
  //   mouse.y = (e.clientY - rect.top) * scaleY;
  //   mouse.inside =
  //     mouse.x >= 0 && mouse.x <= width && mouse.y >= 0 && mouse.y <= height;
  // };
  // const onLeave = () => {
  //   mouse.inside = false;
  // };

  // canvas.addEventListener("mousemove", onMove);
  // canvas.addEventListener("mouseleave", onLeave);

  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    // Pinta células onde há agentes
    highlightGridCell(context, agents, cellGridSize, colors);

    // Grid por cima do fundo
    drawGrid(context, width, height, cellGridSize, colors);

    // célula sob o mouse com box-shadow
    // drawHoverCell(context, cellGridSize, colors, mouse);

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

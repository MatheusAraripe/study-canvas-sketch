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
  initTrailGrid,
  updateTrail,
  drawMouseTrail,
  attachTrailMouse,
  vectorBetween,
  angleBetween,
  drawAngleArc,
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
  gridCells: "#e7e4d9ff",
};

const cellGridSize = 30;

// Sketch

const sketch = ({ width, height, canvas }) => {
  let agents = Array.from({ length: 60 }, () =>
    createAgent(
      random.range(0, width),
      random.range(0, height),
      colors.agents.length
    )
  );

  let draggingAgent = null;
  let mouse = { x: 0, y: 0, px: 0, py: 0 };

  // função auxiliar para mapear mouse ao espaço do canvas
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    };
  };

  canvas.addEventListener("pointermove", (e) => {
    const pos = getMousePos(e);
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = pos.x;
    mouse.y = pos.y;

    let hovering = false;
    for (const a of agents) {
      const dx = mouse.x - a.pos.x;
      const dy = mouse.y - a.pos.y;
      if (dx * dx + dy * dy <= a.radius * a.radius) {
        hovering = true;
        break;
      }
    }

    // cursor muda só quando está em cima de um agente
    canvas.style.cursor = hovering ? "pointer" : "default";

    if (draggingAgent) {
      draggingAgent.pos.x = mouse.x;
      draggingAgent.pos.y = mouse.y;
      // zera a vel enquanto arrasta
      draggingAgent.vel.x = 0;
      draggingAgent.vel.y = 0;
    }
  });

  canvas.addEventListener("pointerdown", (e) => {
    const pos = getMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;

    for (const a of agents) {
      const dx = mouse.x - a.pos.x;
      const dy = mouse.y - a.pos.y;
      if (dx * dx + dy * dy <= a.radius * a.radius) {
        draggingAgent = a;
        canvas.setPointerCapture?.(e.pointerId);
        break;
      }
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (draggingAgent) {
      // aplica “arremesso” = delta do mouse
      draggingAgent.vel.x = mouse.x - mouse.px;
      draggingAgent.vel.y = mouse.y - mouse.py;
    }
    draggingAgent = null;
    canvas.releasePointerCapture?.(e.pointerId);
  });

  initTrailGrid(width, height, cellGridSize);

  // // 2) Mouse mapeado ao espaço do sketch (corrige deslocamentos)
  attachTrailMouse(canvas, () => ({ width, height }));

  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    // Pinta células onde há agentes
    highlightGridCell(context, agents, cellGridSize, colors);
    // if (draggingAgent) console.log("draggingAgent " + draggingAgent);

    // Grid por cima do fundo
    drawGrid(context, width, height, cellGridSize, colors);

    // atualiza e desenha rastros
    updateTrail(0.02);
    drawMouseTrail(context, cellGridSize);

    // Desenhar conexões + colisões
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        drawConnection(context, agents[i], agents[j], colors);

        if (agents[i] === draggingAgent || agents[j] === draggingAgent)
          continue;
        let [ai, aj] = resolveCollision(agents[i], agents[j]);

        // let [ai, aj] = resolveCollision(agents[i], agents[j]);
        agents[i] = ai;
        agents[j] = aj;
      }
    }

    // Atualizar + desenhar agentes
    agents = agents
      .map((a) => (a === draggingAgent ? a : updateAgent(a)))
      .map((a) => (a === draggingAgent ? a : bounceAgent(a, width, height)));

    agents.forEach((a) =>
      a === draggingAgent
        ? drawAgent(context, a, colors, true)
        : drawAgent(context, a, colors)
    );

    // Desenha o ângulo entre as linhas
    agents.forEach((agent, i) => {
      const neighbors = [];

      for (let j = 0; j < agents.length; j++) {
        if (i === j) continue;
        const other = agents[j];
        const dx = agent.pos.x - other.pos.x;
        const dy = agent.pos.y - other.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          neighbors.push(other);
        }
      }

      // se tiver pelo menos 2 vizinhos, calcula ângulo entre as ligações
      if (neighbors.length >= 2) {
        const v1 = vectorBetween(agent.pos, neighbors[0].pos);
        const v2 = vectorBetween(agent.pos, neighbors[1].pos);
        const angle = angleBetween(v1, v2);

        // desenha o arco do ângulo
        drawAngleArc(context, agent.pos, v1, v2, 25, "#1e1e1e");

        // desenhar o ângulo no canvas
        const { x, y } = agent.pos;
        context.fillStyle = "#333";
        context.font = "12px sans-serif";
        context.fillText(angle.toFixed(1) + "°", x + 10, y - 10);
      }
    });
  };
};

canvasSketch(sketch, settings);

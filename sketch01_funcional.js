import canvasSketch from "canvas-sketch";
import math from "canvas-sketch-util/math";
import random from "canvas-sketch-util/random";

const settings = {
  dimensions: [window.innerWidth, window.innerHeight],
  resizeCanvas: true, // permite redimensionar junto com a janela
  scaleToView: true,
  animate: true,
};

const colors = {
  lines: "#434343",
  agents: "#434343",
  bg: "#FFFCF2",
  grid_lines: "#C7BFA6",
  grid_cells: "rgba(200, 200, 255, 0.3)",
};

const cellGridSize = 35;

// -----------------
// Grid
// -----------------

const drawGrid = (context, width, height, step = 50) => {
  context.strokeStyle = colors.grid_lines;
  context.lineWidth = 0.4;

  for (let x = 0; x <= width; x += step) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y <= height; y += step) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
};

// -----------------
// "Ativa" o Grid
// -----------------

const highlightGridCell = (context, agents, cellSize) => {
  context.fillStyle = colors.grid_cells;

  agents.forEach((agent) => {
    const cellX = Math.floor(agent.pos.x / cellSize);
    const cellY = Math.floor(agent.pos.y / cellSize);

    context.fillRect(cellX * cellSize, cellY * cellSize, cellSize, cellSize);
  });
};

// -----------------
// "Construtores"
// -----------------
const createVector = (x, y) => ({ x, y });

const createAgent = (x, y) => ({
  pos: createVector(x, y),
  vel: createVector(random.range(-2, 2), random.range(-2, 2)),
  radius: random.range(4, 8),
  mass: 1, // simplificado: todas com mesma massa
});

// -----------------
// Utilitários
// -----------------
const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const normalize = (v) => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

const dot = (a, b) => a.x * b.x + a.y * b.y;

// -----------------
// Atualização
// -----------------
const updateAgent = (agent) => ({
  ...agent,
  pos: {
    x: agent.pos.x + agent.vel.x,
    y: agent.pos.y + agent.vel.y,
  },
});

const bounceAgent = (agent, width, height) => {
  let { vel, pos } = agent;
  let newVel = { ...vel };

  if (pos.x - agent.radius <= 0 || pos.x + agent.radius >= width) {
    newVel.x *= -1;
  }
  if (pos.y - agent.radius <= 0 || pos.y + agent.radius >= height) {
    newVel.y *= -1;
  }

  return { ...agent, vel: newVel };
};

// -----------------
// Colisão elástica realista
// -----------------
const resolveCollision = (a, b) => {
  const dist = distance(a.pos, b.pos);
  const minDist = a.radius + b.radius;

  if (dist < minDist) {
    // Vetor normal (direção da colisão)
    const normal = normalize({
      x: b.pos.x - a.pos.x,
      y: b.pos.y - a.pos.y,
    });

    // Vetor tangente
    const tangent = { x: -normal.y, y: normal.x };

    // Projetar velocidades nos vetores normal/tangente
    const v1n = dot(a.vel, normal);
    const v1t = dot(a.vel, tangent);
    const v2n = dot(b.vel, normal);
    const v2t = dot(b.vel, tangent);

    // Como massas são iguais, basta trocar as componentes normais
    const v1nAfter = v2n;
    const v2nAfter = v1n;

    // Reconstroi velocidades em 2D
    const v1nVec = { x: v1nAfter * normal.x, y: v1nAfter * normal.y };
    const v1tVec = { x: v1t * tangent.x, y: v1t * tangent.y };
    const v2nVec = { x: v2nAfter * normal.x, y: v2nAfter * normal.y };
    const v2tVec = { x: v2t * tangent.x, y: v2t * tangent.y };

    const newVelA = { x: v1nVec.x + v1tVec.x, y: v1nVec.y + v1tVec.y };
    const newVelB = { x: v2nVec.x + v2tVec.x, y: v2nVec.y + v2tVec.y };

    // Reposicionamento para não ficarem sobrepostos
    const overlap = (minDist - dist) / 2;
    const correction = { x: normal.x * overlap, y: normal.y * overlap };

    const newPosA = { x: a.pos.x - correction.x, y: a.pos.y - correction.y };
    const newPosB = { x: b.pos.x + correction.x, y: b.pos.y + correction.y };

    return [
      { ...a, vel: newVelA, pos: newPosA },
      { ...b, vel: newVelB, pos: newPosB },
    ];
  }

  return [a, b];
};

// -----------------
// Desenho
// -----------------
const drawAgent = (context, agent) => {
  context.strokeStyle = colors.agents;
  context.fillStyle = colors.agents;
  context.lineWidth = 2;

  context.beginPath();
  context.arc(agent.pos.x, agent.pos.y, agent.radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
};

const drawConnection = (context, a, b) => {
  const dist = distance(a.pos, b.pos);
  if (dist > 200) return;

  context.lineWidth = math.mapRange(dist, 0, 200, 5, 1);
  context.strokeStyle = colors.lines;

  context.beginPath();
  context.moveTo(a.pos.x, a.pos.y);
  context.lineTo(b.pos.x, b.pos.y);
  context.stroke();
};

// -----------------
// Sketch principal
// -----------------
const sketch = ({ width, height }) => {
  let agents = Array.from({ length: 40 }, () =>
    createAgent(random.range(0, width), random.range(0, height))
  );

  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    // Pinta células onde há agentes
    highlightGridCell(context, agents, cellGridSize);

    // Grid por cima do fundo
    drawGrid(context, width, height, cellGridSize);

    // Desenhar conexões + colisões
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        drawConnection(context, agents[i], agents[j]);

        let [ai, aj] = resolveCollision(agents[i], agents[j]);
        agents[i] = ai;
        agents[j] = aj;
      }
    }

    // Atualizar + desenhar agentes
    agents = agents
      .map((a) => updateAgent(a))
      .map((a) => bounceAgent(a, width, height));

    agents.forEach((a) => drawAgent(context, a));
  };
};

canvasSketch(sketch, settings);

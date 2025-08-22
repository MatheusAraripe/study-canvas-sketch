// Funções para sketch01

import math from "canvas-sketch-util/math";
import random from "canvas-sketch-util/random";

const drawGrid = (context, width, height, step = 50, colors) => {
  context.strokeStyle = colors.gridLines;
  context.lineWidth = 0.3;

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

const drawHoverCell = (context, size = 35, colors, mouse) => {
  if (!mouse.inside) return;

  const cellX = Math.floor(mouse.x / size);
  const cellY = Math.floor(mouse.y / size);

  const x = cellX * size;
  const y = cellY * size;

  context.save();
  // cor do bloco
  context.fillStyle = colors.bg;
  // sombra para parecer que está “acima”
  context.shadowColor = "rgba(0,0,0,0.35)";
  context.shadowBlur = 18;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 8;

  // pequeno “padding” e “lift” pra reforçar o 3D
  //   const pad = 4;
  //   const lift = 2;
  context.fillRect(x + pad, y + pad - lift, size - pad * 2, size - pad * 2);

  context.restore();
};

// -----------------
// "Ativa" o Grid
// -----------------

const highlightGridCell = (context, agents, cellSize, colors) => {
  context.fillStyle = colors.gridCells;

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

const createAgent = (x, y, arryColorsLength) => ({
  pos: createVector(x, y),
  vel: createVector(random.range(-2, 2), random.range(-2, 2)),
  radius: random.range(4, 8),
  mass: 1, // simplificado: todas com mesma massa
  colorIndex: Math.round(random.range(0, arryColorsLength)),
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
const drawAgent = (context, agent, colors) => {
  context.fillStyle = colors.agents[agent.colorIndex];
  context.strokeStyle = colors.lines;
  context.lineWidth = 2;

  context.beginPath();
  context.arc(agent.pos.x, agent.pos.y, agent.radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
};

const drawConnection = (context, a, b, colors) => {
  const dist = distance(a.pos, b.pos);
  if (dist > 200) return;

  context.lineWidth = math.mapRange(dist, 0, 200, 5, 1);
  context.strokeStyle = colors.lines;

  context.beginPath();
  context.moveTo(a.pos.x, a.pos.y);
  context.lineTo(b.pos.x, b.pos.y);
  context.stroke();
};

export {
  drawGrid,
  highlightGridCell,
  createAgent,
  updateAgent,
  bounceAgent,
  resolveCollision,
  drawAgent,
  drawConnection,
  drawHoverCell,
};

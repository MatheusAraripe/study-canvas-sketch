// Funções para sketch01

import math from "canvas-sketch-util/math";
import random from "canvas-sketch-util/random";

const cellSize = 30;
// Estado do rastro
let trailCols = 0,
  trailRows = 0;
let trailGrid = null; // intensidades
let trailColors = null; // cor fixa por célula
let mouse = { x: -1, y: -1, inside: false };

// Paleta de tons pastéis
const pastelHues = [
  [190, 220], // azul
  [260, 280], // roxo
  [320, 350], // rosa
  [100, 140], // verde
];

export const drawGrid = (context, width, height, step = 50, colors) => {
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

// Inicializa grid de intensidade + cores
export const initTrailGrid = (width, height, size = cellSize) => {
  trailCols = Math.ceil(width / size);
  trailRows = Math.ceil(height / size);
  trailGrid = new Float32Array(trailCols * trailRows);
  trailColors = new Array(trailCols * trailRows).fill(null); // cor vazia
};

// Index linear
const tIdx = (cx, cy) => cy * trailCols + cx;

// Sorteia cor pastel para uma célula
const pickPastelColor = () => {
  const [minHue, maxHue] =
    pastelHues[Math.floor(Math.random() * pastelHues.length)];
  const hue = minHue + Math.random() * (maxHue - minHue);
  const sat = 35 + Math.random() * 10; // 35–45%
  const light = 75 + Math.random() * 10; // 75–85%
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

// Marca célula do mouse
const trailHit = (mx, my, size = cellSize) => {
  const cx = Math.floor(mx / size);
  const cy = Math.floor(my / size);
  if (cx >= 0 && cy >= 0 && cx < trailCols && cy < trailRows) {
    const idx = tIdx(cx, cy);
    trailGrid[idx] = 1.0;
    if (!trailColors[idx]) {
      trailColors[idx] = pickPastelColor(); // fixa a cor no primeiro uso
    }
  }
};

// Atualiza intensidade com fade
export const updateTrail = (fade = 0.02) => {
  for (let i = 0; i < trailGrid.length; i++) {
    const v = trailGrid[i] - fade;
    trailGrid[i] = v > 0 ? v : 0;
  }
};

// Desenha rastro
export const drawMouseTrail = (context, size = cellSize) => {
  for (let x = 0; x < trailCols; x++) {
    for (let y = 0; y < trailRows; y++) {
      const idx = tIdx(x, y);
      const t = trailGrid[idx];
      if (t <= 0) continue;

      const baseColor = trailColors[idx];
      context.fillStyle = baseColor
        .replace("hsl", "hsla")
        .replace(")", `, ${t})`);
      context.fillRect(x * size, y * size, size, size);
    }
  }
};

// Listener do mouse com mapeamento correto (independe de DPR/retina)
export const attachTrailMouse = (canvas, getWH) => {
  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const { width, height } = getWH(); // pega width/height atuais do sketch
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    mouse.x = x;
    mouse.y = y;
    mouse.inside = true;
    trailHit(x, y);
  };
  const onLeave = () => {
    mouse.inside = false;
  };

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  // retorna um disposer para remover depois
  return () => {
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
  };
};

// -----------------
// "Ativa" o Grid
// -----------------

export const highlightGridCell = (context, agents, cellSize, colors) => {
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

export const createAgent = (x, y, arryColorsLength) => ({
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

// produto escalar
const dot = (a, b) => a.x * b.x + a.y * b.y;

// -----------------
// Atualização
// -----------------
export const updateAgent = (agent) => ({
  ...agent,
  pos: {
    x: agent.pos.x + agent.vel.x,
    y: agent.pos.y + agent.vel.y,
  },
});

export const bounceAgent = (agent, width, height) => {
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
export const resolveCollision = (a, b) => {
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
// Acha o ângulo entre as linhas
// -----------------

// diferença entre dois pontos (vetor)
export const vectorBetween = (a, b) => ({
  x: b.x - a.x,
  y: b.y - a.y,
});

// módulo (tamanho do vetor)
const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

// ângulo em graus entre dois vetores
export const angleBetween = (a, b) => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const cosTheta = dot(a, b) / (magA * magB);
  const clamped = Math.min(1, Math.max(-1, cosTheta)); // evita NaN
  return (Math.acos(clamped) * 180) / Math.PI;
};

export const drawAngleArc = (
  context,
  center,
  v1,
  v2,
  radius = 30,
  color = "red"
) => {
  const a1 = Math.atan2(v1.y, v1.x);
  const a2 = Math.atan2(v2.y, v2.x);

  // diferença mínima (garante arco no sentido menor)
  let diff = a2 - a1;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  if (diff > Math.PI) diff -= 2 * Math.PI;

  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2;

  context.beginPath();
  context.arc(center.x, center.y, radius, a1, a1 + diff, diff < 0);
  context.stroke();
  context.restore();
};

// -----------------
// Desenho
// -----------------
export const drawAgent = (context, agent, colors, dragging = false) => {
  context.fillStyle = colors.agents[agent.colorIndex];
  context.strokeStyle = colors.lines;
  context.lineWidth = 2;

  let radius = agent.radius;

  if (dragging) {
    context.shadowColor = "rgba(0, 0, 0, 0.8)";
    context.shadowBlur = 10;
    radius = radius * 1.35;
  } else {
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
  }

  context.beginPath();
  context.arc(agent.pos.x, agent.pos.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
};

export const drawConnection = (context, a, b, colors) => {
  const dist = distance(a.pos, b.pos);
  if (dist > 200) return;

  context.lineWidth = math.mapRange(dist, 0, 200, 5, 1);
  context.strokeStyle = colors.lines;

  context.beginPath();
  context.moveTo(a.pos.x, a.pos.y);
  context.lineTo(b.pos.x, b.pos.y);
  context.stroke();
};

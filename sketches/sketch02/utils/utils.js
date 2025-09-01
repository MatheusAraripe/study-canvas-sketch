import random from "canvas-sketch-util/random";
import math from "canvas-sketch-util/math";

/**
 * Calcula a distância euclidiana entre dois pontos.
 * @returns {number} A distância.
 */
const dist = (x1, y1, x2, y2) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Interpola a cor de uma partícula com base na intensidade do rastro.
 * @param {number} trailIntensity - A intensidade do calor (0 a 1).
 * @returns {string} Uma string de cor no formato 'rgb(...)'.
 */

const getParticleColor = (trailIntensity, palette) => {
  let r, g, b;
  if (trailIntensity < 0.5) {
    const factor = math.mapRange(trailIntensity, 0, 0.5, 0, 1, true);
    r = math.mapRange(factor, 0, 1, palette.crtCyan.r, palette.hotYellow.r);
    g = math.mapRange(factor, 0, 1, palette.crtCyan.g, palette.hotYellow.g);
    b = math.mapRange(factor, 0, 1, palette.crtCyan.b, palette.hotYellow.b);
  } else {
    const factor = math.mapRange(trailIntensity, 0.5, 1, 0, 1, true);
    r = math.mapRange(factor, 0, 1, palette.hotYellow.r, palette.strongRed.r);
    g = math.mapRange(factor, 0, 1, palette.hotYellow.g, palette.strongRed.g);
    b = math.mapRange(factor, 0, 1, palette.hotYellow.b, palette.strongRed.b);
  }
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
};

// --- FUNÇÕES DE LÓGICA DO SKETCH ---

/**
 * Configura os ouvintes de eventos para mouse e clique.
 */
export const setupEventListeners = (canvas, width, height, mouse, waves) => {
  canvas.addEventListener("mousemove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    mouse.x = event.offsetX * scaleX;
    mouse.y = event.offsetY * scaleY;
  });

  canvas.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  canvas.addEventListener("click", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    const clickX = event.offsetX * scaleX;
    const clickY = event.offsetY * scaleY;
    waves.push({ x: clickX, y: clickY, startTime: Date.now() });
  });
};

/**
 * Atualiza o canvas de rastro com o fade, o pincel do mouse e as ondas.
 */
export const updateTrailCanvas = ({
  trailContext,
  mouse,
  waves,
  width,
  height,
}) => {
  const waveSpeed = 800;
  const waveWidth = 20;

  // Fade
  trailContext.fillStyle = "rgba(0, 0, 0, 0.1)";
  trailContext.fillRect(0, 0, width, height);

  // Pincel do Mouse
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

  // Ondas
  waves.forEach((wave) => {
    const timeSinceClick = (Date.now() - wave.startTime) / 1000;
    const waveFront = timeSinceClick * waveSpeed;
    trailContext.strokeStyle = "rgba(255, 102, 0, 0.93)";
    trailContext.lineWidth = waveWidth;
    trailContext.beginPath();
    trailContext.arc(wave.x, wave.y, waveFront, 0, Math.PI * 2);
    trailContext.stroke();
  });
};

/**
 * Calcula a dinâmica e desenha uma única partícula.
 */
export const drawParticle = (particle, params, palette, state) => {
  const { context, width, height, time, frame, mouse, waves, trailImageData } =
    state;

  const { x, y, centerX, centerY } = particle;

  // Parâmetros de Interação
  const mainRadius = width * 0.4;
  const mouseRadius = 70;
  const maxRepelForce = 40;
  const turbulenceForce = 200;
  const waveStrength = 20;
  const waveSpeed = 800;
  const waveWidth = 20;

  // Lógica de Posição
  let finalX = centerX;
  let finalY = centerY;

  const distToMainCenter = dist(centerX, centerY, width / 2, height / 2);
  if (distToMainCenter > mainRadius) return;

  const distToMouse = dist(centerX, centerY, mouse.x, mouse.y);
  if (distToMouse < mouseRadius) {
    const vecX = centerX - mouse.x;
    const vecY = centerY - mouse.y;
    const repelForce = math.mapRange(
      distToMouse,
      0,
      mouseRadius,
      maxRepelForce,
      0
    );
    const pushX = (vecX / distToMouse) * repelForce;
    const pushY = (vecY / distToMouse) * repelForce;

    const noiseAngle =
      random.noise3D(x * 0.01, y * 0.01, time * 0.3) * Math.PI * 2;
    const turbulenceX = Math.cos(noiseAngle);
    const turbulenceY = Math.sin(noiseAngle);
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

  waves.forEach((wave) => {
    const timeSinceClick = (Date.now() - wave.startTime) / 1000;
    const waveFront = timeSinceClick * waveSpeed;
    const distToWaveCenter = dist(centerX, centerY, wave.x, wave.y);
    if (
      distToWaveCenter > waveFront - waveWidth / 2 &&
      distToWaveCenter < waveFront + waveWidth / 2
    ) {
      const vecX = centerX - wave.x;
      const vecY = centerY - wave.y;
      const forceFade = math.mapRange(distToWaveCenter, 0, width, 1, 0);
      const pushX = (vecX / distToWaveCenter) * waveStrength * forceFade;
      const pushY = (vecY / distToWaveCenter) * waveStrength * forceFade;
      finalX += pushX;
      finalY += pushY;
    }
  });

  // Lógica de Escala
  const n = random.noise3D(x, y, frame * 10, params.frequency);
  const scale = math.mapRange(n, -1, 1, params.scaleMin, params.scaleMax);
  const fade = math.mapRange(distToMainCenter, 0, mainRadius, 1, 0, true);
  const finalScale = scale * fade;
  if (finalScale <= 0) return;

  // Lógica de Cor
  const ix = Math.floor(finalX);
  const iy = Math.floor(finalY);
  if (ix < 0 || ix >= width || iy < 0 || iy >= height) return;
  const pixelIndex = (iy * width + ix) * 4;
  const r = trailImageData[pixelIndex];
  const g = trailImageData[pixelIndex + 1];
  const trailIntensity = (r + g) / 510;
  const finalColor = getParticleColor(trailIntensity, palette);

  // Desenho
  context.save();
  context.translate(finalX, finalY);
  context.fillStyle = finalColor;
  context.shadowColor = finalColor;
  context.shadowBlur = 10;
  context.beginPath();
  context.arc(0, 0, finalScale, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

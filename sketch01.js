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
  lines: "#a9e1ff",
  agents: "#F7CF49",
  bg: "#FEF8EC",
};

const sketch = ({ width, height }) => {
  const agents = [];

  for (let i = 0; i < 55; i++) {
    const x = random.range(0, width);
    const y = random.range(0, height);
    agents.push(new Agent(x, y));
  }
  return ({ context, width, height }) => {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      for (let j = i + 1; j < agents.length; j++) {
        const other_agent = agents[j];

        const distance = agent.pos.getDistance(other_agent.pos);

        if (distance > 200) continue;

        context.lineWidth = math.mapRange(distance, 0, 200, 10, 1);
        context.strokeStyle = colors.lines;
        context.beginPath();
        context.moveTo(agent.pos.x, agent.pos.y);
        context.lineTo(other_agent.pos.x, other_agent.pos.y);
        context.stroke();
      }
    }

    agents.forEach((agent) => {
      agent.update();
      agent.draw(context);
      agent.bounce(width, height);
    });
  };
};

canvasSketch(sketch, settings);

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getDistance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Agent {
  constructor(x, y) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(random.range(-1, 1), random.range(-1, 1));
    this.radius = random.range(4, 12);
  }

  bounce(width, height) {
    if (this.pos.x <= 0 || this.pos.x >= width) this.vel.x *= -1;
    if (this.pos.y <= 0 || this.pos.y >= height) this.vel.y *= -1;
  }

  update() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  getPos() {
    console.log("x: " + this.pos.x + "y: " + this.pos.y);
  }

  draw(context) {
    // context.fillStyle = "colors.agents";
    context.strokeStyle = colors.agents;
    context.lineWidth = 2;

    context.save();
    context.translate(this.pos.x, this.pos.y);

    context.beginPath();
    // context.arc(x, y, r, sAngle, eAngle, counterclockwise)
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }
}

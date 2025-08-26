import canvasSketch from "canvas-sketch";
import math from "canvas-sketch-util/math";
import random from "canvas-sketch-util/random";

const settings = {
  dimensions: [1080, 1080],
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "black";

    // centro do círculo
    const cx = width * 0.5;
    const cy = height * 0.5;

    const w = width * 0.01;
    const h = height * 0.1;
    let x, y;

    const num = 30;
    const radius = width * 0.3;

    for (let i = 0; i < num; i++) {
      const slice = math.degToRad(360 / num);
      const angle = slice * i;

      x = cx + radius * Math.sin(angle);
      y = cy + radius * Math.cos(angle);

      // traços do "relógio"
      context.save();
      context.translate(x, y);
      context.rotate(-angle);
      context.scale(random.range(0.1, 3), random.range(0.1, 0.8));

      context.beginPath();
      context.rect(-w * 0.5, random.range(0, h * -0.5), w, h);
      context.fill();
      context.restore();

      // círculos
      context.save();
      context.translate(cx, cy);
      context.rotate(-angle);

      context.lineWidth = random.range(2, 20);

      context.beginPath();

      // context.arc(x, y, r, sAngle, eAngle, counterclockwise)
      context.arc(
        0,
        0,
        radius * random.range(0.7, 1.2),
        slice * random.range(0, -7),
        slice * random.range(0, 5)
      );

      context.stroke();
      context.restore();
    }
  };
};

canvasSketch(sketch, settings);

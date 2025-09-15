import canvasSketch from "canvas-sketch";
import { random } from "canvas-sketch-util";
import { mapRange } from "canvas-sketch-util/math";
import { rangeFloor } from "canvas-sketch-util/random";
import { quadIn } from "eases";

const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDb, maxDb;

const sketch = () => {
  const numCircles = 15;
  const numSlices = 1;
  const slice = (Math.PI * 2) / numSlices;
  const radius = 200;

  const bins = [];
  const lineWidths = [];
  const rotations = [];

  let lineWidth, bin, mapped, phi;

  for (let i = 0; i < numCircles * numSlices; i++) {
    bin = rangeFloor(4, 64);
    bins.push(bin);
  }

  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    lineWidth = quadIn(t) * 200 + 10;
    lineWidths.push(lineWidth);
  }

  for (let i = 0; i < numCircles; i++) {
    rotations.push(random.range(Math.PI * -25, Math.PI * 25) - Math.PI * 0.5);
  }

  return ({ context, width, height }) => {
    context.fillStyle = "#ecececff";
    context.fillRect(0, 0, width, height);

    if (!audioContext) return;

    analyserNode.getFloatFrequencyData(audioData);

    context.save();
    context.translate(width * 0.5, height * 0.5);
    context.scale(1, -1);

    let cradius = radius;

    for (let i = 0; i < numCircles; i++) {
      context.save();
      context.rotate(rotations[i]);

      cradius += lineWidths[i] * 0.5 + 4;

      for (let j = 0; j < numSlices; j++) {
        context.rotate(slice);
        context.lineWidth = lineWidths[i];

        bin = bins[i * numSlices + j];

        mapped = mapRange(audioData[bin], minDb, maxDb, 0, 1, true);

        phi = slice * mapped;

        context.beginPath();
        context.arc(0, 0, cradius, 0, phi);
        context.stroke();
      }

      cradius += lineWidths[i] * 0.5;

      context.restore();
    }

    context.restore();
  };
};

const addListeners = () => {
  window.addEventListener("mouseup", () => {
    if (!audioContext) createAudio();

    if (audio.paused) {
      audio.play();
      manager.play();
    } else {
      audio.pause();
      manager.pause();
    }
  });
};

const createAudio = () => {
  audio = document.createElement("audio");
  audio.src = "./../../../assets/audios/Sage_Always_Sunny_Freestyle.mp3";

  audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(audioContext.destination);

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.9;
  sourceNode.connect(analyserNode);

  minDb = analyserNode.minDecibels;
  maxDb = analyserNode.maxDecibels;

  audioData = new Float32Array(analyserNode.frequencyBinCount);
};

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
};

start();

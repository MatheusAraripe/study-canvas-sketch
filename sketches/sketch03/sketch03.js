import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  BloomEffect,
  EffectPass,
} from "postprocessing";

// --- CONFIGURAÇÃO BÁSICA ---
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.02);
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// --- PALETA DE CORES ---
const colorPalette = [0xfe3508, 0x882121, 0x92505c, 0x300e22, 0x4f0505].map(
  (c) => new THREE.Color(c)
);
// PALETA PARA INTERAÇÃO
const interactionColorPalette = [
  0x39ff14, 0x00ff00, 0x7fff00, 0xadff2f, 0x00ffaa,
].map((c) => new THREE.Color(c));

// --- FERRAMENTAS DE INTERAÇÃO (RAYCASTING) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentIntersected = null;

const handleMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
window.addEventListener("mousemove", handleMouseMove, false);

// ---(BLOOM) ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomEffect = new BloomEffect({
  mipmapBlur: true,
  intensity: 2.5,
  luminanceThreshold: 0.1,
  luminanceSmoothing: 0.2,
});
composer.addPass(new EffectPass(camera, bloomEffect));

// ---QUADRADOS ---
const squareGeo = new THREE.PlaneGeometry(1, 1);

const getSquare = () => {
  const x = Math.round(Math.random() * 30) - 15.5;
  const y = Math.round(Math.random()) * 4;
  const z = Math.round(Math.random() * -10) - 0.5;

  const initialColor =
    colorPalette[Math.floor(Math.random() * colorPalette.length)];

  const glowingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Cor base
    emissive: initialColor,
    emissiveIntensity: 8.0,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(squareGeo, glowingMaterial);
  mesh.position.set(x, y, z);
  mesh.rotation.x = Math.PI * -0.5;

  mesh.userData = {
    targetColor: initialColor,
    // Temporizador para a próxima mudança de cor (em segundos)
    colorChangeTimer: Math.random() * 5, // Começa com um tempo aleatório
    update(deltaTime) {
      mesh.position.z += 0.1;
      if (mesh.position.z > 5) {
        mesh.position.z = -6;
      }

      // mudança de cor
      this.colorChangeTimer -= deltaTime; // Diminui o tempo
      if (this.colorChangeTimer <= 0) {
        // Escolhe uma nova cor alvo
        this.targetColor =
          colorPalette[Math.floor(Math.random() * colorPalette.length)];
        // Reinicia o temporizador com um novo tempo aleatório (ex: entre 2 e 7 segundos)
        this.colorChangeTimer = 2 + Math.random() * 5;
      }
      mesh.material.emissive.lerp(this.targetColor, deltaTime * 1.5);
    },
  };
  return mesh;
};

const boxes = Array(800).fill().map(getSquare);
boxes.forEach((b) => scene.add(b));

// --- LOOP DE ANIMAÇÃO ---
const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  // --- LÓGICA DE RAYCASTING AQUI ---
  raycaster.setFromCamera(mouse, camera);

  // Calcula os objetos que o raio está interceptando
  const intersects = raycaster.intersectObjects(boxes);

  if (intersects.length > 0) {
    // Se o raio acertou algo...
    const hoveredObject = intersects[0].object;

    // Verifica se é a *primeira vez* que estamos sobre este objeto
    if (currentIntersected !== hoveredObject) {
      currentIntersected = hoveredObject; // Guarda a referência do objeto

      // ESCOLHE UMA NOVA COR DA NOVA PALETA
      const newInteractionColor =
        interactionColorPalette[
          Math.floor(Math.random() * interactionColorPalette.length)
        ];
      currentIntersected.userData.targetColor = newInteractionColor;
    }
  } else {
    currentIntersected = null;
  }
  boxes.forEach((b) => b.userData.update(deltaTime));

  camera.rotation.z += 0.0006;
  composer.render(deltaTime);
};
animate();

// --- REDIMENSIONAMENTO DA JANELA ---
const handleWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener("resize", handleWindowResize, false);

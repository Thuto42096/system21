// ─── THREE.JS PARTICLE WAVE FIELD ───
// Subtle particle terrain behind the hero. Degrades gracefully:
// reduced particle count + capped DPR on mobile, static frame for
// prefers-reduced-motion, and the CSS gradient remains as fallback.
import * as THREE from 'three';

const canvas = document.getElementById('webgl');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove();
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.6, 7);
camera.lookAt(0, 0, 0);

// Particle grid — fewer particles for subtlety
const SIZE = 26;
const SEG = isMobile ? 70 : 120;
const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
geometry.rotateX(-Math.PI / 2);

// Single accent color instead of rainbow
const uniforms = {
  uTime:   { value: 0 },
  uMouse:  { value: new THREE.Vector2(0, 0) },
  uColor:  { value: new THREE.Color('#4f6df5') },
  uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uPixelRatio;
    varying float vElevation;
    varying float vDist;

    vec2 hash(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix( mix(dot(hash(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),
                      dot(hash(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
                  mix(dot(hash(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),
                      dot(hash(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
      vec3 pos = position;
      float t = uTime * 0.2;
      float e = noise(pos.xz * 0.3 + t) * 0.7;
      e += noise(pos.xz * 0.7 - t * 0.5) * 0.25;
      e += 0.3 * exp(-0.2 * dot(pos.xz - uMouse * 5.0, pos.xz - uMouse * 5.0));
      pos.y += e;
      vElevation = e;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      vDist = length(pos.xz) / 13.0;
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.2 + vElevation * 1.6) * uPixelRatio * (5.0 / -mv.z);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uColor;
    varying float vElevation;
    varying float vDist;

    void main() {
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.15, d);
      // Single color with brightness variation by elevation
      vec3 col = uColor * (0.6 + vElevation * 0.5);
      alpha *= (0.3 + vElevation * 0.25) * (1.0 - smoothstep(0.5, 1.0, vDist));
      gl_FragColor = vec4(col, alpha);
    }
  `,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// Mouse parallax (lerped)
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
window.addEventListener('pointermove', (e) => {
  target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
}, { passive: true });

// Pause rendering when hero is out of view or tab hidden
let heroVisible = true;
const hero = document.querySelector('.hero');
if (hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(hero);
}

// Fade the canvas out as the user scrolls past the hero
function updateFade() {
  const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.7));
  canvas.style.opacity = fade.toFixed(3);
}
window.addEventListener('scroll', updateFade, { passive: true });
updateFade();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
});

const clock = new THREE.Clock();
function tick() {
  if (heroVisible && !document.hidden) {
    mouse.lerp(target, 0.04);
    uniforms.uMouse.value.copy(mouse);
    uniforms.uTime.value = clock.getElapsedTime();
    camera.position.x = mouse.x * 0.4;
    camera.position.y = 2.6 + mouse.y * 0.2;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  if (!reducedMotion) requestAnimationFrame(tick);
}

if (reducedMotion) {
  uniforms.uTime.value = 4;
  renderer.render(scene, camera);
} else {
  tick();
}

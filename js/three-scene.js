// ─── THREE.JS PARTICLE WAVE FIELD ───
// Shader-driven particle terrain behind the hero. Degrades gracefully:
// reduced particle count + capped DPR on mobile, static frame for
// prefers-reduced-motion, and the CSS mesh background remains as fallback.
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

// Particle grid
const SIZE = 26;
const SEG = isMobile ? 90 : 150;
const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
geometry.rotateX(-Math.PI / 2);

const uniforms = {
  uTime:   { value: 0 },
  uMouse:  { value: new THREE.Vector2(0, 0) },
  uColorA: { value: new THREE.Color('#5b4cff') },
  uColorB: { value: new THREE.Color('#2dd4b8') },
  uColorC: { value: new THREE.Color('#a86bef') },
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

    // Simplex-style pseudo noise (cheap, good enough for waves)
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
      float t = uTime * 0.25;
      float e = noise(pos.xz * 0.35 + t) * 0.9;
      e += noise(pos.xz * 0.8 - t * 0.6) * 0.35;
      // gentle swell toward the mouse
      e += 0.4 * exp(-0.18 * dot(pos.xz - uMouse * 6.0, pos.xz - uMouse * 6.0));
      pos.y += e;
      vElevation = e;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      vDist = length(pos.xz) / 13.0;
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.6 + vElevation * 2.2) * uPixelRatio * (6.0 / -mv.z);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying float vElevation;
    varying float vDist;

    void main() {
      // round soft point
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.1, d);
      // brand gradient by elevation, faded at field edges
      vec3 col = mix(uColorA, uColorB, smoothstep(-0.6, 0.9, vElevation));
      col = mix(col, uColorC, smoothstep(0.7, 1.4, vElevation));
      alpha *= (0.55 + vElevation * 0.35) * (1.0 - smoothstep(0.55, 1.0, vDist));
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
  const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.85));
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
    mouse.lerp(target, 0.05);
    uniforms.uMouse.value.copy(mouse);
    uniforms.uTime.value = clock.getElapsedTime();
    camera.position.x = mouse.x * 0.6;
    camera.position.y = 2.6 + mouse.y * 0.3;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  if (!reducedMotion) requestAnimationFrame(tick);
}

if (reducedMotion) {
  uniforms.uTime.value = 4; // single styled frame, no animation
  renderer.render(scene, camera);
} else {
  tick();
}

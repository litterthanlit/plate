import * as THREE from "three";
import type { PrintedCheck } from "@/lib/receipt-print";

/**
 * A thermal receipt lying on the table. Thermal paper remembers the roll, so
 * the ends curl up and the middle sags flat. Grab it and it lifts and drapes;
 * pull fast and it crumples; let go and it flicks back, keeping a few creases.
 *
 * Deformation runs on the CPU over one grid (~5k vertices), so shadows,
 * raycasting and normals all see the same bent paper for free.
 */

export type ReceiptSceneOptions = {
  /** Paper width on screen, in CSS px. */
  paperPx: number;
  reducedMotion: boolean;
  onNavigate: (href: string) => void;
  /** Called once, after the first frame is on screen. */
  onReady: () => void;
};

export type ReceiptScene = {
  /** Resize to the host and refit the camera. */
  resize: (paperPx: number) => void;
  /** Swap in a reprinted check (e.g. new check number). */
  setCheck: (check: PrintedCheck) => void;
  dispose: () => void;
};

const W = 1; // paper width in world units; everything scales from it
const SEG_X = 36;
const TILT = THREE.MathUtils.degToRad(12);
const FOV = 18;
/** Room around the paper for curls, flicks and the shadow, in CSS px. */
export const STAGE_MARGIN = 72;
const STEP = 1 / 120;

// --- noise -----------------------------------------------------------------

/** 2D simplex noise (Gustavson), seeded permutation. Returns -1..1. */
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256).map((_, i) => i);
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (xin: number, yin: number) => {
    const s2 = (xin + yin) * F2;
    const i = Math.floor(xin + s2);
    const j = Math.floor(yin + s2);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    for (const [dx, dy, gi] of [
      [x0, y0, perm[ii + perm[jj]] & 7],
      [x1, y1, perm[ii + i1 + perm[jj + j1]] & 7],
      [x2, y2, perm[ii + 1 + perm[jj + 1]] & 7],
    ] as const) {
      const tt = 0.5 - dx * dx - dy * dy;
      if (tt > 0) {
        const g = grad[gi];
        n += tt * tt * tt * tt * (g[0] * dx + g[1] * dy);
      }
    }
    return 70 * n;
  };
}

// --- springs -----------------------------------------------------------------

/** Damped spring toward `target`; semi-implicit Euler is stable at 60fps. */
class Spring {
  value: number;
  velocity = 0;
  target: number;
  constructor(
    value: number,
    public stiffness: number,
    public damping: number,
  ) {
    this.value = value;
    this.target = value;
  }
  step(dt: number) {
    const force =
      -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
  }
  get restless() {
    return (
      Math.abs(this.velocity) > 1e-4 || Math.abs(this.value - this.target) > 1e-4
    );
  }
}

/** Spring by damping ratio. Starts at `from`, always heads home to 0. */
function springPair(stiffness: number, ratio: number, from = 0) {
  const spring = new Spring(from, stiffness, 2 * Math.sqrt(stiffness) * ratio);
  spring.target = 0;
  return spring;
}

// --- scene -------------------------------------------------------------------

export function createReceiptScene(
  host: HTMLElement,
  initial: PrintedCheck,
  options: ReceiptSceneOptions,
): ReceiptScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.touchAction = "pan-y";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  // Table: catches the shadow only; the linen colour is the page behind.
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: 0x32281e, opacity: 0.2 }),
  );
  table.receiveShadow = true;
  scene.add(table);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e0d2, 2.55));
  const sun = new THREE.DirectionalLight(0xfff8f0, 1.05);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 9;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  // --- paper ---
  let check = initial;
  let H = W * check.aspect;
  let segY = Math.min(180, Math.round(SEG_X * check.aspect));
  let geometry = new THREE.PlaneGeometry(W, H, SEG_X, segY);
  let rest = Float32Array.from(geometry.attributes.position.array);

  const texture = new THREE.CanvasTexture(check.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const front = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.62, // thermal coating has a faint sheen
    metalness: 0,
    alphaTest: 0.5,
    side: THREE.FrontSide,
  });
  const back = new THREE.MeshStandardMaterial({
    color: 0xf1ebe0,
    roughness: 0.9,
    alphaMap: texture,
    alphaTest: 0.5,
    side: THREE.BackSide,
  });
  const paper = new THREE.Group();
  const frontMesh = new THREE.Mesh(geometry, front);
  const backMesh = new THREE.Mesh(geometry, back);
  for (const mesh of [frontMesh, backMesh]) {
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    paper.add(mesh);
  }
  scene.add(paper);

  // --- state ---
  const noise = makeNoise(29);
  const settleFrom = options.reducedMotion ? 0 : 1;
  // Whole-sheet pose: drops onto the table on load, flicks on release.
  const pose = {
    x: springPair(60, 0.5),
    y: springPair(60, 0.5),
    z: springPair(70, 0.55, settleFrom * 0.35),
    spin: springPair(45, 0.42, settleFrom * -0.12),
    tiltX: springPair(55, 0.45, settleFrom * 0.25),
    tiltY: springPair(55, 0.45, settleFrom * -0.18),
  };
  // Grab displacement, local to the sheet.
  const pull = {
    x: springPair(240, 0.95),
    y: springPair(240, 0.95),
    z: springPair(240, 0.95),
  };
  let grab: { x: number; y: number; z0: number } | null = null;
  let crumple = 0; // live crumple from this grab, 0..1
  let creases = 0.04; // what the paper keeps, 0..0.35
  let creaseFocus = { x: 0, y: 0 };
  const curl = new Spring(settleFrom ? 0.55 : 1, 26, 2 * Math.sqrt(26) * 0.5);
  curl.target = 1;

  function deform() {
    const pos = geometry.attributes.position.array as Float32Array;
    const half = H / 2;
    const curlLen = Math.min(H * 0.16, W * 0.62);
    const radius = (W * 0.36) / Math.max(0.2, curl.value);
    const sigma = W * 0.38;
    const px = pull.x.value;
    const py = pull.y.value;
    const pz = pull.z.value;
    const pullAmt = Math.hypot(px, py, pz);
    const crush = crumple + creases;
    const freq = 8 / W;

    for (let i = 0; i < pos.length; i += 3) {
      const x0 = rest[i];
      const y0 = rest[i + 1];
      let y = y0;
      let z = 0.002;

      // Roll memory: both ends roll up along a true arc (length kept).
      const fromTop = half - y0;
      const fromBottom = y0 + half;
      if (fromTop < curlLen) {
        const d = curlLen - fromTop;
        const a = d / radius;
        y = half - curlLen + radius * Math.sin(a);
        z += radius * (1 - Math.cos(a));
      } else if (fromBottom < curlLen) {
        const d = curlLen - fromBottom;
        const a = d / radius;
        y = -half + curlLen - radius * Math.sin(a);
        z += radius * (1 - Math.cos(a));
      }
      // The roll also bows it across: edges up a hair, middle sagging flat.
      const across = (x0 / (W / 2)) ** 2;
      z += across * W * 0.018 * curl.value;

      let x = x0;
      if (pullAmt > 1e-4) {
        const d = Math.hypot(x0 - creaseFocus.x, y0 - creaseFocus.y);
        // Lifted paper drapes: wide soft falloff, not a bump.
        const w = 1 / (1 + (d / sigma) ** 2) ** 1.4;
        x += px * w;
        y += py * w;
        z += pz * w;
      }

      if (crush > 0.002) {
        // Creases: ridged noise reads as sharp folds once lit.
        const near = Math.exp(
          -((x0 - creaseFocus.x) ** 2 + (y0 - creaseFocus.y) ** 2) / (W * W * 0.45),
        );
        const amount = crumple * near + creases * (0.35 + 0.65 * near);
        const n1 = 1 - Math.abs(noise(x0 * freq, y0 * freq));
        const n2 = 1 - Math.abs(noise(x0 * freq * 2.3 + 17, y0 * freq * 2.3 - 5));
        const fold = (n1 * n1 - 0.45) + (n2 * n2 - 0.45) * 0.45;
        z += fold * amount * W * 0.085;
        // Crumpled paper shortens toward the fist.
        x -= (x0 - creaseFocus.x) * amount * 0.12;
        y -= (y0 - creaseFocus.y) * amount * 0.12;
      }

      pos[i] = x;
      pos[i + 1] = y;
      pos[i + 2] = Math.max(0.002, z);
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  // --- camera fit ---
  let viewW = 1;
  let viewH = 1;
  function fit(paperPx: number) {
    viewW = host.clientWidth;
    viewH = host.clientHeight;
    renderer.setSize(viewW, viewH, false);
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    camera.aspect = viewW / viewH;
    // Distance where W world units span paperPx on screen.
    const pxPerUnit = paperPx / W;
    const visibleH = viewH / pxPerUnit;
    const dist = visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.position.set(0, -Math.sin(TILT) * dist, Math.cos(TILT) * dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    sun.position.set(-W * 1.4, H * 0.35, W * 3.2);
    const cam = sun.shadow.camera;
    cam.left = -W * 1.6;
    cam.right = W * 1.6;
    cam.top = H * 0.75;
    cam.bottom = -H * 0.75;
    cam.near = 0.1;
    cam.far = 12;
    cam.updateProjectionMatrix();
  }

  // --- pointer ---
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  let pointer: {
    id: number;
    startX: number;
    startY: number;
    startT: number;
    lastX: number;
    lastY: number;
    lastT: number;
    moved: boolean;
    anchor: THREE.Vector3;
    speed: number;
  } | null = null;
  let hovered: string | null = null;

  function rayAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
  }

  function hitPaper(clientX: number, clientY: number) {
    rayAt(clientX, clientY);
    const [hit] = raycaster.intersectObjects([frontMesh, backMesh], false);
    return hit ?? null;
  }

  function regionAt(uv: THREE.Vector2 | undefined) {
    if (!uv) return null;
    const px = uv.x * check.canvas.width;
    const py = (1 - uv.y) * check.canvas.height;
    return (
      check.regions.find(
        (r) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1,
      ) ?? null
    );
  }

  function setHovered(id: string | null) {
    if (id === hovered) return;
    hovered = id;
    check.draw(hovered);
    texture.needsUpdate = true;
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const hit = hitPaper(event.clientX, event.clientY);
    if (!hit || !hit.uv) return;
    // Rest-space grab point: undo the sheet pose, read the grid coordinate.
    const u = hit.uv.x;
    const v = hit.uv.y;
    grab = { x: (u - 0.5) * W, y: (v - 0.5) * H, z0: hit.point.z };
    creaseFocus = { x: grab.x, y: grab.y };
    dragPlane.constant = -hit.point.z;
    pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startT: performance.now(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      moved: false,
      anchor: hit.point.clone(),
      speed: 0,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    wake();
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) {
      const hit = hitPaper(event.clientX, event.clientY);
      const region = regionAt(hit?.uv);
      setHovered(region?.id ?? null);
      canvas.style.cursor = region ? "pointer" : hit ? "grab" : "default";
      return;
    }
    const now = performance.now();
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (!pointer.moved && Math.hypot(dx, dy) > 6) {
      pointer.moved = true;
      setHovered(null);
    }
    rayAt(event.clientX, event.clientY);
    if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
      const offX = hitPoint.x - pointer.anchor.x;
      const offY = hitPoint.y - pointer.anchor.y;
      const reach = Math.hypot(offX, offY);
      pull.x.target = offX;
      pull.y.target = offY;
      // Paper lifts as you pull it, then hangs from your fingers.
      pull.z.target = Math.min(W * 0.32, W * 0.07 + reach * 0.55);
      const dt = Math.max(1, now - pointer.lastT) / 1000;
      const pxSpeed =
        Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY) / dt;
      pointer.speed = pointer.speed * 0.7 + pxSpeed * 0.3;
    }
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastT = now;
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const tap = !pointer.moved && performance.now() - pointer.startT < 500;
    if (tap) {
      const hit = hitPaper(event.clientX, event.clientY);
      const region = regionAt(hit?.uv);
      if (region) options.onNavigate(region.href);
    } else {
      // Flick: hand the pull's momentum to the whole sheet, then spring home.
      const vx = pull.x.velocity;
      const vy = pull.y.velocity;
      const gx = grab?.x ?? 0;
      const gy = grab?.y ?? 0;
      pose.x.velocity += vx * 0.35;
      pose.y.velocity += vy * 0.35;
      pose.z.velocity += Math.hypot(vx, vy) * 0.12;
      pose.spin.velocity += ((gx * vy - gy * vx) / (W * H)) * 1.4;
      pose.tiltX.velocity += -vy * 0.9;
      pose.tiltY.velocity += vx * 0.9;
    }
    // Paper remembers some of what you did to it.
    creases = Math.min(0.35, creases + crumple * 0.3);
    pull.x.target = pull.y.target = pull.z.target = 0;
    // Let go: springier and less damped, so it slaps back with a wobble.
    for (const s of [pull.x, pull.y, pull.z]) {
      s.stiffness = 120;
      s.damping = 2 * Math.sqrt(120) * 0.32;
    }
    grab = null;
    pointer = null;
    canvas.style.cursor = "grab";
    wake();
  }

  function onPointerLeave() {
    if (!pointer) {
      setHovered(null);
      canvas.style.cursor = "default";
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  // --- loop: runs only while something moves ---
  let raf = 0;
  let last = 0;
  let readySent = false;
  let visible = true;

  function step(dt: number) {
    if (pointer) {
      // Fast pulls crumple; holding still lets it ease.
      const pxPerSec = pointer.speed;
      const push = Math.min(1, pxPerSec / 1800);
      crumple += (push - crumple * 0.35) * dt * 2.2;
      crumple = Math.min(1, Math.max(0, crumple));
      for (const s of [pull.x, pull.y, pull.z]) {
        s.stiffness = 240;
        s.damping = 2 * Math.sqrt(240) * 0.95;
      }
    } else {
      crumple = Math.max(0, crumple - dt * 1.6);
      // Old creases relax slowly but never fully.
      creases = Math.max(0.04, creases - dt * 0.004);
    }
    for (const s of [...Object.values(pose), ...Object.values(pull), curl]) {
      s.step(dt);
    }
  }

  function frame(now: number) {
    raf = 0;
    // Real elapsed time in fixed small steps: settles on time on slow
    // devices, and stiff springs stay stable.
    const elapsed = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    const steps = Math.max(1, Math.ceil(elapsed / STEP));
    for (let i = 0; i < steps; i++) step(elapsed / steps);

    paper.position.set(pose.x.value, pose.y.value, pose.z.value);
    paper.rotation.set(pose.tiltX.value, pose.tiltY.value, pose.spin.value);
    deform();
    renderer.render(scene, camera);

    if (!readySent) {
      readySent = true;
      options.onReady();
    }
    const moving =
      pointer !== null ||
      crumple > 0.001 ||
      [...Object.values(pose), ...Object.values(pull), curl].some((s) => s.restless);
    if (moving && visible) {
      raf = requestAnimationFrame(frame);
    } else {
      last = 0;
    }
  }

  function wake() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  io.observe(host);

  fit(options.paperPx);
  wake();

  return {
    resize(paperPx) {
      fit(paperPx);
      wake();
    },
    setCheck(next) {
      check = next;
      texture.image = next.canvas;
      texture.needsUpdate = true;
      if (Math.abs(next.aspect - H / W) > 1e-3) {
        H = W * next.aspect;
        segY = Math.min(180, Math.round(SEG_X * next.aspect));
        const fresh = new THREE.PlaneGeometry(W, H, SEG_X, segY);
        frontMesh.geometry = fresh;
        backMesh.geometry = fresh;
        geometry.dispose();
        geometry = fresh;
        rest = Float32Array.from(geometry.attributes.position.array);
        fit(options.paperPx);
      }
      check.draw(hovered);
      wake();
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      texture.dispose();
      front.dispose();
      back.dispose();
      table.geometry.dispose();
      (table.material as THREE.Material).dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CoatId, Mood, Pattern } from "../lib/types";

/**
 * הכלב התלת־ממדי של Peti.
 * בנוי כולו מצורות חלקות (בלי קבצי מודל), עם פרווה רכה, עיניים מבריקות
 * ואנימציה פרוצדורלית: נשימה, מצמוץ, מבט שעוקב אחרי האצבע, הטיית ראש,
 * אוזניים עם קפיץ, כשכוש זנב וקפיצת שמחה עם מעיכה ומתיחה.
 */

export type Framing = "stage" | "full" | "face";
export interface DogLook {
  coat: CoatId;
  pattern: Pattern;
}

const FUR: Record<CoatId, { base: string; light: string; dark: string; brow: string; nose: string }> = {
  golden: { base: "#D99A57", light: "#F0CF9F", dark: "#B47537", brow: "#8E5A2C", nose: "#4E2B1D" },
  choco: { base: "#6E432A", light: "#B3876A", dark: "#4E2E1B", brow: "#331C10", nose: "#22140E" },
  black: { base: "#2B282F", light: "#BFB2A3", dark: "#1B191E", brow: "#100E12", nose: "#0F0D0F" },
  white: { base: "#EDE5DA", light: "#FAF6F0", dark: "#CDBBA4", brow: "#B39C80", nose: "#33241E" },
  gray: { base: "#8D96A2", light: "#D7DCE2", dark: "#626B77", brow: "#4B525D", nose: "#24252B" },
  ginger: { base: "#CF6F31", light: "#F1C9A0", dark: "#A04B18", brow: "#76350F", nose: "#3F1F12" },
  cream: { base: "#E2CBA4", light: "#F6EBD9", dark: "#C3A272", brow: "#9E7F55", nose: "#3F2A20" },
};

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, k: number, dt: number) => lerp(a, b, 1 - Math.exp(-k * dt));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const MUZ = v3(0, -0.42, 1).normalize();
const PATCH = v3(0.46, 0.22, 0.86).normalize();
const HEAD_SPOTS: [THREE.Vector3, number][] = [
  [v3(-0.55, 0.72, 0.42).normalize(), 0.06],
  [v3(0.25, 0.9, -0.35).normalize(), 0.045],
];
const BODY_SPOTS: [THREE.Vector3, number][] = [
  [v3(-0.85, 0.15, 0.3).normalize(), 0.05],
  [v3(0.8, -0.05, -0.35).normalize(), 0.07],
  [v3(-0.35, 0.55, -0.75).normalize(), 0.05],
  [v3(0.62, 0.48, 0.4).normalize(), 0.035],
];

// ---------- גאומטריה ----------

/** ממצע נורמלים של קודקודים כפולים (התפר והקטבים של הכדור) */
function fixSeams(geo: THREE.BufferGeometry) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const groups = new Map<string, number[]>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(4)}|${pos.getY(i).toFixed(4)}|${pos.getZ(i).toFixed(4)}`;
    const g = groups.get(k);
    if (g) g.push(i);
    else groups.set(k, [i]);
  }
  const n = new THREE.Vector3();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    n.set(0, 0, 0);
    for (const i of ids) n.add(v3(nor.getX(i), nor.getY(i), nor.getZ(i)));
    n.normalize();
    for (const i of ids) nor.setXYZ(i, n.x, n.y, n.z);
  }
}

/** כדור יחידה שמעוות לצורה אורגנית. שומר את הקואורדינטות המקוריות לצביעה */
function blob(fn: (p: THREE.Vector3) => THREE.Vector3, w = 64, h = 48) {
  const geo = new THREE.SphereGeometry(1, w, h);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const unit = new Float32Array(pos.array as Float32Array);
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const q = fn(p.clone());
    pos.setXYZ(i, q.x, q.y, q.z);
  }
  geo.computeVertexNormals();
  fixSeams(geo);
  geo.userData.unit = unit;
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  geo.setAttribute("aFur", new THREE.BufferAttribute(new Float32Array(pos.count).fill(1), 1));
  return geo;
}

/** אורך הפרווה לפי מיקום (קצר סביב העיניים והפה) */
function furLength(geo: THREE.BufferGeometry, fn: (u: THREE.Vector3) => number) {
  const unit = geo.userData.unit as Float32Array;
  const a = geo.attributes.aFur as THREE.BufferAttribute;
  const u = new THREE.Vector3();
  for (let i = 0; i < a.count; i++) {
    u.set(unit[i * 3], unit[i * 3 + 1], unit[i * 3 + 2]);
    a.setX(i, clamp(fn(u), 0, 1));
  }
  a.needsUpdate = true;
}

/** צביעת קודקודים לפי פונקציה של הנקודה על כדור היחידה המקורי */
function paint(geo: THREE.BufferGeometry, fn: (u: THREE.Vector3, out: THREE.Color) => void) {
  const unit = geo.userData.unit as Float32Array | undefined;
  const pos = geo.attributes.position;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const u = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < col.count; i++) {
    if (unit) u.set(unit[i * 3], unit[i * 3 + 1], unit[i * 3 + 2]);
    else u.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    fn(u, c);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}

function withColor(geo: THREE.BufferGeometry) {
  if (!geo.attributes.color) geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  return geo;
}

/** צינור שמתחדד לאורכו (לזנב) */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number, radius: (t: number) => number) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const nx = Math.cos(a) * N.x + Math.sin(a) * B.x;
      const ny = Math.cos(a) * N.y + Math.sin(a) * B.y;
      const nz = Math.cos(a) * N.z + Math.sin(a) * B.z;
      pos.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      nor.push(nx, ny, nz);
      uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.setAttribute("aFur", new THREE.Float32BufferAttribute(uv.filter((_, i) => i % 2 === 1).map((t) => 1 - smooth(0.85, 1, t)), 1));
  return withColor(geo);
}

// ---------- חומרים ----------

let noiseTex: THREE.DataTexture | null = null;
function furNoise() {
  if (noiseTex) return noiseTex;
  const s = 128;
  const data = new Uint8Array(s * s * 4);
  for (let i = 0; i < s * s; i++) {
    const v = Math.floor(Math.random() * 256);
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  noiseTex = new THREE.DataTexture(data, s, s, THREE.RGBAFormat);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
  noiseTex.magFilter = THREE.NearestFilter;
  noiseTex.minFilter = THREE.NearestFilter;
  noiseTex.needsUpdate = true;
  return noiseTex;
}

function furMaterial() {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.86,
    metalness: 0,
    sheen: 0.7,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#ffe7c7"),
    envMapIntensity: 0.55,
  });
}

/** שכבת "פרווה": עותק מנופח מעט של המשטח, עם חורים לפי רעש */
function shellMaterial(h: number, len: number, density: THREE.Vector2) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.6 });
  m.defines = { USE_UV: "" };
  m.onBeforeCompile = (s) => {
    s.uniforms.uShell = { value: h };
    s.uniforms.uLen = { value: len };
    s.uniforms.uDensity = { value: density };
    s.uniforms.uNoise = { value: furNoise() };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uShell;\nuniform float uLen;\nattribute float aFur;\nvarying float vFur;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFur = aFur;\ntransformed += objectNormal * uShell * uLen * aFur;\ntransformed.y -= uShell * uShell * uLen * aFur * 0.35;",
      );
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uShell;\nuniform vec2 uDensity;\nuniform sampler2D uNoise;\nvarying float vFur;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nif (uShell > vFur) discard;\nfloat strand = texture2D(uNoise, vUv * uDensity).r;\nif (strand < 0.22 + uShell * 0.76) discard;\ndiffuseColor.rgb *= mix(0.88, 1.06, uShell);",
      );
  };
  return m;
}

function addFur(mesh: THREE.Mesh, len: number, density: [number, number], shells: number, list: THREE.Material[]) {
  const d = new THREE.Vector2(density[0], density[1]);
  for (let i = 1; i <= shells; i++) {
    const mat = shellMaterial(i / shells, len, d);
    list.push(mat);
    const s = new THREE.Mesh(mesh.geometry, mat);
    s.castShadow = false;
    s.receiveShadow = false;
    mesh.add(s);
  }
}

// ---------- בניית הכלב ----------

interface Eye {
  socket: THREE.Group;
  ball: THREE.Group;
  upper: THREE.Mesh;
  lower: THREE.Mesh;
  brow: THREE.Mesh;
  browBase: THREE.Vector3;
  side: number;
}

interface Spring {
  v: number;
  x: number;
}

const spring = (): Spring => ({ v: 0, x: 0 });

function stepSpring(s: Spring, target: number, k: number, c: number, dt: number, force = 0) {
  const a = -k * (s.x - target) - c * s.v + force;
  s.v += a * dt;
  s.x += s.v * dt;
}

interface Params {
  upper: number; // 0 פתוח, 1 סגור
  lower: number; // 0 פתוח, 1 עיניים מחייכות
  brow: number; // הטיה (עצוב +)
  browUp: number;
  mouth: number; // פתיחת פה
  wagHz: number;
  wagAmp: number;
  droop: number;
}

const MOOD_PARAMS: Record<Mood, Params> = {
  calm: { upper: 0.34, lower: 0.15, brow: 0, browUp: 0, mouth: 0.15, wagHz: 1.1, wagAmp: 0.32, droop: 0 },
  happy: { upper: 0.28, lower: 0.42, brow: -0.05, browUp: 0.02, mouth: 0.75, wagHz: 2.1, wagAmp: 0.45, droop: 0 },
  ecstatic: { upper: 0.2, lower: 0.62, brow: -0.08, browUp: 0.035, mouth: 1, wagHz: 3.4, wagAmp: 0.55, droop: -0.05 },
  hungry: { upper: 0.38, lower: 0.1, brow: 0.28, browUp: 0.02, mouth: 0.45, wagHz: 1.4, wagAmp: 0.3, droop: 0.04 },
  bored: { upper: 0.6, lower: 0.12, brow: 0.22, browUp: -0.01, mouth: 0, wagHz: 0.45, wagAmp: 0.16, droop: 0.12 },
  sleepy: { upper: 1, lower: 0.2, brow: 0.1, browUp: -0.015, mouth: 0, wagHz: 0, wagAmp: 0, droop: 0.22 },
};

export class DogScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  private root = new THREE.Group();
  private body = new THREE.Group();
  private headPivot = new THREE.Group();
  private head = new THREE.Group();
  private torso!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private furMeshes: THREE.Mesh[] = [];
  private earPivots: THREE.Group[] = [];
  private earMeshes: THREE.Mesh[] = [];
  private tailPivot = new THREE.Group();
  private tailMesh!: THREE.Mesh;
  private tagPivot = new THREE.Group();
  private eyes: Eye[] = [];
  private mouthOpen = new THREE.Group();
  private tongue = new THREE.Group();
  private paws: THREE.Mesh[] = [];
  private legs: THREE.Mesh[] = [];
  private nose!: THREE.Mesh;
  private shadowBlob!: THREE.Mesh;
  private lidMats: THREE.MeshPhysicalMaterial[] = [];
  private browMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  private furMat!: THREE.MeshPhysicalMaterial;
  private noseMat = new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  private materials: THREE.Material[] = [];
  private keyLight = new THREE.DirectionalLight(0xfff0dc, 2.5);
  private rimLight = new THREE.DirectionalLight(0xffe0b5, 2.4);
  private fillLight = new THREE.DirectionalLight(0xe2ebff, 0.35);
  private hemi = new THREE.HemisphereLight(0xfff4e6, 0x6a4a32, 0.38);
  private lamp = new THREE.PointLight(0xffb866, 0, 12, 2);
  private framing: Framing;
  private raf = 0;
  private last = 0;
  private time = 0;
  private visible = true;
  private running = false;
  private reduced = false;

  // מצב אנימציה
  private mood: Mood = "calm";
  private p: Params = { ...MOOD_PARAMS.calm };
  private excitedUntil = 0;
  private jumpT = -1;
  private target = new THREE.Vector2();
  private targetActive = false;
  private gaze = new THREE.Vector2();
  private wander = new THREE.Vector2();
  private nextWander = 0;
  private blinkAt = 1.5;
  private blinkT = -1;
  private tiltT = -1;
  private tiltDir = 1;
  private nextTilt = 4;
  private wagPhase = 0;
  private breath = 0;
  private ears = [spring(), spring()];
  private earsX = [spring(), spring()];
  private tag = spring();
  private prevHeadRotZ = 0;
  private prevRootY = 0;
  private lickT = -1;
  private nextLick = 3;
  private activeUntil = 3;
  private lastFrame = 0;

  constructor(canvas: HTMLCanvasElement, look: DogLook, opts: { framing?: Framing; fur?: boolean; shadows?: boolean; preserve?: boolean } = {}) {
    this.framing = opts.framing ?? "stage";
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: !!opts.preserve,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const shadows = opts.shadows ?? true;
    this.renderer.shadowMap.enabled = shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.32;

    this.keyLight.position.set(-4, 5.5, 5);
    this.keyLight.shadow.radius = 5;
    this.keyLight.castShadow = shadows;
    this.keyLight.shadow.mapSize.set(512, 512);
    this.keyLight.shadow.camera.left = -3;
    this.keyLight.shadow.camera.right = 3;
    this.keyLight.shadow.camera.top = 4;
    this.keyLight.shadow.camera.bottom = -1;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.bias = -0.0008;
    this.keyLight.shadow.normalBias = 0.02;
    this.rimLight.position.set(3.5, 4.5, -5);
    this.fillLight.position.set(5, 2, 4);
    this.lamp.position.set(2.6, 2.4, 2.2);
    this.scene.add(this.keyLight, this.rimLight, this.fillLight, this.hemi, this.lamp);

    this.build(opts.fur ?? true);
    this.setLook(look);
    this.scene.add(this.root);
    this.applyFraming(1);
  }

  // ---------- בנייה ----------

  private mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = false;
    return m;
  }

  private build(fur: boolean) {
    const furMat = furMaterial();
    this.furMat = furMat;
    this.materials.push(furMat, this.browMat, this.noseMat);
    const shellList: THREE.Material[] = [];

    // גוף יושב
    const torsoGeo = blob((p) => {
      const widen = 1 + 0.24 * smooth(0.25, -0.95, p.y);
      const q = v3(p.x * widen, p.y, p.z * (1 + (widen - 1) * 0.35) * 0.95);
      q.z += 0.16 * Math.max(0, p.z) * Math.exp(-((p.y - 0.25) ** 2) / 0.16);
      return q;
    }, 48, 36);
    torsoGeo.scale(0.8, 0.98, 0.74);
    this.torso = this.mesh(torsoGeo, furMat);
    this.torso.userData.part = "torso";
    this.torso.position.set(0, 1.0, -0.18);
    this.torso.rotation.x = -0.08;
    this.body.add(this.torso);
    this.furMeshes.push(this.torso);
    if (fur) addFur(this.torso, 0.045, [70, 36], 5, shellList);

    // ירכיים ורגליים אחוריות
    for (const s of [-1, 1]) {
      const hg = blob((p) => p, 32, 24);
      hg.scale(0.42, 0.36, 0.56);
      const haunch = this.mesh(hg, furMat);
      haunch.userData.part = "haunch";
      haunch.position.set(0.5 * s, 0.37, -0.16);
      haunch.rotation.y = 0.25 * s;
      this.body.add(haunch);
      this.furMeshes.push(haunch);
      if (fur) addFur(haunch, 0.035, [50, 26], 4, shellList);

      const bp = blob((p) => v3(p.x, p.y, p.z), 32, 24);
      bp.scale(0.2, 0.12, 0.28);
      const backPaw = this.mesh(bp, furMat);
      backPaw.userData.part = "paw";
      backPaw.position.set(0.62 * s, 0.1, 0.26);
      backPaw.rotation.y = 0.35 * s;
      this.body.add(backPaw);
      this.paws.push(backPaw);
      this.furMeshes.push(backPaw);
    }

    // רגליים קדמיות
    for (const s of [-1, 1]) {
      const lg = withColor(new THREE.CapsuleGeometry(0.175, 0.6, 10, 28));
      lg.userData.unit = null;
      lg.setAttribute("aFur", new THREE.BufferAttribute(new Float32Array(lg.attributes.position.count).fill(1), 1));
      const leg = this.mesh(lg, furMat);
      leg.userData.part = "leg";
      leg.position.set(0.25 * s, 0.5, 0.58);
      leg.rotation.z = -0.04 * s;
      leg.rotation.x = 0.06;
      this.body.add(leg);
      this.legs.push(leg);
      this.furMeshes.push(leg);
      if (fur) addFur(leg, 0.03, [14, 10], 3, shellList);

      const pg = blob((p) => v3(p.x, p.y < 0 ? p.y * 0.7 : p.y, p.z), 32, 24);
      pg.scale(0.22, 0.14, 0.27);
      const paw = this.mesh(pg, furMat);
      paw.userData.part = "paw";
      paw.position.set(0.26 * s, 0.1, 0.74);
      this.body.add(paw);
      this.paws.push(paw);
      this.furMeshes.push(paw);

    }

    // זנב
    const curve = new THREE.CatmullRomCurve3([v3(0.0, 0.0, 0.0), v3(0.38, 0.1, -0.06), v3(0.66, 0.42, -0.02), v3(0.72, 0.8, 0.1), v3(0.64, 1.02, 0.2)]);
    const tg = taperedTube(curve, 40, 18, (t) => lerp(0.17, 0.075, t) * (1 + 0.25 * Math.sin(Math.PI * t)));
    this.tailMesh = this.mesh(tg, furMat);
    this.tailMesh.userData.part = "tail";
    const tip = this.mesh(withColor(new THREE.SphereGeometry(0.078, 16, 12)), furMat);
    tip.userData.part = "tailTip";
    tip.position.copy(curve.getPointAt(1));
    this.tailMesh.add(tip);
    this.tailPivot.position.set(0.3, 0.38, -0.66);
    if (fur) addFur(this.tailMesh, 0.04, [18, 30], 4, shellList);
    this.tailPivot.add(this.tailMesh);
    this.body.add(this.tailPivot);
    this.furMeshes.push(this.tailMesh, tip);

    // ראש
    this.headPivot.position.set(0, 1.76, 0.06);
    this.body.add(this.headPivot);
    this.headPivot.add(this.head);

    const headGeo = blob((p) => {
      const d = p.dot(MUZ);
      const f = smooth(0.5, 1.0, d);
      const q = p.clone().addScaledVector(MUZ, f * 0.56);
      q.x *= 1 - 0.26 * f;
      q.y -= 0.05 * f;
      const cheek = Math.exp(-((p.y + 0.2) ** 2) / 0.07) * smooth(0.15, 0.75, Math.abs(p.x)) * smooth(-0.3, 0.5, p.z);
      q.x *= 1 + 0.09 * cheek;
      if (q.y > 0) q.y *= 0.95;
      const stop = Math.exp(-((p.y - 0.04) ** 2) / 0.014) * smooth(0.55, 0.95, p.z) * (1 - smooth(0.05, 0.32, Math.abs(p.x)));
      q.z -= 0.035 * stop;
      return q;
    }, 80, 60);
    headGeo.scale(0.92, 0.84, 0.86);
    this.headMesh = this.mesh(headGeo, furMat);
    this.headMesh.userData.part = "head";
    this.headMesh.position.set(0, 0.5, 0.05);
    this.head.add(this.headMesh);
    this.furMeshes.push(this.headMesh);
    const eyeDirs = [v3(-0.31, 0.07, 0.95).normalize(), v3(0.31, 0.07, 0.95).normalize()];
    furLength(headGeo, (u) =>
      Math.min(1 - 0.85 * smooth(0.7, 0.9, u.dot(MUZ)), ...eyeDirs.map((d) => 1 - smooth(0.962, 0.982, u.dot(d)))),
    );
    if (fur) addFur(this.headMesh, 0.032, [150, 76], 6, shellList);
    this.headMesh.updateMatrixWorld(true);

    const ray = new THREE.Raycaster();
    const center = this.headMesh.position.clone();
    const surface = (dir: THREE.Vector3) => {
      ray.set(center.clone().addScaledVector(dir, 3), dir.clone().negate());
      const hit = ray.intersectObject(this.headMesh, false)[0];
      const n = hit?.face?.normal.clone() ?? dir.clone();
      return { point: hit ? hit.point.clone() : center.clone().addScaledVector(dir, 0.9), normal: n.normalize() };
    };
    const front = (x: number, y: number) => {
      ray.set(v3(x, y, 5), v3(0, 0, -1));
      const hit = ray.intersectObject(this.headMesh, false)[0];
      return hit ? hit.point.clone() : v3(x, y, 1);
    };

    // עיניים
    const r = 0.21;
    const scleraMat = new THREE.MeshPhysicalMaterial({ color: "#fbf7f1", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 });
    const irisMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    this.materials.push(scleraMat, irisMat, glintMat);
    const IRIS = 0.95;
    const PUPIL = 0.38;
    const irisGeo = new THREE.SphereGeometry(r * 1.006, 64, 22, 0, Math.PI * 2, 0, IRIS);
    irisGeo.rotateX(Math.PI / 2);
    {
      const pos = irisGeo.attributes.position;
      const cols = new Float32Array(pos.count * 3);
      const pupil = new THREE.Color("#120b07");
      const inner = new THREE.Color("#a4642f");
      const outer = new THREE.Color("#6a3a1a");
      const limbal = new THREE.Color("#2e1a0e");
      const light = new THREE.Color("#d39a58");
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) / r;
        const y = pos.getY(i) / r;
        const z = pos.getZ(i) / r;
        const ang = Math.acos(clamp(z, -1, 1));
        if (ang < PUPIL) c.copy(pupil);
        else {
          const t = (ang - PUPIL) / (IRIS - PUPIL);
          c.copy(inner).lerp(outer, t);
          c.lerp(light, 0.45 * smooth(0.1, -0.7, y) * (1 - t));
          c.multiplyScalar(0.9 + 0.1 * Math.sin(Math.atan2(y, x) * 27));
          c.lerp(limbal, smooth(0.75, 1, t));
          c.lerp(pupil, smooth(0.08, 0, ang - PUPIL));
        }
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
      irisGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    }
    const lidGeo = new THREE.SphereGeometry(r * 1.045, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const lowerGeo = lidGeo.clone().rotateZ(Math.PI);

    for (const side of [-1, 1]) {
      const dir = v3(0.31 * side, 0.07, 0.95).normalize();
      const s = surface(dir);
      const socket = new THREE.Group();
      socket.position.copy(s.point).addScaledVector(s.normal, -r * 0.52);
      const out = s.normal.clone().lerp(v3(0.12 * side, 0, 1).normalize(), 0.6).normalize();
      socket.quaternion.setFromUnitVectors(v3(0, 0, 1), out);
      this.head.add(socket);

      const ball = new THREE.Group();
      socket.add(ball);
      ball.add(new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), scleraMat));
      ball.add(new THREE.Mesh(irisGeo, irisMat));

      // ברק בעין: נשאר במקום כשהעין זזה
      const g1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.2, 16, 12), glintMat);
      g1.position.copy(v3(-0.36, 0.42, 0.83).normalize().multiplyScalar(r * 1.02));
      g1.scale.set(1, 1.1, 0.35);
      g1.lookAt(g1.position.clone().multiplyScalar(3));
      const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 12, 10), glintMat);
      g2.position.copy(v3(0.3, -0.3, 0.9).normalize().multiplyScalar(r * 1.02));
      g2.scale.set(1, 1, 0.35);
      g2.lookAt(g2.position.clone().multiplyScalar(3));
      socket.add(g1, g2);

      const lidMat = new THREE.MeshPhysicalMaterial({ roughness: 0.9, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffe7c7") });
      this.lidMats.push(lidMat);
      this.materials.push(lidMat);
      const upper = new THREE.Mesh(lidGeo, lidMat);
      const lower = new THREE.Mesh(lowerGeo, lidMat);
      socket.add(upper, lower);

      // גבה
      const bs = surface(v3(0.3 * side, 0.36, 0.88).normalize());
      const bg = new THREE.CapsuleGeometry(0.03, 0.11, 6, 14);
      bg.rotateZ(Math.PI / 2);
      bg.scale(1, 1, 0.4);
      const brow = new THREE.Mesh(bg, this.browMat);
      const browBase = bs.point.clone().addScaledVector(bs.normal, 0.026);
      brow.position.copy(browBase);
      brow.quaternion.setFromUnitVectors(v3(0, 0, 1), bs.normal);
      brow.userData.q = brow.quaternion.clone();
      this.head.add(brow);
      this.eyes.push({ socket, ball, upper, lower, brow, browBase, side });
    }

    // אף
    const noseGeo = blob((p) => {
      const q = p.clone();
      q.x *= 1 - 0.32 * smooth(0, -1, p.y);
      if (p.y > 0) q.y *= 0.85;
      return q;
    }, 40, 28);
    noseGeo.scale(0.2, 0.135, 0.15);
    this.nose = this.mesh(noseGeo, this.noseMat);
    const noseAt = surface(v3(0, -0.2, 1).normalize());
    this.nose.position.copy(noseAt.point).addScaledVector(noseAt.normal, -0.02);
    this.nose.lookAt(this.nose.position.clone().add(noseAt.normal));
    this.nose.rotateX(-0.25);
    this.head.add(this.nose);

    // פה: קו חיוך, פה פתוח (משטח כהה שמונח על הלוע) ולשון
    const mouthMat = new THREE.MeshStandardMaterial({ color: "#3a2219", roughness: 0.6 });
    this.materials.push(mouthMat);
    const ny = this.nose.position.y - 0.115;
    const smile = (side: number) => {
      const pts = [front(0, ny + 0.01), front(0, ny - 0.07), front(0.08 * side, ny - 0.112), front(0.16 * side, ny - 0.102), front(0.22 * side, ny - 0.066)];
      pts.forEach((p) => (p.z += 0.006));
      return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.019, 8), mouthMat);
    };
    this.head.add(smile(-1), smile(1));

    const cavityMat = new THREE.MeshStandardMaterial({ color: "#4f1a20", roughness: 0.75 });
    const tongueMat = new THREE.MeshPhysicalMaterial({ color: "#ff7f93", roughness: 0.35, clearcoat: 0.5 });
    this.materials.push(cavityMat, tongueMat);
    const topY = ny - 0.07;
    const shape = new THREE.Shape();
    shape.moveTo(-0.17, -0.03);
    shape.bezierCurveTo(-0.12, -0.05, -0.04, -0.04, 0, 0);
    shape.bezierCurveTo(0.04, -0.04, 0.12, -0.05, 0.17, -0.03);
    shape.bezierCurveTo(0.15, -0.12, 0.08, -0.175, 0, -0.175);
    shape.bezierCurveTo(-0.08, -0.175, -0.15, -0.12, -0.17, -0.03);
    const mg = new THREE.ShapeGeometry(shape, 24);
    {
      const pos = mg.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = front(x, y + topY).z + 0.004;
        pos.setXYZ(i, x, y, z);
      }
      mg.computeVertexNormals();
    }
    const cavity = new THREE.Mesh(mg, cavityMat);
    this.mouthOpen.position.set(0, topY, 0);
    this.mouthOpen.add(cavity);
    const tongueGeo = new THREE.CapsuleGeometry(0.075, 0.1, 8, 20);
    tongueGeo.translate(0, -0.085, 0);
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.scale.set(1, 1, 0.38);
    const groove = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.08, 4, 8), new THREE.MeshStandardMaterial({ color: "#e45d78", roughness: 0.5 }));
    groove.position.set(0, -0.08, 0.03);
    tongueMesh.add(groove);
    this.tongue.add(tongueMesh);
    this.tongue.position.set(0, -0.07, front(0, topY - 0.07).z + 0.02);
    this.tongue.rotation.x = 0.25;
    this.mouthOpen.add(this.tongue);
    this.head.add(this.mouthOpen);

    // אוזניים
    for (const side of [-1, 1]) {
      const a = surface(v3(0.84 * side, 0.44, 0.1).normalize());
      const pivot = new THREE.Group();
      pivot.position.copy(a.point).addScaledVector(a.normal, -0.06);
      const eg = blob((p) => {
        const q = p.clone();
        q.z += 0.22 * (p.y + 1) ** 2 * 0.25;
        q.x += 0.06 * side * (1 - p.y);
        return q;
      }, 32, 24);
      eg.scale(0.32, 0.7, 0.13);
      eg.translate(0, -0.6, 0);
      const ear = this.mesh(eg, furMat);
      ear.userData.part = "ear";
      ear.rotation.y = -0.15 * side;
      pivot.add(ear);
      this.head.add(pivot);
      this.earPivots.push(pivot);
      this.earMeshes.push(ear);
      this.furMeshes.push(ear);
      if (fur) addFur(ear, 0.028, [36, 40], 5, shellList);
    }

    // קולר ותג
    const collarMat = new THREE.MeshPhysicalMaterial({ color: "#ff6b57", roughness: 0.45, clearcoat: 0.6 });
    const tagMat = new THREE.MeshPhysicalMaterial({ color: "#f6c744", metalness: 0.85, roughness: 0.28 });
    this.materials.push(collarMat, tagMat);
    const collar = this.mesh(new THREE.TorusGeometry(0.7, 0.065, 18, 72), collarMat);
    collar.rotation.x = Math.PI / 2 - 0.2;
    collar.scale.set(1, 1.0, 1);
    collar.position.set(0, 1.4, -0.16);
    this.body.add(collar);
    this.tagPivot.position.set(0, 1.3, 0.56);
    const tag = this.mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 32), tagMat);
    tag.rotation.x = Math.PI / 2 - 0.3;
    tag.position.set(0, -0.1, 0.02);
    const ring = this.mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 20), tagMat);
    ring.position.set(0, -0.01, 0.0);
    this.tagPivot.add(tag, ring);
    this.body.add(this.tagPivot);

    this.root.add(this.body);
    this.materials.push(...shellList);

    // צל רך על הרצפה
    const sc = document.createElement("canvas");
    sc.width = sc.height = 128;
    const ctx = sc.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(40,24,10,0.55)");
    g.addColorStop(0.55, "rgba(40,24,10,0.22)");
    g.addColorStop(1, "rgba(40,24,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const blobTex = new THREE.CanvasTexture(sc);
    const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
    this.materials.push(blobMat);
    this.shadowBlob = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), blobMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.set(0.05, 0.004, 0.1);
    this.scene.add(this.shadowBlob);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.materials.push(ground.material as THREE.Material);
    this.scene.add(ground);
  }

  // ---------- מראה ----------

  setLook(look: DogLook) {
    const f = FUR[look.coat];
    const base = new THREE.Color(f.base);
    const light = new THREE.Color(f.light);
    const dark = new THREE.Color(f.dark);
    const spots = look.pattern === "spots";
    const patch = look.pattern === "patch";
    const mix = (out: THREE.Color, c: THREE.Color, w: number) => out.lerp(c, clamp(w, 0, 1));
    const spotW = (u: THREE.Vector3, list: [THREE.Vector3, number][]) =>
      list.reduce((w, [d, s]) => Math.max(w, smooth(1 - s, 1 - s * 0.55, u.dot(d))), 0);

    paint(this.headMesh.geometry, (u, c) => {
      c.copy(base);
      mix(c, dark, 0.18 * smooth(0.45, 1, u.y));
      mix(c, light, 0.9 * smooth(0.6, 0.86, u.dot(MUZ)));
      mix(c, light, 0.45 * smooth(0.35, 0.75, -u.y) * smooth(0.1, 0.7, u.z));
      if (patch) mix(c, dark, smooth(0.84, 0.92, u.dot(PATCH) + 0.025 * Math.sin(u.x * 9) * Math.cos(u.y * 7)));
      if (spots) mix(c, dark, spotW(u, HEAD_SPOTS));
    });
    paint(this.torso.geometry, (u, c) => {
      c.copy(base);
      mix(c, light, 0.55 * smooth(0.35, 0.85, u.z) * smooth(0.8, -0.1, u.y));
      mix(c, dark, 0.22 * smooth(0.2, 0.9, -u.z));
      if (spots) mix(c, dark, spotW(u, BODY_SPOTS));
    });
    for (const m of this.furMeshes) {
      const part = m.userData.part as string | undefined;
      if (part === "head" || part === "torso") continue;
      if (part === "ear") {
        paint(m.geometry, (u, c) => {
          c.copy(base);
          mix(c, dark, 0.5 + 0.5 * smooth(0.6, -0.9, u.y));
        });
      } else if (part === "paw") {
        paint(m.geometry, (_u, c) => {
          c.copy(base);
          mix(c, light, 0.45);
        });
      } else if (part === "tail") {
        const uv = m.geometry.attributes.uv;
        const col = m.geometry.attributes.color as THREE.BufferAttribute;
        const c = new THREE.Color();
        for (let i = 0; i < col.count; i++) {
          c.copy(base);
          mix(c, light, smooth(0.75, 1, uv.getY(i)));
          col.setXYZ(i, c.r, c.g, c.b);
        }
        col.needsUpdate = true;
      } else if (part === "tailTip") {
        paint(m.geometry, (_u, c) => c.copy(light));
      } else if (part === "leg") {
        paint(m.geometry, (_u, c) => {
          c.copy(base);
          mix(c, light, 0.12);
        });
      } else {
        paint(m.geometry, (u, c) => {
          c.copy(base);
          if (spots) mix(c, dark, spotW(u, BODY_SPOTS));
        });
      }
    }
    this.lidMats.forEach((mat, i) => mat.color.copy(patch && this.eyes[i]?.side === 1 ? dark : base).multiplyScalar(0.9));
    this.browMat.color.set(f.brow);
    this.furMat.sheenColor.copy(light).multiplyScalar(0.55);
    this.lidMats.forEach((m) => m.sheenColor.copy(light).multiplyScalar(0.4));
    this.noseMat.color.set(f.nose);
    this.render();
  }

  // ---------- התנהגות ----------

  setMood(mood: Mood) {
    this.mood = mood;
  }

  setReducedMotion(r: boolean) {
    this.reduced = r;
  }

  /** ליטוף: קפיצת שמחה */
  pet() {
    this.excitedUntil = this.time + 2.6;
    this.activeUntil = this.time + 4;
    if (this.reduced) return;
    if (this.jumpT < 0) this.jumpT = 0;
  }

  /** מבט לעבר נקודה במסך (-1..1), או null לשחרור */
  lookAt(x: number | null, y = 0) {
    if (x === null) {
      this.targetActive = false;
      return;
    }
    this.targetActive = true;
    this.activeUntil = this.time + 3;
    this.target.set(clamp(x, -1.2, 1.2), clamp(y, -1, 1));
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v && this.running && !this.raf) this.loop(performance.now());
  }

  // ---------- מצלמה ----------

  private applyFraming(aspect: number) {
    const cam = this.camera;
    cam.aspect = aspect;
    if (this.framing === "face") {
      cam.fov = 22;
      cam.position.set(0, 2.42, 6.2);
      cam.lookAt(0, 2.26, 0.2);
    } else {
      cam.fov = 24;
      // מרחק שמבטיח שהכלב כולו נכנס, גם במסך צר. בבמה בבית נשאר מקום לבועה ולמד מצב הרוח
      const stage = this.framing === "stage";
      const h = stage ? 4.7 : 3.6;
      const w = stage ? 3.4 : 2.9;
      const vFov = THREE.MathUtils.degToRad(cam.fov);
      const distH = h / 2 / Math.tan(vFov / 2);
      const distW = w / 2 / Math.tan(vFov / 2) / aspect;
      const dist = Math.max(distH, distW);
      const cy = stage ? 1.65 : 1.5;
      cam.position.set(0, cy + dist * 0.06, dist);
      cam.lookAt(0, cy, 0);
    }
    cam.updateProjectionMatrix();
  }

  resize(w: number, h: number, dpr = Math.min(window.devicePixelRatio || 1, 2)) {
    if (!w || !h) return;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.applyFraming(w / h);
    this.render();
  }

  setPhase(phase: "morning" | "day" | "evening" | "night") {
    const key = { morning: [0xfff2df, 2.5], day: [0xffffff, 2.7], evening: [0xffc98f, 2.2], night: [0x9fb2ff, 0.7] } as const;
    const [c, i] = key[phase];
    this.keyLight.color.setHex(c);
    this.keyLight.intensity = i;
    this.rimLight.intensity = phase === "night" ? 0.9 : 2.4;
    this.rimLight.color.setHex(phase === "evening" ? 0xffb070 : phase === "night" ? 0x8fa2ff : 0xffe0b5);
    this.hemi.intensity = phase === "night" ? 0.25 : 0.5;
    this.scene.environmentIntensity = phase === "night" ? 0.2 : 0.4;
    this.lamp.intensity = phase === "night" ? 26 : phase === "evening" ? 6 : 0;
    this.render();
  }

  // ---------- לולאה ----------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.loop(this.last);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.running || !this.visible) return;
    // בזמן מנוחה מספיקים 30 פריימים בשנייה (חוסך סוללה)
    const idle = this.time > this.activeUntil && this.jumpT < 0;
    if (idle && now - this.lastFrame < 30) {
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    this.lastFrame = now;
    const dt = clamp((now - this.last) / 1000, 0, 0.05);
    this.last = now;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** עדכון האנימציה לפי זמן */
  update(dt: number) {
    this.time += dt;
    const t = this.time;
    const excited = t < this.excitedUntil && this.mood !== "sleepy";
    const mood: Mood = excited ? "ecstatic" : this.mood;
    const target = MOOD_PARAMS[mood];
    const k = 5;
    for (const key of Object.keys(target) as (keyof Params)[]) this.p[key] = damp(this.p[key], target[key], k, dt);
    const p = this.p;
    const calmFactor = this.reduced ? 0.35 : 1;

    // נשימה
    const breathHz = mood === "sleepy" ? 0.2 : mood === "ecstatic" ? 1.6 : mood === "happy" ? 0.7 : 0.32;
    this.breath += dt * breathHz * Math.PI * 2;
    const br = Math.sin(this.breath);
    this.torso.scale.set(1 - 0.01 * br, 1 + 0.022 * br, 1 + 0.016 * br);

    // קפיצה עם מעיכה ומתיחה
    let jy = 0;
    let sy = 1;
    if (this.jumpT >= 0) {
      this.jumpT += dt;
      const u = this.jumpT;
      if (u < 0.14) {
        const q = u / 0.14;
        sy = 1 - 0.1 * Math.sin((q * Math.PI) / 2);
      } else if (u < 0.62) {
        const q = (u - 0.14) / 0.48;
        jy = 0.75 * Math.sin(q * Math.PI);
        sy = 1 + 0.08 * Math.cos(q * Math.PI);
      } else if (u < 0.8) {
        const q = (u - 0.62) / 0.18;
        sy = 1 - 0.12 * Math.sin(q * Math.PI);
      } else if (u < 1.0) {
        const q = (u - 0.8) / 0.2;
        sy = 1 + 0.03 * Math.sin(q * Math.PI);
      } else this.jumpT = -1;
    }
    // קפיצונים קטנים בהתרגשות
    if (excited && this.jumpT < 0 && !this.reduced) jy += 0.05 * Math.max(0, Math.sin(t * 9));
    this.root.position.y = jy;
    this.root.scale.set(1 + (1 - sy) * 0.5, sy, 1 + (1 - sy) * 0.5);
    const rootVel = (jy - this.prevRootY) / Math.max(dt, 1e-3);
    this.prevRootY = jy;
    this.shadowBlob.scale.setScalar(1 - jy * 0.35);
    (this.shadowBlob.material as THREE.MeshBasicMaterial).opacity = 1 - jy * 0.6;

    // מבט
    if (t > this.nextWander) {
      this.nextWander = t + 1.6 + Math.random() * 2.6;
      const atViewer = Math.random() < 0.55;
      this.wander.set(atViewer ? 0 : (Math.random() - 0.5) * 1.1, atViewer ? 0 : (Math.random() - 0.4) * 0.6);
    }
    const goal = this.targetActive ? this.target : this.wander;
    this.gaze.x = damp(this.gaze.x, goal.x, this.targetActive ? 9 : 4, dt);
    this.gaze.y = damp(this.gaze.y, goal.y, this.targetActive ? 9 : 4, dt);

    // הטיית ראש סקרנית
    if (this.tiltT < 0 && t > this.nextTilt && mood !== "sleepy") {
      this.tiltT = 0;
      this.tiltDir = Math.random() < 0.5 ? -1 : 1;
    }
    let tilt = 0;
    if (this.tiltT >= 0) {
      this.tiltT += dt;
      const d = 2.2;
      const q = this.tiltT / d;
      tilt = this.tiltDir * 0.3 * (q < 0.25 ? easeInOut(q / 0.25) : q < 0.75 ? 1 : 1 - easeInOut((q - 0.75) / 0.25));
      if (q >= 1) {
        this.tiltT = -1;
        this.nextTilt = t + 5 + Math.random() * 5;
      }
    }
    const sway = Math.sin(t * 0.8) * 0.035 + Math.sin(t * 1.7) * 0.015;
    this.headPivot.rotation.y = this.gaze.x * 0.42 * calmFactor;
    this.headPivot.rotation.x = -this.gaze.y * 0.22 + p.droop + 0.02 * br + (excited ? -0.08 : 0);
    this.headPivot.rotation.z = tilt * calmFactor + sway * calmFactor;
    this.headPivot.position.y = 1.76 + 0.012 * br;
    const headRotVel = (this.headPivot.rotation.z - this.prevHeadRotZ) / Math.max(dt, 1e-3);
    this.prevHeadRotZ = this.headPivot.rotation.z;

    // עיניים, עפעפיים ומצמוץ
    if (t > this.blinkAt && this.blinkT < 0) this.blinkT = 0;
    let blink = 0;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const q = this.blinkT;
      blink = q < 0.07 ? q / 0.07 : q < 0.11 ? 1 : q < 0.24 ? 1 - (q - 0.11) / 0.13 : 0;
      if (q >= 0.24) {
        this.blinkT = -1;
        this.blinkAt = t + (Math.random() < 0.2 ? 0.25 : 2.2 + Math.random() * 3.5);
      }
    }
    const upperClose = Math.max(p.upper, blink);
    for (const e of this.eyes) {
      e.ball.rotation.y = this.gaze.x * 0.38;
      e.ball.rotation.x = -this.gaze.y * 0.3;
      e.upper.rotation.x = lerp(-1.3, 0.42, upperClose);
      e.lower.rotation.x = lerp(1.2, 0.28, p.lower * (1 - blink * 0.3));
      e.brow.position.copy(e.browBase);
      e.brow.position.y += p.browUp + (excited ? 0.02 : 0);
      e.brow.quaternion.copy(e.brow.userData.q as THREE.Quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 0, 1), -e.side * p.brow));
    }

    // פה ולשון
    let lick = 0;
    if (mood === "hungry" && t > this.nextLick && this.lickT < 0) this.lickT = 0;
    if (this.lickT >= 0) {
      this.lickT += dt;
      lick = Math.sin(Math.min(1, this.lickT / 0.6) * Math.PI);
      if (this.lickT > 0.6) {
        this.lickT = -1;
        this.nextLick = t + 2 + Math.random() * 3;
      }
    }
    const open = clamp(p.mouth, 0, 1);
    const pant = mood === "ecstatic" || mood === "happy" ? Math.sin(t * (mood === "ecstatic" ? 14 : 8)) : 0;
    this.mouthOpen.scale.set(0.75 + 0.25 * open, Math.max(0.001, open * (1 + 0.06 * pant)), 1);
    this.mouthOpen.visible = open > 0.03;
    this.tongue.visible = open > 0.35 || lick > 0.05;
    this.tongue.scale.set(1, (0.7 + 0.45 * open + 0.12 * pant + 0.6 * lick) / Math.max(0.2, open), 1);
    this.tongue.rotation.x = 0.25 - 0.3 * lick;

    // זנב
    this.wagPhase += dt * p.wagHz * Math.PI * 2 * calmFactor;
    this.tailPivot.rotation.y = Math.sin(this.wagPhase) * p.wagAmp;
    this.tailPivot.rotation.z = -0.1 + Math.sin(this.wagPhase * 0.5) * 0.05;

    // אוזניים עם קפיץ: מגיבות לקפיצה ולתנועת הראש
    this.earPivots.forEach((pivot, i) => {
      const side = i === 0 ? -1 : 1;
      const restZ = 0.16 * side - (mood === "bored" || mood === "sleepy" ? 0.06 * side : 0);
      stepSpring(this.ears[i], restZ, 90, 7, dt, -headRotVel * 1.4 + side * rootVel * 2.2);
      stepSpring(this.earsX[i], mood === "ecstatic" ? -0.1 : 0.06, 80, 6, dt, -rootVel * 1.8);
      pivot.rotation.z = this.ears[i].x;
      pivot.rotation.x = this.earsX[i].x;
    });

    // תג מתנדנד
    stepSpring(this.tag, 0, 60, 3, dt, -rootVel * 3 - headRotVel * 0.6);
    this.tagPivot.rotation.z = this.tag.x * 0.6;
    this.tagPivot.rotation.x = this.tag.x * 0.3;
  }

  /** תמונת מצב (לאווטרים) */
  snapshot(): string {
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }

  dispose() {
    this.stop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry?.dispose();
    });
    for (const m of this.materials) m.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

let support: boolean | null = null;
export function webglSupported() {
  if (support !== null) return support;
  try {
    const c = document.createElement("canvas");
    support = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    support = false;
  }
  return support;
}

// ---------- תמונות מצב משותפות (אווטרים ותצוגות קטנות) ----------

let shared: { scene: DogScene; canvas: HTMLCanvasElement } | null = null;
const cache = new Map<string, string>();

export function peekDogSnapshot(look: DogLook, framing: "face" | "full", size = 256) {
  return cache.get(`${look.coat}-${look.pattern}-${framing}-${size}`) ?? null;
}

export function dogSnapshot(look: DogLook, framing: "face" | "full", size = 256): string | null {
  const key = `${look.coat}-${look.pattern}-${framing}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!webglSupported()) return null;
  try {
    if (!shared) {
      const canvas = document.createElement("canvas");
      const scene = new DogScene(canvas, look, { framing, fur: true, shadows: false, preserve: true });
      shared = { scene, canvas };
    }
    const s = shared.scene;
    s.setLook(look);
    (s as unknown as { framing: Framing }).framing = framing;
    s.setMood("happy");
    s.resize(size, size, 1);
    for (let i = 0; i < 40; i++) s.update(1 / 30);
    const url = s.snapshot();
    cache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

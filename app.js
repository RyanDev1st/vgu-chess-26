// Winner page. The chip in each card opens ?c=1 .. ?c=4 (add &demo for sample data).
// What it is for: challenge the winner online, prove the title (verified record + Add to LinkedIn), keep the card (save image),
// and see the run of five games. The card hangs on a lanyard (after the Vercel Ship 2024 badge): drag to swing, tap to turn over.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { drawFront, drawBack, fontsReady, loadImage, TIERS, W, H } from "./card.js?v=5";

// ?debug shows what this device is doing (for checking phones we cannot plug in)
const VERSION = "5", dbg = [];
const note = m => { dbg.push(m); const b = document.querySelector("#debug"); if (b) b.textContent = dbg.join("\n"); };
if (new URLSearchParams(location.search).has("debug")) {
  const b = Object.assign(document.createElement("pre"), { id: "debug" }); document.body.append(b);
  addEventListener("error", e => note("error: " + e.message)); addEventListener("unhandledrejection", e => note("error: " + (e.reason?.message || e.reason)));
  note("version " + VERSION + " | " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90));
}

const q = new URLSearchParams(location.search);
const id = ["1", "2", "3", "4"].includes(q.get("c")) ? q.get("c") : "1";
const demo = q.has("demo") ? "&demo" : "";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const half = p => String(p).replace(/\.5$/, "½");

// ---------- data ----------
await fontsReady();
const data = await fetch(demo ? "winners.demo.json" : "winners.json", { cache: "no-store" }).then(r => r.json()).catch(() => ({ cards: {} }));
const card = { rank: Number(id), ...(data.cards?.[id] || {}) };
const t = TIERS[card.rank];
const photo = card.photo ? await loadImage(card.photo).catch(() => null) : null;
note("photo: " + (photo ? photo.naturalWidth + "x" + photo.naturalHeight : "NOT LOADED"));
const given = (card.name || "").trim().split(/\s+/).pop() || "the winner";

document.documentElement.style.setProperty("--tier", t.line);
document.title = card.name ? `${card.name}, ${t.label.toLowerCase()}. VGU Chess 26` : "VGU Chess 26";

// ---------- the page: who, proof, what you can do ----------
const title = l => l[0] + l.slice(1).toLowerCase();   // "RUNNER-UP" → "Runner-up"
$("#place").textContent = `${title(t.label)}, Sport Week 2026`;
$("#name").textContent = card.name || "To be decided";
$("#meta").textContent = [card.major, card.intake && `${card.intake} intake`].filter(Boolean).join(", ");
$("#verified").textContent = card.name
  ? "Verified by Castlevania Club, 19.11.2026"
  : "This card is issued after the final round";

const challenge = card.lichess ? { href: `https://lichess.org/?user=${encodeURIComponent(card.lichess)}#friend`, site: "Lichess" }
  : card.chesscom ? { href: `https://www.chess.com/play/online/new?opponent=${encodeURIComponent(card.chesscom)}`, site: "Chess.com" } : null;
if (challenge && card.name) {   // the reason a stranger stays: play the winner
  const a = $("#challenge"); a.href = challenge.href; a.target = "_blank"; a.rel = "noopener";
  a.querySelector("span").textContent = `Challenge ${given} on ${challenge.site}`;
  $("#dare").textContent = `Opens ${challenge.site} with a game offer to ${card.lichess || card.chesscom}.`;
  $("#actions").hidden = false;
}
if (data.club) { $("#club").href = data.club; $("#club").hidden = false; }

// the winner's own tools, behind "This is my card"
const certName = `${title(t.label)}, VGU Sport Week 2026 Chess Tournament`;
$("#linkedin").href = "https://www.linkedin.com/profile/add?" + new URLSearchParams({
  startTask: "CERTIFICATION_NAME", name: certName, organizationName: "Castlevania Club, Vietnamese-German University",
  issueYear: "2026", issueMonth: "11", certUrl: location.origin + location.pathname + `?c=${id}`, certId: `VGU-CHESS-26-${id}`,
});
if (card.name) $("#owner").hidden = false;

$("#save").onclick = async () => {
  const hi = drawFront(document.createElement("canvas"), card, photo, 300 / 25.4);
  const blob = await new Promise(r => hi.toBlob(r, "image/png"));
  const file = new File([blob], `vgu-chess-26-${id}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] }).catch(() => {});
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: file.name }).click();
};

if (card.rounds?.length) {   // a chess scoresheet: 1 for a win, ½ for a draw, 0 for a loss
  const pts = { W: "1", D: "½", L: "0" };
  $("#run").innerHTML = card.rounds.map((r, i) =>
    `<tr class="${esc(r.res)}"><td class="r">R${i + 1}</td><td>${esc(r.opp)}</td><td class="res">${pts[r.res] ?? ""}</td></tr>`).join("");
  $("#total").textContent = half(card.points ?? card.rounds.reduce((s, r) => s + ({ W: 1, D: .5 }[r.res] || 0), 0));
  $("#runWrap").hidden = false;
}

// this year's four, as the real cards (trim area only, no print bleed)
const thumb = async (n, c) => {
  const k = 7, src = drawFront(document.createElement("canvas"), { rank: Number(n), ...c }, c.photo ? await loadImage(c.photo).catch(() => null) : null, k);
  const out = Object.assign(document.createElement("canvas"), { width: Math.round((W - 4) * k), height: Math.round((H - 4) * k) });
  out.getContext("2d").drawImage(src, 2 * k, 2 * k, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", .86);
};
const four = await Promise.all(["1", "2", "3", "4"].map(async n => {
  const c = data.cards?.[n] || {};
  return `<a href="?c=${n}${demo}" ${n === id ? 'aria-current="page"' : ""}>
    <img src="${await thumb(n, c)}" alt="${esc(c.name || TIERS[n].label)}'s card" loading="lazy">
    <span class="pn">${esc(c.name || "To be decided")}</span><span class="pl">${title(TIERS[n].label)}</span></a>`;
}));
$("#podium").innerHTML = four.join("");
{ const nav = $("#podium"), cur = nav.querySelector("[aria-current]"); if (cur) nav.scrollLeft = cur.getBoundingClientRect().left - nav.getBoundingClientRect().left - 22; }

// ---------- the card in 3D ----------
const frontCv = drawFront(document.createElement("canvas"), card, photo, 16);
const backCv = drawBack(document.createElement("canvas"), card, photo, 16);
const canvas = $("#gl");
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch (e) { note("webgl: OFF, showing the flat card"); flatCard(); throw new Error("no webgl (flat card shown)"); }
renderer.debug.onShaderError = (gl, prog, vs, fs) => note("shader error: " + gl.getShaderInfoLog(fs).slice(0, 200));
{ const gl = renderer.getContext(), x = gl.getExtension("WEBGL_debug_renderer_info"); note("webgl: on, " + (x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : "gpu hidden").slice(0, 60)); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 200);
const light = new THREE.DirectionalLight(0xffffff, .55); light.position.set(3, 5, 8); scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, .25));

const CW = 8.56, CH = 5.4, R = .318;   // card in scene units (1 = 10 mm), trim size
const tex = cv => { const x = new THREE.CanvasTexture(cv); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = renderer.capabilities.getMaxAnisotropy(); return x; };
// Holographic foil, like the printed laminate: a rainbow that slides across the card as its angle to you changes
// (card swing + phone tilt), strongest on the light parts (metal, fine lines, type), with fine diffraction sparkle.
const holoU = { uTilt: { value: new THREE.Vector2() }, uTime: { value: 0 } };
const holo = map => {
  const m = new THREE.MeshPhysicalMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: .42,
    roughness: .5, metalness: .1, clearcoat: .25, clearcoatRoughness: .35, envMapIntensity: .2,
    
  });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, holoU);
    sh.fragmentShader = "uniform vec2 uTilt; uniform float uTime;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      {
        vec3 base = texture2D(map, vMapUv).rgb;
        float lum = dot(base, vec3(.299, .587, .114));
        vec2 a = normal.xy * 1.8 + uTilt;                                   // the card's angle to the viewer
        float h = vMapUv.x * 1.1 - vMapUv.y * .6 + a.x * .9 + a.y * .6 + uTime * .035;   // a slow drift so a still card still glints
        vec3 rainbow = .5 + .5 * cos(6.2831 * (h + vec3(0., .33, .67)));
        float band = .55 + .45 * sin(6.2831 * (vMapUv.x * .8 + vMapUv.y * .5 + a.x * .7 - a.y * .4));   // light catching in a moving band
        vec2 cell = floor(vMapUv * vec2(520., 340.));
        float rnd = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
        float spark = step(.985, fract(rnd + a.x * 2.3 + a.y * 1.7));             // diffraction grain flashing as it turns
        float amt = (.16 + .55 * smoothstep(.1, .7, lum)) * band;
        totalEmissiveRadiance += rainbow * amt + rainbow * spark * .35;
      }`);
  };
  return m;
};
function cardFace(map, back) {
  const sh = new THREE.Shape(), x = -CW / 2, y = -CH / 2;
  sh.moveTo(x + R, y); sh.lineTo(x + CW - R, y); sh.quadraticCurveTo(x + CW, y, x + CW, y + R);
  sh.lineTo(x + CW, y + CH - R); sh.quadraticCurveTo(x + CW, y + CH, x + CW - R, y + CH);
  sh.lineTo(x + R, y + CH); sh.quadraticCurveTo(x, y + CH, x, y + CH - R);
  sh.lineTo(x, y + R); sh.quadraticCurveTo(x, y, x + R, y);
  const g = new THREE.ShapeGeometry(sh, 12), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++)     // trim area of the bleed texture
    uv.setXY(i, (p.getX(i) / CW + .5) * ((W - 4) / W) + 2 / W, (p.getY(i) / CH + .5) * ((H - 4) / H) + 2 / H);
  const m = new THREE.Mesh(g, holo(map));
  if (back) { m.rotation.y = Math.PI; m.position.z = -.006; } else m.position.z = .006;
  return m;
}
const cardObj = new THREE.Group();
cardObj.add(cardFace(tex(frontCv), false), cardFace(tex(backCv), true));
const clip = new THREE.Mesh(new THREE.BoxGeometry(.9, .32, .14), new THREE.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: .3 }));
clip.position.y = CH / 2 + .05; cardObj.add(clip);
cardObj.matrixAutoUpdate = false;
scene.add(cardObj);

// lanyard band
const bandCv = Object.assign(document.createElement("canvas"), { width: 1024, height: 128 });
{
  const g = bandCv.getContext("2d"); g.fillStyle = "#17161a"; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = "rgba(255,255,255,.05)"; for (let y = 0; y < 128; y += 4) g.fillRect(0, y, 1024, 1);
  g.fillStyle = "#f4f2ee"; g.font = '700 54px "Be Vietnam Pro"'; g.textBaseline = "middle";
  g.fillText("VGU Chess", 40, 66); const w = g.measureText("VGU Chess").width;
  g.strokeStyle = "#f4f2ee"; g.lineWidth = 5; g.beginPath(); g.roundRect(60 + w, 34, 76, 62, 10); g.stroke();
  g.font = '700 38px "Be Vietnam Pro"'; g.textAlign = "center"; g.fillText("26", 98 + w, 67);
  g.textAlign = "left"; g.font = '600 26px "Be Vietnam Pro"'; g.fillStyle = "rgba(244,242,238,.55)"; g.fillText("S P O R T   W E E K", 200 + w, 67);
}
const bandTex = tex(bandCv); bandTex.wrapS = THREE.RepeatWrapping;
const N = 12, BW = .74, SEG = .42;
const bandGeo = new THREE.BufferGeometry();
bandGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 6), 3));
bandGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(N * 4), 2));
const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
bandGeo.setIndex(idx);
const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ map: bandTex, side: THREE.DoubleSide }));
band.frustumCulled = false;   // its points move every frame
scene.add(band);

// ---------- physics: verlet rope + rigid card link ----------
const anchor = new THREE.Vector3(0, 0, 0);
const P = [], O = [];
for (let i = 0; i < N; i++) { const p = new THREE.Vector3(0, reduce ? -i * SEG : 5 + i * .2, 0); P.push(p); O.push(p.clone()); }
const bottom = P[N - 1].clone().add(new THREE.Vector3(.3, reduce ? -CH - .2 : 4, 0)), bottomOld = bottom.clone();
let spin = 0, spinV = 0, spinTarget = 0, dragging = false;
const grab = new THREE.Vector3(), gravity = new THREE.Vector3(0, -32, 0);
const tilt = new THREE.Vector2();   // phone tilt (or mouse position on a computer) drives the foil rainbow
addEventListener("deviceorientation", e => { if (e.gamma == null) return; gravity.x = Math.max(-1, Math.min(1, e.gamma / 30)) * 10; tilt.set(e.gamma / 45, (e.beta - 45) / 45); });
addEventListener("pointermove", e => { if (e.pointerType === "mouse") tilt.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });

function step(dt) {
  const all = [...P.map((p, i) => [p, O[i]]), [bottom, bottomOld]];
  for (const [i, [p, o]] of all.entries()) {
    if (i === 0 || (dragging && i === N - 1)) continue;
    const v = p.clone().sub(o).multiplyScalar(.993).clampLength(0, .055);   // speed cap: a flick swings it, never throws it over the top   // air drag: a swing fades over about two seconds
    o.copy(p); p.add(v).addScaledVector(gravity, dt * dt);
  }
  if (dragging) { O[N - 1].copy(P[N - 1]); P[N - 1].lerp(grab, .35); }
  for (let k = 0; k < 24; k++) {
    P[0].copy(anchor);
    for (let i = 0; i < N - 1; i++) {
      const a = P[i], b = P[i + 1], d = b.clone().sub(a), len = d.length();
      if (len <= SEG) continue;                     // a band only pulls
      const diff = (len - SEG) / len;
      if (i === 0) b.addScaledVector(d, -diff); else { a.addScaledVector(d, diff / 2); b.addScaledVector(d, -diff / 2); }
    }
    const d = bottom.clone().sub(P[N - 1]), len = d.length(), diff = (len - CH) / len;   // the card is rigid
    if (dragging) bottom.addScaledVector(d, -diff); else { P[N - 1].addScaledVector(d, diff * .3); bottom.addScaledVector(d, -diff * .7); }
  }
  // turning: the band's twist pulls the card back to face you. While held, the card only follows the hand:
  // no spin is added (this was the "spins like mad when held" bug: every drag frame used to add more spin).
  if (!dragging) {
    const vx = (P[N - 1].x - O[N - 1].x) / dt;
    spinV += Math.max(-6, Math.min(6, vx)) * .02;
  }
  spinV += (spinTarget - spin) * 30 * dt - spinV * (dragging ? 14 : 4.5) * dt;
  spinV = Math.max(-14, Math.min(14, spinV));
  spin += spinV * dt;
}

window.__card = () => ({ spin, spinV, dragging });   // read by tools/spin-test.mjs

function place() {
  const top = P[N - 1], up = top.clone().sub(bottom).normalize();
  const fwd = new THREE.Vector3(0, 0, 1).addScaledVector(up, -up.z).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd);
  const basis = new THREE.Matrix4().makeBasis(right, up, fwd).multiply(new THREE.Matrix4().makeRotationY(spin));
  cardObj.matrix.copy(basis).setPosition(top.clone().add(bottom).multiplyScalar(.5).addScaledVector(up, -.12));
  const pos = bandGeo.attributes.position, uv = bandGeo.attributes.uv;
  let run = 0;
  for (let i = 0; i < N; i++) {
    const p = i === N - 1 ? top.clone().addScaledVector(up, .12) : P[i];
    const tg = P[Math.min(i + 1, N - 1)].clone().sub(P[Math.max(i - 1, 0)]).normalize();
    const side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(BW / 2);
    pos.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - .02); pos.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z - .02);
    if (i) run += P[i].distanceTo(P[i - 1]);
    uv.setXY(i * 2, run / (BW * 8), 1); uv.setXY(i * 2 + 1, run / (BW * 8), 0);
  }
  pos.needsUpdate = uv.needsUpdate = true;
}

// ---------- input ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const setNdc = e => { const b = canvas.getBoundingClientRect(); ndc.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
const toWorld = e => { setNdc(e); return ray.ray.intersectPlane(plane, new THREE.Vector3()); };
const stage = canvas.parentElement;   // the canvas reaches below the stage so the card can swing over the page; input comes from the stage
let down = null;
stage.addEventListener("pointerdown", e => {
  setNdc(e);
  if (!ray.intersectObject(cardObj, true).length) return;
  window.DeviceOrientationEvent?.requestPermission?.().catch(() => {});   // iPhone asks for tilt on the first touch
  down = { x: e.clientX, y: e.clientY, t: performance.now(), off: P[N - 1].clone().sub(toWorld(e)) };
  dragging = true; stage.classList.add("drag"); stage.setPointerCapture(e.pointerId);
  grab.copy(P[N - 1]);
});
stage.addEventListener("pointermove", e => { if (!dragging) return; grab.copy(toWorld(e).add(down.off)); grab.y = Math.min(grab.y, anchor.y - 1.5); });
const release = e => {
  if (!dragging) return;
  dragging = false; stage.classList.remove("drag");
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 350) spinTarget += Math.PI;   // tap: turn over
};
stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", release);

// ---------- fit + loop ----------
// The view always starts just above the anchor and is wide enough for the card, so the band enters from the top edge.
// The card is framed to the stage; the canvas just shows more of the same view below it, for the swing.
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight, sh = stage.clientHeight;
  renderer.setSize(w, h, false);
  const f0 = Math.tan(THREE.MathUtils.degToRad(12.5));
  const needW = CW + 1.3, needH = (N - 1) * SEG + .12 + CH + 1.4;
  const dist = Math.max(needW / 2 / f0 / (w / sh), needH / 2 / f0);
  const half = dist * f0 * h / sh;                 // half the visible height of the whole canvas
  camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(half / dist));
  camera.aspect = w / h;
  camera.position.set(0, anchor.y + .25 - half, dist);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();

let last = performance.now(), acc = 0;
const STEP = 1 / 120;   // fixed step: the swing feels the same on any phone
renderer.setAnimationLoop(now => {
  acc = Math.min(acc + (now - last) / 1000, .25); last = now;
  while (acc >= STEP) { step(STEP); acc -= STEP; }
  place();
  holoU.uTilt.value.lerp(tilt, .08); holoU.uTime.value = now / 1000;
  renderer.render(scene, camera);
});

// No 3D on this browser: the flat card still tilts toward the pointer (or the phone's tilt) with the foil sliding across it.
function flatCard() {
  canvas.hidden = true;
  const f = $("#flat"); f.hidden = false; const k = frontCv.width / W, trim = Object.assign(document.createElement("canvas"), { width: Math.round((W - 4) * k), height: Math.round((H - 4) * k) });
  trim.getContext("2d").drawImage(frontCv, 2 * k, 2 * k, trim.width, trim.height, 0, 0, trim.width, trim.height);   // no print bleed
  const url = trim.toDataURL(); f.querySelector("img").src = url;
  const foil = f.querySelector(".foil"); foil.style.maskImage = foil.style.webkitMaskImage = `url(${url})`;   // foil only where the card is light
  const set = (x, y) => { f.style.setProperty("--x", x.toFixed(3)); f.style.setProperty("--y", y.toFixed(3)); };
  addEventListener("pointermove", e => set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5));
  addEventListener("deviceorientation", e => { if (e.gamma != null) set(e.gamma / 60, (e.beta - 45) / 60); });
}
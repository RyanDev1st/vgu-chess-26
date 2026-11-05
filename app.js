// Winner page. The chip in each card opens ?c=1 .. ?c=4 (add &demo for sample data).
// What it is for: challenge the winner online, prove the title (verified record + Add to LinkedIn), keep the card (save image),
// and see the run of five games. The card hangs on a lanyard (after the Vercel Ship 2024 badge): drag to swing, tap to turn over.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { drawFront, drawBack, fontsReady, loadImage, TIERS, W, H } from "./card.js?v=8";

// ?debug shows what this device is doing (for checking phones we cannot plug in)
const VERSION = "8", dbg = [];
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
note("photo: " + (photo ? photo.width + "x" + photo.height : "NOT LOADED"));
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
{ const d = frontCv.getContext("2d", { willReadFrequently: true }).getImageData(Math.round(23.8 * 16), Math.round(30 * 16), 1, 1).data; note("photo on card (face pixel): rgb " + d[0] + "," + d[1] + "," + d[2]); }
const canvas = $("#gl");
// 3D when the browser allows it; otherwise the same physics drawn in 2D (some browsers, e.g. Helium, block WebGL).
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch { note("webgl: OFF, drawing the card in 2D"); }
if (renderer) {
  renderer.debug.onShaderError = (gl, prog, vs, fs) => note("shader error: " + gl.getShaderInfoLog(fs).slice(0, 200));
  const gl = renderer.getContext(), x = gl.getExtension("WEBGL_debug_renderer_info");
  note("webgl: on, " + (x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : "gpu hidden").slice(0, 60));
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
const scene = new THREE.Scene();
if (renderer) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 200);
const light = new THREE.DirectionalLight(0xffffff, .55); light.position.set(3, 5, 8); scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, .25));

const CW = 8.56, CH = 5.4, R = .318;   // card in scene units (1 = 10 mm), trim size
const tex = cv => { const x = new THREE.CanvasTexture(cv); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1; return x; };
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
        vec2 a = normal.xy * 1.6 + uTilt;                                   // the card's angle to the viewer
        // Real holo laminate: the card looks normal until light hits it, then ONE narrow streak of spectrum crosses it,
        // sliding as the angle changes. Colour runs along the streak, as in a diffraction foil.
        float d = vMapUv.x * .85 + vMapUv.y * .45 - .65 + a.x * .55 - a.y * .35 + sin(uTime * .55) * .45;   // where the glint sits; it also drifts slowly, as room light would
        float streak = exp(-d * d * 160.);                                   // a thin, soft-edged glint
        vec3 spectrum = .5 + .5 * cos(6.2831 * (d * 2.4 + vMapUv.y * .5 + vec3(0., .33, .67)));
        float lit = .45 + .55 * smoothstep(.04, .5, lum);   // the film covers the whole card; light print shows it most                     // foil shows on the metal, the fine lines and the type
        vec2 cell = floor(vMapUv * vec2(520., 340.));
        float rnd = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
        float spark = step(.993, fract(rnd + a.x * 2.3 + a.y * 1.7)) * (.3 + streak);   // the odd diffraction glint
        totalEmissiveRadiance += spectrum * (streak * lit * .3 + spark * lit * .2);
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
// Entrance: the whole lanyard is lowered fast from above the screen. The clip stops at its spot, the card keeps
// falling, the band snaps taut, the card bounces, swings a little and turns from its back to face you (about 1.2 s).
// Reduced motion: it is simply there.
const DROP_FROM = reduce ? 0 : 15, DROP_V = 30;   // start height above the rest spot, and lowering speed (units/s)
anchor.y = DROP_FROM;
for (let i = 0; i < N; i++) {
  const p = new THREE.Vector3(0, DROP_FROM - i * SEG, 0);
  P.push(p); O.push(p.clone().add(new THREE.Vector3(0, reduce ? 0 : DROP_V / 120, 0)));
}
const bottom = P[N - 1].clone().add(new THREE.Vector3(0, -CH, 0));
const bottomOld = bottom.clone().add(new THREE.Vector3(reduce ? 0 : .025, reduce ? 0 : DROP_V / 120, 0));   // a slight sideways drift: it lands swinging
let spin = reduce ? 0 : -1.15 * Math.PI, spinV = 0, spinTarget = 0, dragging = false;
const grab = new THREE.Vector3(), gravity = new THREE.Vector3(0, -32, 0);
const tilt = new THREE.Vector2();   // phone tilt (or mouse position on a computer) drives the foil rainbow
addEventListener("deviceorientation", e => { if (e.gamma == null) return; gravity.x = Math.max(-1, Math.min(1, e.gamma / 30)) * 10; tilt.set(e.gamma / 45, (e.beta - 45) / 45); });
addEventListener("pointermove", e => { if (e.pointerType === "mouse") tilt.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });

function step(dt) {
  if (anchor.y > 0) anchor.y = Math.max(0, anchor.y - DROP_V * dt);   // the entrance: lowering the clip
  const all = [...P.map((p, i) => [p, O[i]]), [bottom, bottomOld]];
  for (const [i, [p, o]] of all.entries()) {
    if (i === 0 || (dragging && i === N - 1)) continue;
    const v = p.clone().sub(o).multiplyScalar(.993);
    v.x = Math.max(-.07, Math.min(.07, v.x)); v.z = Math.max(-.07, Math.min(.07, v.z)); v.y = Math.min(v.y, .035);   // a flick swings it, never throws it over the top; falling is never slowed   // air drag: a swing fades over about two seconds
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
stage.addEventListener("pointermove", e => { if (!dragging) return; grab.copy(toWorld(e).add(down.off)); grab.y = Math.min(grab.y, -1.5); });
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
  if (renderer) renderer.setSize(w, h, false);
  else { const r = Math.min(devicePixelRatio, 2); canvas.width = Math.round(w * r); canvas.height = Math.round(h * r); }
  const f0 = Math.tan(THREE.MathUtils.degToRad(12.5));
  const needW = CW + 1.3, needH = (N - 1) * SEG + .12 + CH + 1.4;
  const dist = Math.max(needW / 2 / f0 / (w / sh), needH / 2 / f0);
  const half = dist * f0 * h / sh;                 // half the visible height of the whole canvas
  camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(half / dist));
  camera.aspect = w / h;
  camera.position.set(0, .25 - half, dist);   // framed on the rest spot, not the moving clip
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();

let last = performance.now(), acc = 0;
const STEP = 1 / 120;   // fixed step: the swing feels the same on any phone
const frame = now => {
  acc = Math.min(acc + (now - last) / 1000, .25); last = now;
  while (acc >= STEP) { step(STEP); acc -= STEP; }
  place();
  holoU.uTilt.value.lerp(tilt, .08); holoU.uTime.value = now / 1000;
  if (renderer) renderer.render(scene, camera); else draw2D(now);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);


// ---------- 2D drawing (no WebGL) ----------
// The same scene, projected through the same camera: the band as a stroke, the card as an image mapped onto its three
// projected corners (so swinging, turning over and perspective squash all show), and the foil streak masked to the
// card's light parts, sliding with the card's angle.
const ctx2 = renderer ? null : canvas.getContext("2d");
const K2 = 9;   // px per mm for the 2D card images
const trimOf = cv => {
  const k = cv.width / W, out = Object.assign(document.createElement("canvas"), { width: Math.round((W - 4) * K2), height: Math.round((H - 4) * K2) });
  out.getContext("2d").drawImage(cv, 2 * k, 2 * k, (W - 4) * k, (H - 4) * k, 0, 0, out.width, out.height);
  return out;
};
const lightMask = img => {   // white where the card is light (metal, lines, type), clear where it is dark
  const m = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height }), g = m.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, m.width, m.height), px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const l = (px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114) / 255, t = Math.min(1, Math.max(0, (l - .12) / .48));
    px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = (.45 + .55 * t * t * (3 - 2 * t)) * 255;
  }
  g.putImageData(d, 0, 0); return m;
};
const faces2 = ctx2 && [trimOf(frontCv), trimOf(backCv)].map(img => ({ img, mask: lightMask(img) }));
const foilCv = ctx2 && Object.assign(document.createElement("canvas"), { width: faces2[0].img.width, height: faces2[0].img.height });
const SPECTRUM = ["#ff4d8a", "#ffb84d", "#f4ff6b", "#59ffb0", "#4dc3ff", "#9a6bff"];

function draw2D(now) {
  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  const cw = canvas.width, ch = canvas.height;
  const proj = v => { const p = v.clone().project(camera); return new THREE.Vector2((p.x + 1) / 2 * cw, (1 - p.y) / 2 * ch); };
  const world = (x, y) => new THREE.Vector3(x, y, 0).applyMatrix4(cardObj.matrixWorld);
  ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, cw, ch);

  // band
  const px = proj(new THREE.Vector3(BW, 0, 0)).x - proj(new THREE.Vector3(0, 0, 0)).x;
  ctx2.lineJoin = ctx2.lineCap = "round";
  ctx2.beginPath();
  P.forEach((p, i) => { const q = proj(p); i ? ctx2.lineTo(q.x, q.y) : ctx2.moveTo(q.x, q.y); });
  const clipTop = proj(world(0, CH / 2 + .12)); ctx2.lineTo(clipTop.x, clipTop.y);
  ctx2.strokeStyle = "#17161a"; ctx2.lineWidth = px; ctx2.stroke();
  ctx2.strokeStyle = "rgba(244,242,238,.07)"; ctx2.lineWidth = Math.max(1, px * .08); ctx2.stroke();   // a faint woven sheen

  // which side faces us: the back is the front turned half a turn, so its image runs the other way
  let tl = proj(world(-CW / 2, CH / 2)), tr = proj(world(CW / 2, CH / 2)), bl = proj(world(-CW / 2, -CH / 2));
  const facing = (tr.x - tl.x) * (bl.y - tl.y) - (tr.y - tl.y) * (bl.x - tl.x) > 0;
  const face = faces2[facing ? 0 : 1];
  if (!facing) { tl = proj(world(CW / 2, CH / 2)); tr = proj(world(-CW / 2, CH / 2)); bl = proj(world(CW / 2, -CH / 2)); }
  const iw = face.img.width, ih = face.img.height;
  ctx2.setTransform((tr.x - tl.x) / iw, (tr.y - tl.y) / iw, (bl.x - tl.x) / ih, (bl.y - tl.y) / ih, tl.x, tl.y);
  const card = new Path2D(); card.roundRect(0, 0, iw, ih, iw * R / CW);
  ctx2.save(); ctx2.shadowColor = "rgba(0,0,0,.55)"; ctx2.shadowBlur = 40; ctx2.shadowOffsetY = 18; ctx2.fillStyle = "#0b0b0c"; ctx2.fill(card); ctx2.restore();
  ctx2.save(); ctx2.clip(card); ctx2.drawImage(face.img, 0, 0);

  // foil streak: where it sits depends on the swing, the turn and the phone/mouse tilt
  const up = P[N - 1].clone().sub(bottom).normalize();
  const t = holoU.uTilt.value, d0 = .5 + up.x * 1.4 + Math.sin(spin) * .5 + t.x * .45 - t.y * .3 + Math.sin(now / 1000 * .55) * .45;
  const g = foilCv.getContext("2d");
  g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, iw, ih);
  const dx = iw * .85, dy = ih * .45, grad = g.createLinearGradient(0, 0, dx, dy);
  const stop = (o, c) => { if (o > 0 && o < 1) grad.addColorStop(o, c); };
  grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0)");
  stop(d0 - .09, "rgba(0,0,0,0)");
  SPECTRUM.forEach((c, i) => stop(d0 - .06 + i * .024, c));
  stop(d0 + .09, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, iw, ih);
  g.globalCompositeOperation = "destination-in"; g.drawImage(face.mask, 0, 0);
  ctx2.globalCompositeOperation = "screen"; ctx2.globalAlpha = .55; ctx2.drawImage(foilCv, 0, 0);
  ctx2.restore();
  ctx2.globalCompositeOperation = "source-over"; ctx2.globalAlpha = 1;

  // metal clip
  ctx2.fillStyle = "#9a9da3"; ctx2.fillRect(iw / 2 - iw * .45 / CW, -ih * .11 / CH, iw * .9 / CW, ih * .32 / CH);
}

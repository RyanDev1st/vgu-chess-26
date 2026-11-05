// Winner page. The chip in each card opens ?c=1 .. ?c=4 (add &demo for sample data).
// What it is for: challenge the winner online, prove the title (verified record + Add to LinkedIn), keep the card (save image),
// and see the run of five games. The card hangs on a lanyard (after the Vercel Ship 2024 badge): drag to swing, tap to turn over.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { drawFront, drawBack, fontsReady, loadImage, TIERS, W, H } from "./card.js?v=17";

// ?debug shows what this device is doing (for checking phones we cannot plug in)
const VERSION = "17", dbg = [];
const note = m => { dbg.push(m); const b = document.querySelector("#debug"); if (b) b.textContent = dbg.join("\n"); };
if (new URLSearchParams(location.search).has("debug")) {
  const b = Object.assign(document.createElement("pre"), { id: "debug" }); document.body.append(b);
  addEventListener("error", e => note("error: " + e.message)); addEventListener("unhandledrejection", e => note("error: " + (e.reason?.message || e.reason)));
  note("version " + VERSION + " | " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90));
}
// GitHub Pages lets a browser keep the page for 10 minutes, so a visitor can get an old version right after an update.
// Ask for the current page past the cache; if it names a newer version, load that (once: the ?v= stops a loop).
fetch("index.html?t=" + Date.now(), { cache: "no-store" }).then(r => r.text()).then(t => {
  const v = t.match(/app\.js\?v=(\d+)/)?.[1], u = new URL(location.href);
  if (v && v !== VERSION && u.searchParams.get("v") !== v) { u.searchParams.set("v", v); location.replace(u); }
}).catch(() => {});

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
  if (data.sample) $("#sample").hidden = false;   // never let sample results pass for real ones
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
// This year's four scrolls sideways with a finger, a mouse wheel, a mouse drag, or the arrow buttons.
{
  const nav = $("#podium"), card = () => nav.querySelector("a").getBoundingClientRect().width + 12;
  const sync = () => { $("#prev").disabled = nav.scrollLeft < 4; $("#next").disabled = nav.scrollLeft > nav.scrollWidth - nav.clientWidth - 4; };
  $("#prev").onclick = () => nav.scrollBy({ left: -card(), behavior: "smooth" });
  $("#next").onclick = () => nav.scrollBy({ left: card(), behavior: "smooth" });
  nav.addEventListener("scroll", sync, { passive: true });
  nav.addEventListener("wheel", e => {   // a vertical wheel scrolls the row while it can, then the page again
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, max = nav.scrollWidth - nav.clientWidth;
    if ((d > 0 && nav.scrollLeft < max - 1) || (d < 0 && nav.scrollLeft > 1)) { e.preventDefault(); nav.scrollLeft += d; }
  }, { passive: false });
  let drag = null;
  nav.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button === 0) drag = { x: e.clientX, left: nav.scrollLeft, moved: false }; });
  addEventListener("pointermove", e => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x) > 5 && !drag.moved) { drag.moved = true; nav.classList.add("grabbing"); }
    if (drag.moved) nav.scrollLeft = drag.left - (e.clientX - drag.x);
  });
  addEventListener("pointerup", () => { if (drag?.moved) setTimeout(() => nav.classList.remove("grabbing")); drag = null; });
  nav.addEventListener("dragstart", e => e.preventDefault());
  requestAnimationFrame(sync);
}
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
const light = new THREE.DirectionalLight(0x8fe6dc, .6);   // light off a holo laminate reads blue-green, not white light.position.set(3, 5, 8); scene.add(light);
scene.add(new THREE.AmbientLight(0xb4e4e0, .25));

const CW = 8.56, CH = 5.4, R = .318;   // card in scene units (1 = 10 mm), trim size
const tex = cv => { const x = new THREE.CanvasTexture(cv); x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1; return x; };
// Holographic foil, modelled on the shop's own video of these cards (.scratch/holo): the foil shows only where the
// print is light and pale (there it reads as silver); saturated colour and black stay flat ink. Up close it is a fine
// glitter: each grain catches the light at its own angle, so grains twinkle as the card moves, and broad washes of
// yellow / green / cyan / pink slide across the light areas with the angle. Shared numbers with the 2D path below.
const FOIL = { grain: [260, 168], wash: .9, silver: .1, glow: .45, sparkle: 1.6, darkGlint: .22 };   // darkGlint: the film's glints on dark print
// The photo stays plain print (foil on skin reads as a rash): no foil where card.js says the photo is (the window and
// the head rising above it, exactly; a rectangle here used to leave a dead block above the head).
const holoU = { uTilt: { value: new THREE.Vector2() }, uTime: { value: 0 } };
const holo = (map, photoMask) => {   // photoMask: the front only; the back is all foil
  const m = new THREE.MeshPhysicalMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: .42,
    roughness: .62, metalness: .1, clearcoat: .2, clearcoatRoughness: .3, envMapIntensity: .1, sheen: .15, sheenColor: 0x5fe0c8, sheenRoughness: .5,
  });
  // three.js shares one compiled shader between materials whose onBeforeCompile reads the same; the front and back
  // differ (the photo cut-out), so name them apart. Without this the back ran the front's shader: first the photo's
  // cut-out showed on the back as a dead block, then (with the mask) the back lost its foil entirely.
  m.customProgramCacheKey = () => photoMask ? "holo-front" : "holo-back";
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, holoU, photoMask ? { uPhotoMask: { value: photoMask } } : {});
    const f = n => n.toFixed(3);
    // grain hash without sin(): fract(sin(big) * 43758) loses precision on many GPUs once the numbers grow, so the
    // glitter died away from the card's bottom-left corner (it only showed along the left and bottom edges)
    sh.fragmentShader = `uniform vec2 uTilt; uniform float uTime;${photoMask ? " uniform sampler2D uPhotoMask;" : ""}
      float holoHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
` + sh.fragmentShader.replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      {
        vec3 base = texture2D(map, vMapUv).rgb;                                   // linear colour of the print here
        float lum = dot(base, vec3(.299, .587, .114));
        float hi = max(base.r, max(base.g, base.b)), lo = min(base.r, min(base.g, base.b));
        float sat = (hi - lo) / (hi + .02);
        float inPhoto = ${photoMask ? "smoothstep(.15, .6, texture2D(uPhotoMask, vMapUv).a)" : "0."};
        float foil = smoothstep(.04, .35, lum) * (1. - .35 * smoothstep(.3, .9, sat)) * (1. - inPhoto);   // light print = foil; not the photo
        vec2 a = normal.xy * 1.6 + uTilt;                                          // the card's angle to the viewer
        float ph = dot(vMapUv, vec2(1.1, .6)) + a.x * 1.3 + a.y * .9 + uTime * .03;
        float catchL = smoothstep(.15, .85, .5 + .5 * sin(6.2831 * ph * ${f(FOIL.wash)}));   // broad lit / unlit washes
        vec2 cell = floor(vMapUv * vec2(${f(FOIL.grain[0])}, ${f(FOIL.grain[1])}));
        float r1 = holoHash(cell), r2 = holoHash(cell + vec2(57.31, 113.7));
        float tw = pow(.5 + .5 * cos(6.2831 * (r2 + a.x * 1.9 + a.y * 1.4 + uTime * .02)), 24.) * step(.62, r1);   // only some flakes face the light   // a grain flashing as it turns
        vec3 spectrum = .5 + .5 * cos(6.2831 * (ph + r1 * .25 + vec3(0., .33, .67)));
        spectrum = mix(spectrum, vec3(.18, .95, .82), .42);   // the foil reads blue-green when it catches light (as in the shop video)
        vec3 hue = spectrum - vec3(dot(spectrum, vec3(.3333)));   // colour without extra brightness: light print turns blue-green instead of white
        float k = foil * (.3 + .7 * catchL);
        totalEmissiveRadiance *= mix(vec3(1.), vec3(.55, .95, 1.) * (.75 + .5 * spectrum), k * .8);   // the print itself shifts toward blue-green
        totalEmissiveRadiance += k * hue * .9;
        float film = max(foil, ${f(FOIL.darkGlint)} * (1. - inPhoto));   // the glitter film covers all the print except the photo
        totalEmissiveRadiance += foil * (vec3(.45, .85, .9) * ${f(FOIL.silver)} + spectrum * catchL * ${f(FOIL.glow)}) + film * spectrum * (.35 + .65 * catchL) * ${f(FOIL.sparkle)} * tw;
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
  const m = new THREE.Mesh(g, holo(map, back ? null : photoMaskTex));
  if (back) { m.rotation.y = Math.PI; m.position.z = -.006; } else m.position.z = .006;
  return m;
}
const cardObj = new THREE.Group();
const photoMaskTex = new THREE.CanvasTexture(frontCv.photoMask);
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
let pitch = 0, pitchTarget = 0, turning = false;   // set by the turn control: tip the card toward or away from you
const grab = new THREE.Vector3(), gravity = new THREE.Vector3(0, -32, 0);
const tilt = new THREE.Vector2();   // phone tilt (or mouse position on a computer) drives the foil rainbow
// Tilt counts only as a change from how the phone is being held (a slow-moving baseline), so a phone held at an
// angle does not make the card lean to one side for good. Tilting it moves the card and the foil.
const base = { g: null, b: null };
addEventListener("deviceorientation", e => {
  if (e.gamma == null) return;
  if (base.g == null) { base.g = e.gamma; base.b = e.beta; }
  base.g += (e.gamma - base.g) * .015; base.b += (e.beta - base.b) * .015;
  const dg = e.gamma - base.g, db = e.beta - base.b;
  gravity.x = Math.max(-1, Math.min(1, dg / 25)) * 7;
  tilt.set(dg / 30, db / 30);
});
addEventListener("pointermove", e => { if (e.pointerType === "mouse") tilt.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); });

function step(dt) {
  if (anchor.y > 0) anchor.y = Math.max(0, anchor.y - DROP_V * dt);   // the entrance: lowering the clip
  const all = [...P.map((p, i) => [p, O[i]]), [bottom, bottomOld]];
  for (const [i, [p, o]] of all.entries()) {
    if (i === 0) continue;
    const v = p.clone().sub(o).multiplyScalar(.99);   // air drag: a swing fades within about two seconds
    v.x = Math.max(-.07, Math.min(.07, v.x)); v.z = Math.max(-.07, Math.min(.07, v.z)); v.y = Math.min(v.y, .035);   // a flick swings it, never throws it over the top; falling is never slowed   // air drag: a swing fades over about two seconds
    o.copy(p); p.add(v).addScaledVector(gravity, dt * dt);
  }
  if (dragging) holdTurn(dt);
  for (let k = 0; k < 24; k++) {
    P[0].copy(anchor);
    for (let i = 0; i < N - 1; i++) {
      const a = P[i], b = P[i + 1], d = b.clone().sub(a), len = d.length();
      const limit = i === N - 2 ? SEG + stretch : SEG;   // the last stretch of band is elastic (see pin)
      if (len <= limit) continue;                   // a band only pulls
      const diff = (len - limit) / len;
      if (i === 0) b.addScaledVector(d, -diff);
      else if (i === N - 2 && dragging) continue;   // held: this link stretches instead (handled once per step below)
      else { a.addScaledVector(d, diff / 2); b.addScaledVector(d, -diff / 2); }
    }
    const d = bottom.clone().sub(P[N - 1]), len = d.length(), diff = (len - CH) / len;   // the card is rigid
    if (dragging) { P[N - 1].addScaledVector(d, diff * .5); bottom.addScaledVector(d, -diff * .5); pin(); }
    else { P[N - 1].addScaledVector(d, diff * .3); bottom.addScaledVector(d, -diff * .7); }
  }
  if (dragging) {   // the band's end eases toward the card a little each step; the rest of the band stays a band
    const a = P[N - 2], d = P[N - 1].clone().sub(a), len = d.length();
    if (len > SEG) a.addScaledVector(d, (len - SEG) / len * .25);
    stretch = Math.max(0, a.distanceTo(P[N - 1]) - SEG);
  }
  else stretch = Math.max(0, stretch - 16 * dt);   // let go: the stretched band springs back
  // turning: the band's twist pulls the card back to face you. While held, the card only follows the hand:
  // no spin is added (this was the "spins like mad when held" bug: every drag frame used to add more spin).
  if (!dragging) {
    const vx = (P[N - 1].x - O[N - 1].x) / dt;
    spinV += Math.max(-6, Math.min(6, vx)) * .02;
  }
  spinV += (spinTarget - spin) * 30 * dt - spinV * (dragging || turning ? 14 : 4.5) * dt;   // turning by hand: no overshoot
  spinV = Math.max(-14, Math.min(14, spinV));
  spin += spinV * dt;
  pitch += (pitchTarget - pitch) * Math.min(1, 10 * dt);
}

// ---------- holding the card where the finger is ----------
// held = the touched spot in card coordinates (lx across, ly up from the centre). While held, that spot stays under
// the finger and gravity turns the card around it: hold the right edge and the left side drops; hold the middle and
// it stays level; hold near the clip and it hangs.
const held = { lx: 0, ly: 0 };
let rotV = 0, stretch = 0;
const MAX_STRETCH = 2.4;   // how far the band gives when pulled (scene units; the band is 4.6 long)
const frame2D = () => {
  const T = P[N - 1], up = T.clone().sub(bottom).normalize(), right = new THREE.Vector3(up.y, -up.x, 0);
  const C = T.clone().add(bottom).multiplyScalar(.5);
  return { T, up, right, C, G: C.clone().addScaledVector(up, held.ly).addScaledVector(right, held.lx * Math.cos(spin)) };
};
function pin() {   // move the card (no turn) so the held spot is under the finger
  const { G } = frame2D(), d = grab.clone().sub(G);
  P[N - 1].add(d); bottom.add(d);
  // beyond what the band can give, the card stays back and the finger slides off the spot
  const end = P[N - 2], over = end.distanceTo(P[N - 1]) - SEG - MAX_STRETCH;
  if (over > 0) { const back = end.clone().sub(P[N - 1]).setLength(over); P[N - 1].add(back); bottom.add(back); }
}
function holdTurn(dt) {   // gravity's turn around the held spot
  const { C, G } = frame2D(), v = C.clone().sub(G);
  // the stretched band pulls the clip: that turns the card only when the pull is at an angle to the held spot.
  // The pull runs along the taut band, so it is measured from the band's fixed top, not from a band point that sways.
  const T = P[N - 1], pull = P[0].clone().sub(T).setLength(stretch), r = T.clone().sub(G);
  const torque = -v.x * 9 + (r.x * pull.y - r.y * pull.x) * 16;   // gravity: centre left of the finger turns it down
  // In the hand the card follows these forces without momentum. With momentum it overshot level, the band swung, and
  // the overshoot grew: pulled straight down it rocked wider and wider ("always lifts to the left", "buggy").
  rotV = Math.max(-6, Math.min(6, torque / 5));
  const a = rotV * dt, c = Math.cos(a), sn = Math.sin(a);
  for (const p of [P[N - 1], bottom]) { const x = p.x - G.x, y = p.y - G.y; p.x = G.x + x * c - y * sn; p.y = G.y + x * sn + y * c; }
}

window.__cardScreen = (lx, ly) => {   // for tests: where a spot on the card is on screen
  const { C, up, right } = frame2D(), w = C.clone().addScaledVector(up, ly).addScaledVector(right, lx).project(camera), b = canvas.getBoundingClientRect();
  return { x: b.left + (w.x + 1) / 2 * b.width, y: b.top + (1 - w.y) / 2 * b.height };
};
window.__card = () => ({ spin, spinV, pitch, dragging, up: frame2D().up.toArray().map(n => +n.toFixed(3)),
  stretch, rotV, endDx: P[N - 2].x - P[N - 1].x, endDy: P[N - 2].y - P[N - 1].y, G: frame2D().G.toArray(), grab: grab.toArray(), rope: P.map(p => +p.x.toFixed(2)) });   // read by tools/spin-test.mjs

function place() {
  const top = P[N - 1], up = top.clone().sub(bottom).normalize();
  const fwd = new THREE.Vector3(0, 0, 1).addScaledVector(up, -up.z).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd);
  const basis = new THREE.Matrix4().makeBasis(right, up, fwd).multiply(new THREE.Matrix4().makeRotationX(pitch)).multiply(new THREE.Matrix4().makeRotationY(spin));
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
  const f = toWorld(e), { up, right, C } = frame2D(), rel = f.clone().sub(C), cs = Math.cos(spin);
  held.ly = rel.dot(up); held.lx = Math.abs(cs) > .2 ? rel.dot(right) / cs : 0;
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  dragging = true; rotV = 0; stage.classList.add("drag"); stage.setPointerCapture(e.pointerId);
  grab.copy(f);
});
stage.addEventListener("pointermove", e => { if (dragging) grab.copy(toWorld(e)); });
const release = e => {
  if (!dragging) return;
  dragging = false; stage.classList.remove("drag");
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 350) flipBtn.onclick();   // tap: turn over
};
// ---------- the turn control: look at the card from any angle ----------
// Drag across the pad: sideways turns the card any amount, up/down tips it toward or away from you, and it stays
// where you leave it so you can watch the foil. The arrows step it an eighth of a turn, or keep turning while held.
// The last button turns it over (the same as a tap on the card).
const flipBtn = $("#flip"), pad = $("#turnPad");
const flipLabel = () => { flipBtn.querySelector("span").textContent = Math.cos(spinTarget) > 0 ? "Back" : "Front"; };
const TURN_PX = 2 * Math.PI / 260;   // 260 px of drag is a full turn
const MAX_PITCH = .75;
$("#turn").addEventListener("pointerdown", e => e.stopPropagation());   // never grabs the card underneath
let padDrag = null;
pad.addEventListener("pointerdown", e => {
  padDrag = { x: e.clientX, y: e.clientY, spin: spinTarget, pitch: pitchTarget };
  turning = true; pad.setPointerCapture(e.pointerId); pad.classList.add("on");
});
pad.addEventListener("pointermove", e => {
  if (!padDrag) return;
  spinTarget = padDrag.spin + (e.clientX - padDrag.x) * TURN_PX;
  pitchTarget = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, padDrag.pitch + (e.clientY - padDrag.y) * .006));
  flipLabel();
});
const padEnd = () => { padDrag = null; turning = false; pad.classList.remove("on"); };
pad.addEventListener("pointerup", padEnd); pad.addEventListener("pointercancel", padEnd);
pad.addEventListener("keydown", e => {   // keyboard: arrows turn and tip
  const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!k) return;
  e.preventDefault(); spinTarget += k[0] * Math.PI / 12;
  pitchTarget = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitchTarget + k[1] * .15)); flipLabel();
});
for (const [id, dir] of [["#turnL", -1], ["#turnR", 1]]) {
  const b = $(id); let hold = null;
  const stop = () => { clearTimeout(hold?.t); cancelAnimationFrame(hold?.raf); hold = null; turning = false; };
  b.addEventListener("pointerdown", e => {
    b.setPointerCapture(e.pointerId); turning = true;
    spinTarget += dir * Math.PI / 4; flipLabel();   // a press: an eighth of a turn
    hold = { t: setTimeout(() => {                  // held: keep turning, about a turn every three seconds
      let prev = performance.now();
      const run = now => { if (!hold) return; spinTarget += dir * 2.1 * (now - prev) / 1000; prev = now; flipLabel(); hold.raf = requestAnimationFrame(run); };
      hold.raf = requestAnimationFrame(run);
    }, 320) };
  });
  b.addEventListener("pointerup", stop); b.addEventListener("pointercancel", stop);
}
flipBtn.onclick = () => { spinTarget = Math.round(spinTarget / Math.PI) * Math.PI + Math.PI; pitchTarget = 0; flipLabel(); };
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
// The foil in 2D, same model as the shader: foil = light, pale print; three glitter masks (the grain twinkling at three
// moments) are cross-faded by angle, and multiplied by the sliding colour wash.
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const foilMasks = (img, photoMask) => {   // photoMask: where the photo is (front only)
  const w = img.width, h = img.height, src = document.createElement("canvas"); src.width = w; src.height = h;
  const sg = src.getContext("2d", { willReadFrequently: true }); sg.drawImage(img, 0, 0);
  const px = sg.getImageData(0, 0, w, h).data, gx = FOIL.grain[0] / w, gy = FOIL.grain[1] / h;
  let pm = null;
  if (photoMask) { sg.clearRect(0, 0, w, h); sg.drawImage(photoMask, 0, 0); pm = sg.getImageData(0, 0, w, h).data; }
  const hash = (x, y, k) => { const v = Math.sin(x * k[0] + y * k[1]) * k[2]; return v - Math.floor(v); };
  const masks = [0, 1, 2].map(() => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; });
  const data = masks.map(c => c.getContext("2d").createImageData(w, h));
  const silver = document.createElement("canvas"); silver.width = w; silver.height = h;
  const sd = silver.getContext("2d").createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, r = (px[i] / 255) ** 2.2, g = (px[i + 1] / 255) ** 2.2, b = (px[i + 2] / 255) ** 2.2;
    const lum = r * .299 + g * .587 + b * .114, hi = Math.max(r, g, b), lo = Math.min(r, g, b);
    const inPhoto = pm ? pm[i + 3] > 90 : false;
    const foil = inPhoto ? 0 : smooth(.04, .35, lum) * (1 - .35 * smooth(.3, .9, (hi - lo) / (hi + .02)));
    const cx = Math.floor(x * gx), cy = Math.floor(y * gy), r2 = hash(cx, cy, [39.3468, 11.135, 24634.6345]);
    sd.data[i] = 115; sd.data[i + 1] = 217; sd.data[i + 2] = 230; sd.data[i + 3] = foil * 255;   // cyan-silver
    for (let k = 0; k < 3; k++) {
      const r1 = hash(cx, cy, [12.9898, 78.233, 43758.5453]), tw = r1 < .62 ? 0 : (.5 + .5 * Math.cos(2 * Math.PI * (r2 + k / 3))) ** 24, film = inPhoto ? 0 : Math.max(foil, FOIL.darkGlint);
      const d = data[k].data; d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.min(1, (foil * FOIL.glow + film * FOIL.sparkle * tw) / (FOIL.glow + FOIL.sparkle) * 3.2) * 255;
    }
  }
  masks.forEach((c, k) => c.getContext("2d").putImageData(data[k], 0, 0));
  silver.getContext("2d").putImageData(sd, 0, 0);
  return { masks, silver };
};
const faces2 = ctx2 && [trimOf(frontCv), trimOf(backCv)].map((img, i) => ({ img, ...foilMasks(img, i === 0 ? trimOf(frontCv.photoMask) : null) }));
const foilCv = ctx2 && Object.assign(document.createElement("canvas"), { width: faces2[0].img.width, height: faces2[0].img.height });
const TINT = [.18, .95, .82];   // blue-green, as the shader
const washColour = ph => [0, .33, .67].map((k, i) => Math.round(255 * ((.5 + .5 * Math.cos(2 * Math.PI * (ph + k))) * .58 + TINT[i] * .42)));

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
  // the band's print (VGU Chess 26, SPORT WEEK): each stretch of band gets its slice of the band image, laid along it
  // the same way the 3D band maps it (one image per BW * 8 of band, read from the top down)
  const upC = P[N - 1].clone().sub(bottom).normalize(), pts = [...P.slice(0, N - 1), P[N - 1].clone().addScaledVector(upC, .12)];
  const UNIT = BW * 8, IW = bandCv.width, IH = bandCv.height;
  let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = i < N - 2 ? P[i].distanceTo(P[i + 1]) : a.distanceTo(b);
    const dir = b.clone().sub(a).normalize(), side = new THREE.Vector3(dir.y, -dir.x, 0).multiplyScalar(BW / 2);
    const A = proj(a.clone().sub(side)), B = proj(b.clone().sub(side)), Ab = proj(a.clone().add(side));
    let u0 = run / UNIT * IW, u1 = (run + len) / UNIT * IW; run += len;
    if (u1 - u0 < .5) continue;
    const ux = (B.x - A.x) / (u1 - u0), uy = (B.y - A.y) / (u1 - u0), vx = (Ab.x - A.x) / IH, vy = (Ab.y - A.y) / IH;
    ctx2.save(); ctx2.setTransform(ux, uy, vx, vy, A.x - ux * u0, A.y - uy * u0);
    for (let s = u0; s < u1;) {   // the image repeats down a long (stretched) band
      const k = Math.floor(s / IW), e = Math.min(u1, (k + 1) * IW), sx = s - k * IW, w = Math.min(e - s + .8, IW - sx);   // .8: no hairline seams
      ctx2.drawImage(bandCv, sx, 0, w, IH, s, 0, w, IH); s = e;
    }
    ctx2.restore();
  }

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

  // foil: the card's angle (turn, a little of the swing, phone/mouse tilt) slides the wash and twinkles the grain
  const up = P[N - 1].clone().sub(bottom).normalize(), t = holoU.uTilt.value, time = now / 1000;
  const ax = Math.sin(spin) * 1.6 + up.x * .5 + t.x, ay = t.y + pitch * 1.4;
  const g = foilCv.getContext("2d");
  const grad = g.createLinearGradient(0, 0, iw * 1.1 / 1.25, ih * .6 / 1.25);   // along the same direction as the shader's wash
  for (let s = 0; s <= 24; s++) {
    const o = s / 24, ph = o * 1.25 + ax * 1.3 + ay * .9 + time * .03;
    const catchL = smooth(.15, .85, .5 + .5 * Math.sin(2 * Math.PI * ph * FOIL.wash)), [r, gg, b] = washColour(ph);
    grad.addColorStop(o, `rgb(${Math.round(r * catchL)},${Math.round(gg * catchL)},${Math.round(b * catchL)})`);
  }
  const phase = ((ax * 1.9 + ay * 1.4 + time * .02) % 1 + 1) % 1 * 3, k1 = Math.floor(phase) % 3, k2 = (k1 + 1) % 3, mix = phase - Math.floor(phase);
  ctx2.globalCompositeOperation = "lighter";
  for (const [k, wgt] of [[k1, 1 - mix], [k2, mix]]) {
    g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, iw, ih); g.fillStyle = grad; g.fillRect(0, 0, iw, ih);
    g.globalCompositeOperation = "destination-in"; g.drawImage(face.masks[k], 0, 0);
    ctx2.globalAlpha = wgt; ctx2.drawImage(foilCv, 0, 0);
  }
  ctx2.globalAlpha = .1; ctx2.drawImage(face.silver, 0, 0);   // the silver of the foil itself
  // light print takes the foil's blue-green hue where the light catches it (colour, not brightness)
  g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, iw, ih); g.fillStyle = grad; g.fillRect(0, 0, iw, ih);
  g.globalCompositeOperation = "destination-in"; g.drawImage(face.silver, 0, 0);
  ctx2.globalCompositeOperation = "color"; ctx2.globalAlpha = .55; ctx2.drawImage(foilCv, 0, 0);
  ctx2.restore();
  ctx2.globalCompositeOperation = "source-over"; ctx2.globalAlpha = 1;

  // metal clip
  ctx2.fillStyle = "#9a9da3"; ctx2.fillRect(iw / 2 - iw * .45 / CW, -ih * .11 / CH, iw * .9 / CW, ih * .32 / CH);
}

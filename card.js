// Draws one prize card (front or back). Shared by print/cards.html (300 dpi export) and the site (3D texture).
// Landscape 85.6 x 54 mm + 2 mm bleed = 89.6 x 58 mm. Layout in mm from the bleed edge; safe area 5 mm in.
// Round 6 (INSPIRATION.md): the premium of a bank card (black, metal, engraving, restraint), the sense of a sports card
// (player, place, stats that matter, 1/1) and the identity of an ID card (portrait, labelled personal fields).

export const W = 89.6, H = 58;
export const TIERS = {
  1: { label: "CHAMPION",     suf: "st", metal: ["#fff1c2", "#c8973a", "#f6d684", "#8a6420"], line: "#e9c46a" },
  2: { label: "RUNNER-UP",    suf: "nd", metal: ["#ffffff", "#9aa3ae", "#e6eaf0", "#5f6772"], line: "#dfe4ec" },
  3: { label: "THIRD PLACE",  suf: "rd", metal: ["#f8d2ae", "#a9653a", "#e6a473", "#6e3d20"], line: "#e3a06c" },
  4: { label: "FOURTH PLACE", suf: "th", metal: ["#f2cbb2", "#9a5a3c", "#d99070", "#5e3220"], line: "#d98a66" },
};
const INK = "#f5f1ea", DIM = "rgba(245,241,234,.6)", FAINT = "rgba(245,241,234,.36)";
const SERIF = '"Cormorant Garamond", serif', SANS = '"Be Vietnam Pro", sans-serif';

export async function fontsReady() {
  await Promise.all([
    document.fonts.load(`600 40px ${SERIF}`, "1234 Trần Minh Khôi Đỗ"), document.fonts.load(`italic 500 40px ${SERIF}`, "st nd rd th Nº"),
    document.fonts.load(`500 40px ${SERIF}`, "1234"), document.fonts.load(`600 20px ${SANS}`, "CHAMPION Trần"),
    document.fonts.load(`500 20px ${SANS}`, "Khoa học Máy tính 2023"), document.fonts.load(`700 20px ${SANS}`, "VGU Chess 26"),
  ]);
}
// Card drawing runs on the CPU (willReadFrequently). Some Android GPUs (seen on a Vivo phone in Edge) silently drop
// the photo layer when the canvas is GPU-accelerated; the CPU path draws the same pixels everywhere.
export const CPU = { willReadFrequently: true };
// Loads a picture and copies it into a CPU canvas, so the card never draws straight from a GPU-held image.
export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => {
    const c = Object.assign(document.createElement("canvas"), { width: i.naturalWidth, height: i.naturalHeight });
    c.getContext("2d", CPU).drawImage(i, 0, 0); res(c);
  }; i.onerror = rej; i.src = src; });
}
const half = p => String(p).replace(/\.5$/, "½").replace(/^0½$/, "½");

function metal(ctx, s, stops, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0 * s, y0 * s, x1 * s, y1 * s);
  const [a, b, c, d] = stops;
  g.addColorStop(0, a); g.addColorStop(.36, b); g.addColorStop(.52, c); g.addColorStop(.78, d); g.addColorStop(1, b);
  return g;
}
function ground(ctx, s, cx, cy) {
  const g = ctx.createRadialGradient(cx * s, cy * s, 0, cx * s, cy * s, 80 * s);
  g.addColorStop(0, "#19171c"); g.addColorStop(.5, "#0e0d10"); g.addColorStop(1, "#060607");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W * s, H * s);
}
// rose-engine rosette: fine wavy rings, two interlocking sets (banknote / watch-dial guilloché)
function rosette(ctx, s, cx, cy, { r0, r1, rings, petals, amp, color, alpha, width }) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width * s; ctx.globalAlpha = alpha;
  for (const phase of [0, Math.PI / petals]) for (let j = 0; j < rings; j++) {
    const base = r0 + (r1 - r0) * j / Math.max(1, rings - 1), a = amp * (.35 + .65 * j / Math.max(1, rings - 1));
    ctx.beginPath();
    for (let k = 0; k <= 720; k++) {
      const t = k / 720 * Math.PI * 2, r = base + a * Math.sin(petals * t + phase + j * .19);
      const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
      k ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function waves(ctx, s, color, alpha) {
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = .055 * s;
  for (let i = -6; i < 40; i++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += .5) {
      const y = i * 1.6 + 2.2 * Math.sin(x / 7.5 + i * .35) + 1.1 * Math.sin(x / 2.9 - i * .2);
      x ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function text(ctx, s, str, x, y, { size, weight = 500, family = SANS, color = INK, spacing = 0, align = "left", italic = false }) {
  ctx.font = `${italic ? "italic " : ""}${weight} ${size * s}px ${family}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = `${size * spacing * s}px`; ctx.fillText(str, x * s, y * s);
  ctx.letterSpacing = "0px"; ctx.textAlign = "left";
}
function fit(ctx, s, str, weight, family, size, maxW) {
  ctx.font = `${weight} ${size * s}px ${family}`;
  const w = ctx.measureText(str).width / s;
  return w > maxW ? size * maxW / w : size;
}
function lockup(ctx, s, x, y) {
  text(ctx, s, "VGU Chess", x, y, { size: 3, weight: 700 });
  ctx.font = `700 ${3 * s}px ${SANS}`;
  const bx = x + ctx.measureText("VGU Chess").width / s + 1;
  ctx.strokeStyle = INK; ctx.lineWidth = .26 * s; ctx.beginPath(); ctx.roundRect(bx * s, (y - 2.8) * s, 5.3 * s, 3.5 * s, .75 * s); ctx.stroke();
  text(ctx, s, "26", bx + 2.65, y - .28, { size: 2.15, weight: 700, align: "center" });
}
function seal(ctx, s, t, rank, cx, cy, r) {   // the place, as a struck medal
  ctx.fillStyle = metal(ctx, s, t.metal, cx - r, cy - r, cx + r, cy + r);
  ctx.beginPath(); ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); ctx.fill();
  rosette(ctx, s, cx, cy, { r0: r * .64, r1: r * .92, rings: 7, petals: 16, amp: r * .045, color: "#000", alpha: .26, width: .05 });
  ctx.font = `600 ${r * .92 * s}px ${SANS}`;
  const nw = ctx.measureText(String(rank)).width / s;
  text(ctx, s, String(rank), cx - 1, cy + r * .33, { size: r * .92, weight: 600, family: SANS, color: "#1b1206", align: "center" });
  text(ctx, s, t.suf, cx - 1 + nw / 2 + .2, cy - r * .02, { size: r * .36, weight: 600, family: SERIF, color: "#1b1206", italic: true });
}
function field(ctx, s, label, value, x, y) {   // ID-card field: tiny label over the value
  text(ctx, s, label, x, y, { size: 1.3, weight: 600, color: FAINT, spacing: .3 });
  text(ctx, s, value || "", x, y + 3.1, { size: fit(ctx, s, value || "", 500, SANS, 2.35, 20), weight: 500 });
}
function record(rounds = []) {
  const n = k => rounds.filter(r => r.res === k).length;
  return rounds.length ? `${n("W")}W  ${n("D")}D  ${n("L")}L` : "";
}

// ---------- FRONT ----------
export function drawFront(canvas, card, photo, pxPerMm) {
  const s = pxPerMm, ctx = canvas.getContext("2d", CPU);
  canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
  const t = TIERS[card.rank];

  ground(ctx, s, 74, 14);
  waves(ctx, s, t.line, .05);
  rosette(ctx, s, 78, 12.5, { r0: 9, r1: 34, rings: 30, petals: 22, amp: .5, color: t.line, alpha: .16, width: .055 });

  // portrait window, like an ID card photo. Depth, back to front: window + engraving, a light behind the head,
  // the metal frame, then the winner with a soft shadow, the head rising clear above the frame (never touching the line).
  const px = 8.8, py = 15.6, pw = 30, ph = 37.4, pr = 2.2, cx = px + pw / 2;
  const win = c => { c.beginPath(); c.roundRect(px * s, py * s, pw * s, ph * s, pr * s); };
  ctx.save(); win(ctx); ctx.clip();
  ctx.fillStyle = "#121015"; ctx.fillRect(px * s, py * s, pw * s, ph * s);
  rosette(ctx, s, cx, 27, { r0: 4, r1: 22, rings: 26, petals: 20, amp: .45, color: t.line, alpha: .38, width: .055 });
  const glow = ctx.createRadialGradient(cx * s, 24 * s, 0, cx * s, 24 * s, 17 * s);
  glow.addColorStop(0, `${t.line}55`); glow.addColorStop(1, `${t.line}00`);
  ctx.fillStyle = glow; ctx.fillRect(px * s, py * s, pw * s, ph * s);
  ctx.restore();
  ctx.strokeStyle = metal(ctx, s, t.metal, px, py, px + pw, py + ph); ctx.lineWidth = .16 * s;
  win(ctx); ctx.stroke();
  if (photo) {
    const h = 61, w = h * photo.width / photo.height;
    const m = document.createElement("canvas"); m.width = canvas.width; m.height = canvas.height;
    const g = m.getContext("2d", CPU);
    g.drawImage(photo, (cx - w / 2) * s, .4 * s, w * s, h * s);
    g.globalCompositeOperation = "destination-in";        // keep: the window, plus the head rising above it
    win(g); g.rect((px + 2) * s, 0, (pw - 4) * s, (py + 2) * s); g.fill();
    g.globalCompositeOperation = "source-atop";           // the foot of the photo sinks into the window's shadow
    const fade = g.createLinearGradient(0, 40 * s, 0, (py + ph) * s);
    fade.addColorStop(0, "rgba(10,9,12,0)"); fade.addColorStop(1, "rgba(10,9,12,.92)");
    g.fillStyle = fade; g.fillRect(0, 40 * s, m.width, (py + ph - 40) * s);
    // soft shadow, built by hand: a dark copy stamped in a small ring. (shadowBlur on a full-size layer gets dropped
    // by some phone GPUs, and with it the whole photo.)
    const sh = document.createElement("canvas"); sh.width = m.width; sh.height = m.height;
    const sg = sh.getContext("2d", CPU); sg.drawImage(m, 0, 0);
    sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#000"; sg.fillRect(0, 0, sh.width, sh.height);
    ctx.save(); ctx.globalAlpha = .07;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI, r = .9 * s; ctx.drawImage(sh, Math.cos(a) * r, Math.sin(a) * r + .5 * s); }
    ctx.restore();
    ctx.drawImage(m, 0, 0);
  }

  // right column: who, what place, the few facts that matter
  const X = 43;
  lockup(ctx, s, X, 9.6);
  seal(ctx, s, t, card.rank, 77.4, 13.2, 6.4);

  text(ctx, s, t.label, X, 24.6, { size: 1.9, weight: 600, color: metal(ctx, s, t.metal, X, 22, X + 30, 25), spacing: .34 });
  const name = (card.name || "").trim();
  text(ctx, s, name, X - .3, 31.6, { size: fit(ctx, s, name, 600, SERIF, 7.4, 41.4), weight: 600, family: SERIF });

  field(ctx, s, "MAJOR", card.majorShort || card.major, X, 37.6);
  field(ctx, s, "INTAKE", card.intake, X + 24, 37.6);
  field(ctx, s, "SCORE", card.points != null ? `${half(card.points)} / 5` : "", X, 44.9);
  field(ctx, s, "RECORD", record(card.rounds), X + 24, 44.9);

  text(ctx, s, "SPORT WEEK 2026", X, 53, { size: 1.3, weight: 600, color: FAINT, spacing: .3 });
  text(ctx, s, "Nº 1/1", 84, 53, { size: 2.8, weight: 500, family: SERIF, italic: true, align: "right" });
  tapLine(ctx, s, t, 6.7, 52.6);
  return canvas;
}

// A hairline running up the left edge: the tap mark, a whisper of text, a line and an arrow. Read sideways, like edge text on a note.
function tapLine(ctx, s, t, x, y) {
  ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(-Math.PI / 2);
  const col = metal(ctx, s, t.metal, 0, -1, 24, 1);
  ctx.strokeStyle = col; ctx.lineWidth = .14 * s; ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-.2 * s, -.45 * s, (.45 + i * .42) * s, -.75, .75); ctx.stroke(); }
  ctx.font = `600 ${1.12 * s}px ${SANS}`; ctx.letterSpacing = `${.36 * s}px`; ctx.fillStyle = DIM; ctx.textBaseline = "alphabetic";
  const label = "TAP TO OPEN · NFC";
  ctx.fillText(label, 1.9 * s, 0);
  const end = 1.9 + ctx.measureText(label).width / s + 1.2;
  ctx.letterSpacing = "0px";
  ctx.beginPath(); ctx.moveTo(end * s, -.4 * s); ctx.lineTo((end + 6.5) * s, -.4 * s);
  ctx.moveTo((end + 5.7) * s, -1.05 * s); ctx.lineTo((end + 6.5) * s, -.4 * s); ctx.lineTo((end + 5.7) * s, .25 * s); ctx.stroke();
  ctx.restore();
}

// ---------- BACK: the medal reverse, and the holder's signature ----------
export function drawBack(canvas, card, photo, pxPerMm) {
  const s = pxPerMm, ctx = canvas.getContext("2d", CPU);
  canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
  const t = TIERS[card.rank], cx = W / 2, cy = 25.4;

  ground(ctx, s, cx, cy);
  waves(ctx, s, t.line, .05);
  rosette(ctx, s, cx, cy, { r0: 9.5, r1: 17.6, rings: 22, petals: 24, amp: .42, color: t.line, alpha: .5, width: .06 });

  ctx.strokeStyle = metal(ctx, s, t.metal, cx - 20, cy - 20, cx + 20, cy + 20); ctx.lineWidth = .16 * s;
  for (const r of [18.4, 21.6]) { ctx.beginPath(); ctx.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); ctx.stroke(); }
  const ring = "VGU SPORT WEEK  ·  CHESS TOURNAMENT  ·  MMXXVI  ·  CASTLEVANIA CLUB  ·  ";
  const R = 20;
  ctx.font = `600 ${1.5 * s}px ${SANS}`; ctx.fillStyle = DIM; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const adv = ch => ctx.measureText(ch).width / s + .3;
  const total = [...ring].reduce((a, ch) => a + adv(ch), 0), stretch = (Math.PI * 2 * R) / total;
  let ang = -Math.PI / 2;
  for (const ch of ring) {
    const w = adv(ch) * stretch, a = ang + (w / 2) / R;
    ctx.save(); ctx.translate((cx + R * Math.cos(a)) * s, (cy + R * Math.sin(a)) * s); ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0); ctx.restore(); ang += w / R;
  }

  ctx.fillStyle = "#0c0b0e"; ctx.beginPath(); ctx.arc(cx * s, cy * s, 9 * s, 0, Math.PI * 2); ctx.fill();
  ctx.font = `500 ${13 * s}px ${SANS}`;
  const nw = ctx.measureText(String(card.rank)).width / s;
  text(ctx, s, String(card.rank), cx - 1, cy + 4.6, { size: 13, weight: 500, family: SANS, color: metal(ctx, s, t.metal, cx - 6, cy - 8, cx + 6, cy + 6), align: "center" });
  text(ctx, s, t.suf, cx - 1 + nw / 2 + .3, cy - 1.4, { size: 4.2, weight: 500, family: SERIF, italic: true, color: metal(ctx, s, t.metal, cx, cy - 5, cx + 5, cy) });

  // the holder signs over this line at the ceremony (an ID card's signature, a sports card's autograph)
  ctx.strokeStyle = "rgba(245,241,234,.4)"; ctx.lineWidth = .12 * s;
  ctx.beginPath(); ctx.moveTo(24 * s, 50.2 * s); ctx.lineTo(65.6 * s, 50.2 * s); ctx.stroke();
  text(ctx, s, "HOLDER", cx, 52.9, { size: 1.25, weight: 600, color: FAINT, spacing: .3, align: "center" });
  text(ctx, s, "Nº 1/1", 84, 53, { size: 2.8, weight: 500, family: SERIF, italic: true, align: "right" });
  return canvas;
}

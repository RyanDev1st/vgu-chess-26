// Draws one prize card (front or back) onto a canvas. Shared by print/cards.html (300 dpi export) and the site (3D texture).
// Size: bank card portrait 54 x 85.6 mm + 2 mm bleed = 58 x 89.6 mm. All layout below is in mm from the bleed edge.
// Design rules: ../INSPIRATION.md (Ship badge language + chrome player card).

export const W = 58, H = 89.6;
export const TIERS = {
  1: { color: "#f2cf74", label: "CHAMPION" },
  2: { color: "#e9ecf1", label: "RUNNER-UP" },
  3: { color: "#e3a06c", label: "THIRD PLACE" },
  4: { color: "#d98a66", label: "FOURTH PLACE" },
};
const BG = "#0a0a0b", INK = "#f4f2ee", DIM = "rgba(244,242,238,.55)";
const SANS = '"Be Vietnam Pro", sans-serif', MONO = '"JB Mono", monospace';

export async function fontsReady() {
  await Promise.all([
    document.fonts.load(`800 40px ${SANS}`, "1234½"), document.fonts.load(`700 20px ${SANS}`, "Trần Khôi"),
    document.fonts.load(`600 20px ${SANS}`, "Trần Khôi"), document.fonts.load(`500 20px ${SANS}`, "Trần Khôi"),
    document.fonts.load(`500 20px ${MONO}`, "CHAMPION 1/1"),
  ]);
}

const rng = seed => () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const half = p => String(p).replace(/\.5$/, "½").replace(/^0½$/, "½");

// ---------- the broken numeral: glyph cut on a chessboard grid, a few squares jump like knights, one corner dissolves ----------
// box = where the glyph must fit (mm). avoid = a rect jumped squares must not land on (the face). clip = safe area.
function fracture(s, text, { box, cell, color, seed, dissolveAt = [0.85, 0.12], avoid = null, clip }) {
  const R = rng(seed);
  const src = document.createElement("canvas");
  const g = src.getContext("2d");
  g.font = `800 100px ${SANS}`;
  const m0 = g.measureText(text);
  const fit = Math.min(box.w * s / (m0.actualBoundingBoxRight + m0.actualBoundingBoxLeft), box.h * s / (m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent));
  const font = `800 ${100 * fit}px ${SANS}`;
  g.font = font;
  const m = g.measureText(text);
  const gw = Math.ceil(m.actualBoundingBoxRight + m.actualBoundingBoxLeft), gh = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
  src.width = gw + 2; src.height = gh + 2;
  g.font = font; g.fillStyle = color; g.textBaseline = "alphabetic";
  g.fillText(text, m.actualBoundingBoxLeft + 1, m.actualBoundingBoxAscent + 1);
  const x = box.x + (box.w - gw / s) * (box.alignX ?? .5), y = box.y + (box.h - gh / s) / 2;
  const alpha = g.getImageData(0, 0, src.width, src.height).data;
  const ink = (px, py) => px >= 0 && py >= 0 && px < src.width && py < src.height && alpha[(Math.floor(py) * src.width + Math.floor(px)) * 4 + 3] > 128;

  const c = Math.round(cell * s), cols = Math.ceil(src.width / c), rows = Math.ceil(src.height / c); // whole pixels: no seams
  const ox = Math.round(x * s), oy = Math.round(y * s);
  const dc = [Math.floor(cols * dissolveAt[0]), Math.floor(rows * dissolveAt[1])];
  const back = [], front = [], dots = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let has = false;
    for (let k = 0; k < 9 && !has; k++) has = ink(i * c + (k % 3 + .5) * c / 3, j * c + (Math.floor(k / 3) + .5) * c / 3);
    if (!has) continue;
    const d = Math.hypot(i - dc[0], j - dc[1]);
    const r = R();
    if (d < 1.7) dots.push([i, j, d]);                                    // the dissolving corner
    else if (r < .07) continue;                                           // a captured square
    else if (r < .15) {                                                   // a knight jump: drawn in front of the player
      const [mx, my] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]][Math.floor(R() * 8)];
      const dx = x + (i + mx) * cell, dy = y + (j + my) * cell;
      const onFace = avoid && dx + cell > avoid.x && dx < avoid.x + avoid.w && dy + cell > avoid.y && dy < avoid.y + avoid.h;
      const inside = dx >= clip.x && dy >= clip.y && dx + cell <= clip.x + clip.w && dy + cell <= clip.y + clip.h;
      if (onFace || !inside) back.push([i, j, i, j]); else front.push([i, j, i + mx, j + my]);
    } else back.push([i, j, i, j]);
  }
  const drawCells = (ctx, list) => { for (const [i, j, ti, tj] of list) ctx.drawImage(src, i * c, j * c, c, c, ox + ti * c, oy + tj * c, c, c); };
  const drawDots = ctx => {
    ctx.fillStyle = color;
    const step = .42 * s;
    for (const [i, j, d] of dots) for (let py = j * c; py < (j + 1) * c; py += step) for (let px = i * c; px < (i + 1) * c; px += step) {
      if (!ink(px, py)) continue;
      const keep = 1 - d / 1.9;
      if (R() > keep) continue;
      // grains drift up and outwards, like the particles leaving the Ship "S"
      const drift = (1 - keep) * 2.2 * c;
      ctx.beginPath();
      ctx.arc(ox + px + (R() - .3) * drift, oy + py - R() * drift, (.12 + R() * .16) * s, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const clipped = fn => ctx => { ctx.save(); ctx.beginPath(); ctx.rect(clip.x * s, clip.y * s, clip.w * s, clip.h * s); ctx.clip(); fn(ctx); ctx.restore(); };
  return { back: clipped(ctx => { drawCells(ctx, back); drawDots(ctx); }), front: clipped(ctx => drawCells(ctx, front)) };
}

function lockup(ctx, s, x, y) {
  ctx.fillStyle = INK; ctx.font = `700 ${3.1 * s}px ${SANS}`; ctx.textBaseline = "alphabetic";
  ctx.fillText("VGU Chess", x * s, y * s);
  const w = ctx.measureText("VGU Chess").width / s;
  const bx = x + w + 1.1, bw = 5.4, bh = 3.6;
  ctx.lineWidth = .3 * s; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.roundRect(bx * s, (y - 3) * s, bw * s, bh * s, .8 * s); ctx.stroke();
  ctx.font = `700 ${2.3 * s}px ${SANS}`; ctx.textAlign = "center";
  ctx.fillText("26", (bx + bw / 2) * s, (y - .35) * s); ctx.textAlign = "left";
}

function mono(ctx, s, text, x, y, size, color, align = "left", spacing = .14) {
  ctx.font = `500 ${size * s}px ${MONO}`; ctx.fillStyle = color; ctx.textAlign = align;
  ctx.letterSpacing = `${size * spacing * s}px`;
  ctx.fillText(text, x * s, y * s);
  ctx.letterSpacing = "0px"; ctx.textAlign = "left";
}

// ---------- FRONT ----------
export function drawFront(canvas, card, photo, pxPerMm) {
  const s = pxPerMm, ctx = canvas.getContext("2d");
  canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
  const t = TIERS[card.rank];
  ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const num = fracture(s, String(card.rank), {
    box: { x: 13, y: 14, w: 39, h: 52, alignX: .62 }, cell: 5.2, color: t.color, seed: 1000 + card.rank * 17,
    dissolveAt: [.95, .5], avoid: { x: 16, y: 25, w: 26, h: 30 }, clip: { x: 3, y: 12.4, w: 52, h: 68 },
  });
  num.back(ctx);

  if (photo) {
    // the winner, cut out, standing in front of the number (chrome-card "in and out of the frame")
    const ph = 101, pw = ph * photo.width / photo.height, px = W / 2 - pw / 2 - 2.5, py = 16;
    ctx.drawImage(photo, px * s, py * s, pw * s, ph * s);
    const fade = ctx.createLinearGradient(0, 57 * s, 0, 80 * s);
    fade.addColorStop(0, "rgba(10,10,11,0)"); fade.addColorStop(1, "rgba(10,10,11,.97)");
    ctx.fillStyle = fade; ctx.fillRect(0, 57 * s, canvas.width, canvas.height);
  }
  num.front(ctx);

  lockup(ctx, s, 6, 9.2);
  mono(ctx, s, card.date || "19.11.2026", 52, 8.9, 2.1, DIM, "right");

  // name block, bottom-left: family + middle name, then the given name people actually call them by
  const words = (card.name || "").trim().split(/\s+/);
  const given = words.pop() || "", family = words.join(" ");
  ctx.fillStyle = INK; ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${3.9 * s}px ${SANS}`; ctx.fillText(family, 6 * s, 68.4 * s);
  ctx.font = `700 ${6.6 * s}px ${SANS}`; ctx.fillText(given, 5.8 * s, 75.4 * s);
  mono(ctx, s, t.label, 6, 79.6, 2.3, t.color);
  mono(ctx, s, `${half(card.points ?? "")} PTS  SWISS 5 RDS`, 6, 83.6, 1.9, DIM);

  // the closing block, bottom-right: a 1/1 serial, because every one of these cards is unique
  ctx.fillStyle = t.color;
  ctx.beginPath(); ctx.roundRect(44.4 * s, 80.2 * s, 7.6 * s, 4 * s, .5 * s); ctx.fill();
  mono(ctx, s, "1/1", 48.2, 83.15, 2.1, BG, "center", .04);
  return canvas;
}

// ---------- BACK: the stats side ----------
export function drawBack(canvas, card, pxPerMm) {
  const s = pxPerMm, ctx = canvas.getContext("2d");
  canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
  const t = TIERS[card.rank];
  ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height);

  lockup(ctx, s, 6, 9.2);
  mono(ctx, s, "1/1", 52, 8.9, 2.1, DIM, "right");

  const pts = fracture(s, half(card.points ?? 0), {
    box: { x: 6, y: 15, w: 40, h: 24, alignX: 0 }, cell: 3.3, color: t.color, seed: 77 + card.rank,
    dissolveAt: [.95, .2], clip: { x: 5, y: 12.4, w: 48, h: 29 },
  });
  pts.back(ctx); pts.front(ctx);
  mono(ctx, s, "POINTS OF 5", 6, 45.4, 2, DIM);
  mono(ctx, s, t.label, 6, 49.2, 2.3, t.color);

  let y = 57.5;
  ctx.strokeStyle = "rgba(244,242,238,.16)"; ctx.lineWidth = .2 * s;
  ctx.beginPath(); ctx.moveTo(6 * s, (y - 3.6) * s); ctx.lineTo(52 * s, (y - 3.6) * s); ctx.stroke();
  for (const [i, r] of (card.rounds || []).entries()) {
    mono(ctx, s, `R${i + 1}`, 6, y, 2, DIM);
    ctx.fillStyle = INK; ctx.font = `500 ${2.55 * s}px ${SANS}`; ctx.fillText(r.opp || "", 12.4 * s, y * s);
    const res = r.res === "W" ? "1" : r.res === "D" ? "½" : "0";
    mono(ctx, s, res, 52, y, 2.3, r.res === "W" ? t.color : DIM, "right", 0);
    y += 4.7;
  }
  mono(ctx, s, "VGU SPORT WEEK 2026", 6, 83.6, 1.9, DIM);
  mono(ctx, s, "16-19.11", 52, 83.6, 1.9, DIM, "right");
  return canvas;
}

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

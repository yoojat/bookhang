import {
  createPicture,
  PaintStyle,
  Skia,
  SkCanvas,
  SkPaint,
  SkPath,
  SkPicture,
  StrokeCap,
  StrokeJoin,
} from '@shopify/react-native-skia';

import { CHICKEN, COLORS, SHARK } from './config';
import { GameState, isHighTide } from './engine';
import { drawShot } from './cannon';
import { drawNet } from './net';
import { fill, stroke } from './paint';
import { drawChicken, drawCoffee, drawFish, drawShark, drawSpectator } from './sprites';
import {
  BRIDGES,
  CANAL_WIDTH,
  CROWD,
  EXIT_S,
  GATES,
  QUEUE,
  HALF_W,
  PATH,
  pointAt,
  SEA_Y,
  SHOP,
  Spectator,
  TOTAL_LENGTH,
  TREES,
  WORLD,
} from './map';

const paintCache = new Map<string, SkPaint>();

let worldPath: SkPath | null = null;
function getWorldPath() {
  if (!worldPath) {
    worldPath = Skia.Path.Make();
    worldPath.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) worldPath.lineTo(PATH[i].x, PATH[i].y);
  }
  return worldPath;
}

function wide(color: string, width: number): SkPaint {
  const key = `w:${color}:${width}`;
  let p = paintCache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    p.setStrokeCap(StrokeCap.Round);
    p.setStrokeJoin(StrokeJoin.Round);
    paintCache.set(key, p);
  }
  return p;
}

const TREE_TONES = ['#4f9a4a', '#5aa955', '#3f8741'];

function drawLand(canvas: SkCanvas) {
  const { minX, minY, maxX, maxY } = WORLD;
  canvas.drawRect(Skia.XYWHRect(minX, minY, maxX - minX, SEA_Y - minY), fill(COLORS.land));
  // 바다
  canvas.drawRect(Skia.XYWHRect(minX, SEA_Y, maxX - minX, maxY - SEA_Y), fill(COLORS.sea));
  canvas.drawRect(Skia.XYWHRect(minX, SEA_Y + 140, maxX - minX, maxY - SEA_Y - 140), fill(COLORS.seaDeep));
  // 방파제
  canvas.drawRect(Skia.XYWHRect(minX, SEA_Y - 60, maxX - minX, 70), fill(COLORS.seawall));
}

function drawCanal(canvas: SkCanvas) {
  const path = getWorldPath();
  canvas.drawPath(path, wide(COLORS.promenade, CANAL_WIDTH + 190));
  canvas.drawPath(path, wide(COLORS.bankEdge, CANAL_WIDTH + 44));
  canvas.drawPath(path, wide(COLORS.water, CANAL_WIDTH));
  canvas.drawPath(path, wide(COLORS.waterLight, CANAL_WIDTH * 0.62));
  canvas.drawPath(path, wide(COLORS.waterDeep, CANAL_WIDTH * 0.2));
  // 수로가 바다와 만나는 부분은 방파제 위로 물을 덮는다.
  canvas.drawRect(
    Skia.XYWHRect(PATH[PATH.length - 1].x - HALF_W, SEA_Y - 60, CANAL_WIDTH, 70),
    fill(COLORS.sea),
  );
}

function box(canvas: SkCanvas, x: number, y: number, w: number, h: number, color: string, ow = 3) {
  const r = Skia.XYWHRect(x, y, w, h);
  canvas.drawRect(r, fill(color));
  if (ow > 0) canvas.drawRect(r, stroke('#2a3342', ow, true));
}

const NAVY = '#1f3f77';
const NAVY_DARK = '#12295a';
const SKY = '#bfe6f5';

// 김이 나는 커피잔 아이콘: 가게가 카페라는 걸 알려준다.
function drawCup(canvas: SkCanvas, cx: number, cy: number, scale: number, body: string, line: string) {
  canvas.save();
  canvas.translate(cx, cy);
  canvas.scale(scale, scale);
  // 김
  for (const dx of [-6, 0, 6]) {
    const steam = Skia.Path.Make();
    steam.moveTo(dx, -12);
    steam.quadTo(dx - 4, -18, dx, -23);
    steam.quadTo(dx + 4, -28, dx, -33);
    canvas.drawPath(steam, stroke(body, 2.4, true));
  }
  // 잔 받침, 손잡이, 잔
  canvas.drawOval(Skia.XYWHRect(-17, 8, 34, 8), fill(body));
  canvas.drawOval(Skia.XYWHRect(5, -6, 15, 15), stroke(body, 3.6, true));
  const cup = Skia.Path.Make();
  cup.moveTo(-13, -10);
  cup.lineTo(13, -10);
  cup.lineTo(9, 10);
  cup.lineTo(-9, 10);
  cup.close();
  canvas.drawPath(cup, fill(body));
  canvas.drawLine(-11, -4, 11, -4, stroke(line, 2.2, true));
  canvas.restore();
}

// 위에서 비스듬히 본 작은 카페 "어디야". 남색 간판과 차양, 커피잔 그림으로 카페라는 인상을 준다.
// 간판 글자는 화면 위에 따로 얹는다.
function drawShop(canvas: SkCanvas) {
  const { x, y, w, h } = SHOP;
  const roofH = h * 0.4;
  const wallY = y + roofH;
  const wallH = h - roofH;

  // 그림자와 앞마당 타일 바닥
  canvas.drawOval(Skia.XYWHRect(x - 10, y + h - 14, w + 20, 36), fill('rgba(0,0,0,0.16)'));
  box(canvas, x - 30, y + h + 6, w + 60, 150, '#e6ebf1', 0);
  for (let i = 1; i < 6; i++) {
    canvas.drawLine(x - 30 + ((w + 60) * i) / 6, y + h + 6, x - 30 + ((w + 60) * i) / 6, y + h + 156, stroke('rgba(120,140,170,0.25)', 2));
  }

  // 흰 벽과 남색 지붕
  box(canvas, x, wallY, w, wallH, '#f7f9fc');
  const roof = Skia.Path.Make();
  roof.moveTo(x - 16, wallY + 6);
  roof.lineTo(x + 24, y);
  roof.lineTo(x + w - 24, y);
  roof.lineTo(x + w + 16, wallY + 6);
  roof.close();
  canvas.drawPath(roof, fill(NAVY));
  canvas.drawLine(x + 30, y + 8, x + w - 30, y + 8, stroke('rgba(255,255,255,0.22)', 4, true));
  canvas.drawPath(roof, stroke('#2a3342', 3.4, true));

  // 남색 간판: 왼쪽에 커피잔, 가운데에 가게 이름이 얹힌다.
  const bx = x + 24;
  const by = y + roofH * 0.5;
  box(canvas, bx, by, w - 48, 54, NAVY_DARK);
  canvas.drawRect(Skia.XYWHRect(bx + 5, by + 5, w - 58, 44), stroke('rgba(255,255,255,0.8)', 2));
  drawCup(canvas, bx + 36, by + 31, 0.8, '#ffffff', NAVY_DARK);

  // 남색/흰색 줄무늬 차양
  const stripeW = w / 10;
  for (let i = 0; i < 10; i++) {
    const c = i % 2 === 0 ? '#2a4f8f' : '#ffffff';
    box(canvas, x + i * stripeW, wallY, stripeW, 26, c, 2);
    canvas.drawCircle(x + i * stripeW + stripeW / 2, wallY + 26, stripeW / 2, fill(c));
    canvas.drawCircle(x + i * stripeW + stripeW / 2, wallY + 26, stripeW / 2, stroke('#2a3342', 2, true));
  }

  // 큰 유리창(커피잔 스티커)과 유리문
  box(canvas, x + 20, wallY + 46, 78, 62, SKY);
  box(canvas, x + w - 98, wallY + 46, 78, 62, SKY);
  canvas.drawLine(x + 28, wallY + 56, x + 56, wallY + 56, stroke('rgba(255,255,255,0.8)', 4, true));
  canvas.drawLine(x + w - 90, wallY + 56, x + w - 62, wallY + 56, stroke('rgba(255,255,255,0.8)', 4, true));
  drawCup(canvas, x + 59, wallY + 86, 0.55, NAVY, SKY);
  drawCup(canvas, x + w - 59, wallY + 86, 0.55, NAVY, SKY);
  box(canvas, x + w / 2 - 24, wallY + 40, 48, wallH - 40, SKY);
  canvas.drawLine(x + w / 2, wallY + 40, x + w / 2, y + h, stroke('#2a3342', 2.4, true));
  // OPEN 푯말
  box(canvas, x + w / 2 - 14, wallY + 72, 28, 12, '#ff6b6b', 2);
  canvas.drawLine(x + w / 2 - 8, wallY + 78, x + w / 2 + 8, wallY + 78, stroke('#ffffff', 2.6, true));

  // 입구 옆 메뉴판(칠판)과 화분
  box(canvas, x + w / 2 + 34, y + h - 54, 40, 54, '#2a2f3a');
  drawCup(canvas, x + w / 2 + 54, y + h - 28, 0.4, '#ffffff', '#2a2f3a');
  canvas.drawLine(x + w / 2 + 40, y + h - 10, x + w / 2 + 68, y + h - 10, stroke('rgba(255,255,255,0.7)', 2, true));
  for (const px of [x + 10, x + w - 10]) {
    canvas.drawCircle(px, y + h - 6, 13, fill('#d98c5f'));
    canvas.drawCircle(px, y + h - 6, 13, stroke('#2a3342', 2.4, true));
    canvas.drawCircle(px, y + h - 16, 11, fill('#5aa955'));
    canvas.drawCircle(px - 4, y + h - 19, 3.4, fill('#ff8fb3'));
    canvas.drawCircle(px + 5, y + h - 15, 3.4, fill('#ffd34a'));
  }

  // 앞마당 테이블과 남색 파라솔
  for (const tx of [x + 44, x + w - 44]) {
    const ty = y + h + 74;
    canvas.drawCircle(tx, ty + 8, 34, fill('rgba(0,0,0,0.12)'));
    canvas.drawCircle(tx, ty, 34, fill(NAVY));
    canvas.drawCircle(tx, ty, 34, stroke('#2a3342', 3, true));
    canvas.drawCircle(tx, ty, 8, fill('#ffffff'));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      canvas.drawLine(tx, ty, tx + Math.cos(a) * 33, ty + Math.sin(a) * 33, stroke('rgba(255,255,255,0.5)', 3, true));
    }
  }
}

function drawTrees(canvas: SkCanvas) {
  for (const t of TREES) {
    canvas.drawCircle(t.x + 8, t.y + 10, t.r, fill('rgba(0,0,0,0.12)'));
    canvas.drawCircle(t.x, t.y, t.r, fill(TREE_TONES[t.tone]));
    canvas.drawCircle(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.45, fill('rgba(255,255,255,0.14)'));
  }
}

function drawBridge(canvas: SkCanvas, s: number, kind: 'wood' | 'white') {
  const p = pointAt(s);
  const len = CANAL_WIDTH + 230;
  const thick = kind === 'wood' ? 64 : 76;
  canvas.save();
  canvas.translate(p.x, p.y);
  canvas.rotate(((p.angle + Math.PI / 2) * 180) / Math.PI, 0, 0);
  // 수면에 드리운 그림자
  canvas.drawRect(Skia.XYWHRect(-len / 2 + 10, -thick / 2 + 30, len - 20, thick), fill('rgba(0,40,70,0.22)'));
  if (kind === 'wood') {
    canvas.drawRect(Skia.XYWHRect(-len / 2, -thick / 2, len, thick), fill(COLORS.woodDeck));
    for (let x = -len / 2 + 14; x < len / 2; x += 28) {
      canvas.drawRect(Skia.XYWHRect(x, -thick / 2, 3, thick), fill(COLORS.woodDeckLine));
    }
    canvas.drawRect(Skia.XYWHRect(-len / 2, -thick / 2, len, 6), fill(COLORS.woodRail));
    canvas.drawRect(Skia.XYWHRect(-len / 2, thick / 2 - 6, len, 6), fill(COLORS.woodRail));
  } else {
    canvas.drawRect(Skia.XYWHRect(-len / 2, -thick / 2, len, thick), fill(COLORS.whiteDeck));
    canvas.drawRect(Skia.XYWHRect(-len / 2, -thick / 2, len, 5), fill(COLORS.whiteRail));
    canvas.drawRect(Skia.XYWHRect(-len / 2, thick / 2 - 5, len, 5), fill(COLORS.whiteRail));
    // 위에서 본 아치 케이블
    for (let x = -len / 2 + 30; x < len / 2; x += 34) {
      canvas.drawLine(x, -thick / 2, x + 12, thick / 2, stroke('rgba(120,140,150,0.55)', 2));
    }
  }
  canvas.restore();
}

// 차단 그물/부표 줄. 수로를 가로질러 놓인다.
function drawGate(canvas: SkCanvas, s: number, net: boolean) {
  const p = pointAt(s);
  const nx = -Math.sin(p.angle);
  const ny = Math.cos(p.angle);
  const ax = p.x - nx * (HALF_W + 20);
  const ay = p.y - ny * (HALF_W + 20);
  const bx = p.x + nx * (HALF_W + 20);
  const by = p.y + ny * (HALF_W + 20);
  if (net) {
    const tx = Math.cos(p.angle);
    const ty = Math.sin(p.angle);
    for (const o of [-14, 0, 14]) {
      canvas.drawLine(ax + tx * o, ay + ty * o, bx + tx * o, by + ty * o, stroke('rgba(235,240,240,0.55)', 4));
    }
    canvas.drawLine(ax, ay, bx, by, stroke('rgba(235,240,240,0.35)', 28));
  }
  const count = Math.floor((HALF_W * 2 + 40) / 38);
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    canvas.drawCircle(x, y, 9, fill(COLORS.buoy));
    canvas.drawCircle(x - 2, y - 2, 3, fill('rgba(255,255,255,0.6)'));
  }
}

let worldBack: SkPicture | null = null;
let worldFront: SkPicture | null = null;

// 움직이지 않는 맵은 한 번만 그려서 재사용한다.
function getWorldPictures() {
  if (!worldBack || !worldFront) {
    const bounds = Skia.XYWHRect(WORLD.minX, WORLD.minY, WORLD.maxX - WORLD.minX, WORLD.maxY - WORLD.minY);
    worldBack = createPicture((canvas) => {
      drawLand(canvas);
      drawCanal(canvas);
      drawShop(canvas);
      drawTrees(canvas);
    }, bounds);
    worldFront = createPicture((canvas) => {
      for (const gate of GATES) drawGate(canvas, gate.s, gate.name !== '');
      for (const b of BRIDGES) drawBridge(canvas, b.s, b.kind);
    }, bounds);
  }
  return { back: worldBack, front: worldFront };
}

// 수로를 따라 흐르는 물결 무늬
function drawFlow(canvas: SkCanvas, g: GameState) {
  const ripple = stroke(COLORS.ripple, 3);
  const count = 70;
  const spacing = TOTAL_LENGTH / count;
  for (let i = 0; i < count; i++) {
    const s = (i * spacing + g.time * 26) % TOTAL_LENGTH;
    const p = pointAt(s);
    if (Math.abs(p.x - g.camera.x) > 700 || Math.abs(p.y - g.camera.y) > 1000) continue;
    const off = (((i * 37) % 100) / 100 - 0.5) * CANAL_WIDTH * 0.7;
    const x = p.x - Math.sin(p.angle) * off;
    const y = p.y + Math.cos(p.angle) * off;
    canvas.drawLine(x, y, x + Math.cos(p.angle) * 34, y + Math.sin(p.angle) * 34, ripple);
  }
}

function drawJoystick(canvas: SkCanvas, g: GameState) {
  const j = g.joystick;
  if (!j.active) return;
  const m = Math.min(Math.hypot(j.dx, j.dy), SHARK.joystickRadius);
  const a = Math.atan2(j.dy, j.dx);
  canvas.drawCircle(j.ox, j.oy, SHARK.joystickRadius, fill('rgba(255,255,255,0.10)'));
  canvas.drawCircle(j.ox, j.oy, SHARK.joystickRadius, stroke('rgba(255,255,255,0.35)', 2));
  canvas.drawCircle(j.ox + Math.cos(a) * m, j.oy + Math.sin(a) * m, 20, fill('rgba(255,255,255,0.45)'));
}

// 바다로 나가는 출구 표시: 수로 끝으로 이어지는 흰 화살표가 차례로 깜빡인다.
function drawExitMarker(canvas: SkCanvas, g: GameState) {
  const alphas = ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0.95)'];
  for (let i = 0; i < 3; i++) {
    const p = pointAt(EXIT_S - 230 + i * 56);
    if (Math.abs(p.x - g.camera.x) > 700 || Math.abs(p.y - g.camera.y) > 1000) continue;
    const lit = Math.floor(g.time * 3) % 3 === i;
    const tx = Math.cos(p.angle);
    const ty = Math.sin(p.angle);
    const nx = -ty;
    const ny = tx;
    const paint = stroke(lit ? alphas[2] : alphas[0], 8, true);
    canvas.drawLine(p.x - nx * 40 - tx * 22, p.y - ny * 40 - ty * 22, p.x + tx * 10, p.y + ty * 10, paint);
    canvas.drawLine(p.x + nx * 40 - tx * 22, p.y + ny * 40 - ty * 22, p.x + tx * 10, p.y + ty * 10, paint);
  }
}

// 상어가 이 거리 안으로 오면 구경꾼이 하트를 띄우며 좋아한다.
const LOVE_DISTANCE = 330;

// 수로 주변에서 구경하는 사람들. 화면에 보이는 사람만 y 순서대로 그린다.
function drawCrowd(canvas: SkCanvas, g: GameState) {
  const halfW = g.width / g.zoom / 2 + 70;
  const halfH = g.height / g.zoom / 2 + 90;
  const visible: number[] = [];
  for (let i = 0; i < g.crowd.shown; i++) {
    const p = CROWD[i];
    if (Math.abs(p.x - g.camera.x) < halfW && Math.abs(p.y - g.camera.y) < halfH) visible.push(i);
  }
  visible.sort((a, b) => CROWD[a].y - CROWD[b].y);
  const cheering = g.cheerUntil > g.time;
  for (const i of visible) {
    const p = CROWD[i];
    // 상어가 먹이를 먹으면 가까운 사람들이 응원하고, 상어가 바로 옆으로 오면 하트를 띄우며 좋아한다.
    const d = Math.hypot(p.x - g.shark.x, p.y - g.shark.y);
    const close = d < LOVE_DISTANCE;
    drawSpectator(canvas, p, g.time, g.crowd.appear[i], (cheering && d < 800) || close, g.shark.x >= p.x ? 1 : -1, null, false, close);
  }
}

// 어디야 카페 앞에 줄 선 손님들. 구경꾼이 늘수록 줄이 길어지고, 상어가 먹으면 함께 응원한다.
function drawQueue(canvas: SkCanvas, g: GameState) {
  const halfW = g.width / g.zoom / 2 + 70;
  const halfH = g.height / g.zoom / 2 + 90;
  const cheering = g.cheerUntil > g.time;
  // 아래쪽 손님이 앞에 보이도록 y 순서(위 -> 아래)로 그린다. 줄은 이미 위에서 아래로 늘어서 있다.
  for (let i = 0; i < g.queue.shown; i++) {
    const p = QUEUE[i];
    if (Math.abs(p.x - g.camera.x) > halfW || Math.abs(p.y - g.camera.y) > halfH) continue;
    const close = Math.hypot(p.x - g.shark.x, p.y - g.shark.y) < LOVE_DISTANCE;
    drawSpectator(canvas, p, g.time, g.queue.appear[i], cheering || close, g.shark.x >= p.x ? 1 : -1, null, false, close);
  }
}

// 물건 던지는 사람: 생닭은 요리사, 아이스 아메리카노는 어디야 바리스타. 던지기 직전에는 팔을 번쩍 든다.
function drawThrower(canvas: SkCanvas, g: GameState) {
  const th = g.thrower;
  if (!th) return;
  const chef: Spectator = {
    x: th.x,
    y: th.y,
    shirt: 6,
    pants: 0,
    hair: 1,
    skin: 0,
    cap: -1,
    phone: false,
    phase: 0,
    hairStyle: 0,
    dress: false,
    kid: false,
    balloon: -1,
    cup: false,
  };
  const windup = th.t > 0.25 && th.t < CHICKEN.throwAt + 0.4;
  drawSpectator(canvas, chef, g.time, g.time - th.t, windup, th.lx >= th.x ? 1 : -1, th.kind === 'coffee' ? 'barista' : 'chef');
}

// flying=true 이면 공중에 떠 있는 닭만, false 이면 물에 떨어진 닭만 그린다.
function drawChickens(canvas: SkCanvas, g: GameState, flying: boolean) {
  for (const c of g.chickens) {
    if (c.t < CHICKEN.flight) {
      if (!flying) continue;
      const u = c.t / CHICKEN.flight;
      const draw = c.kind === 'coffee' ? drawCoffee : drawChicken;
      draw(canvas, c.sx + (c.x - c.sx) * u, c.sy + (c.y - c.sy) * u, g.time, Math.sin(Math.PI * u) * 120, u * 720, true);
    } else {
      if (flying) continue;
      const age = c.t - CHICKEN.flight;
      // 가라앉기 직전 2초 동안은 깜빡인다.
      const visible = age < CHICKEN.rest - 2 || Math.floor(age * 8) % 2 === 0;
      (c.kind === 'coffee' ? drawCoffee : drawChicken)(canvas, c.x, c.y, g.time, 0, 0, visible);
    }
  }
}

export function renderGame(g: GameState): SkPicture {
  return createPicture(
    (canvas) => {
      const { back, front } = getWorldPictures();
      canvas.save();
      canvas.translate(g.width / 2, g.height / 2);
      canvas.scale(g.zoom, g.zoom);
      canvas.translate(-g.camera.x, -g.camera.y);
      canvas.drawPicture(back);
      drawFlow(canvas, g);
      drawCrowd(canvas, g);
      drawQueue(canvas, g);
      drawThrower(canvas, g);
      drawChickens(canvas, g, false);
      for (const f of g.fish) drawFish(canvas, f, g.time);
      drawShark(canvas, g);
      drawChickens(canvas, g, true);
      for (const net of g.nets) drawNet(canvas, net, g.time, isHighTide(g));
      drawExitMarker(canvas, g);
      for (const shot of g.shots) drawShot(canvas, shot);
      // 다리와 그물은 상어 위로 지나간다.
      canvas.drawPicture(front);
      canvas.restore();
      drawJoystick(canvas, g);
    },
    { width: g.width, height: g.height },
  );
}

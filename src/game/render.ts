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

import { COLORS, FISH, SHARK } from './config';
import { Fish, GameState } from './engine';
import {
  BRIDGES,
  CANAL_WIDTH,
  GATES,
  HALF_W,
  PATH,
  pointAt,
  SEA_Y,
  TOTAL_LENGTH,
  TREES,
  WORLD,
} from './map';

const paintCache = new Map<string, SkPaint>();

function fill(color: string): SkPaint {
  let p = paintCache.get(color);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    paintCache.set(color, p);
  }
  return p;
}

function stroke(color: string, width: number): SkPaint {
  const key = `s:${color}:${width}`;
  let p = paintCache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    paintCache.set(key, p);
  }
  return p;
}

function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const path = Skia.Path.Make();
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);
  path.lineTo(x3, y3);
  path.close();
  return path;
}

// 위에서 내려다본 물고기 (머리가 +x 방향)
function drawFish(canvas: SkCanvas, f: Fish) {
  const spec = FISH[f.kind];
  const r = spec.radius;
  canvas.save();
  canvas.translate(f.x, f.y);
  canvas.rotate((f.angle * 180) / Math.PI, 0, 0);

  // 꼬리
  canvas.drawPath(triangle(-r * 0.8, 0, -r * 1.6, -r * 0.6, -r * 1.6, r * 0.6), fill(spec.color));
  // 몸통
  const bodyLen = f.kind === 'puffer' ? r : r * 1.3;
  const bodyWid = f.kind === 'puffer' ? r : r * 0.55;
  canvas.drawOval(Skia.XYWHRect(-bodyLen, -bodyWid, bodyLen * 2, bodyWid * 2), fill(spec.color));
  canvas.drawOval(
    Skia.XYWHRect(-bodyLen * 0.7, -bodyWid * 0.35, bodyLen * 1.5, bodyWid * 0.7),
    fill(spec.belly),
  );
  if (f.kind === 'puffer') {
    // 가시
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      canvas.drawCircle(Math.cos(a) * r, Math.sin(a) * r, 1.8, fill('#7a5d1c'));
    }
  }
  // 눈
  canvas.drawCircle(bodyLen * 0.55, -bodyWid * 0.5, Math.max(1.4, r * 0.14), fill('#111'));
  canvas.drawCircle(bodyLen * 0.55, bodyWid * 0.5, Math.max(1.4, r * 0.14), fill('#111'));
  canvas.restore();
}

// 위에서 내려다본 상어 (머리가 +x 방향, 길이 ≈ 반지름 * 4)
function drawShark(canvas: SkCanvas, g: GameState) {
  const s = g.shark;
  const k = s.radius / SHARK.baseRadius;

  // 피격 후 무적 시간에는 깜빡임
  if (s.blink > 0 && Math.floor(s.blink * 10) % 2 === 0) return;

  const swim = Math.sin(g.time * (4 + s.speed / 30)) * (0.25 + s.speed / 600);

  canvas.save();
  canvas.translate(s.x, s.y);
  canvas.rotate((s.angle * 180) / Math.PI, 0, 0);
  canvas.scale(k, k);

  // 꼬리지느러미 (좌우로 흔들림)
  canvas.save();
  canvas.translate(-36, 0);
  canvas.rotate((swim * 180) / Math.PI, 0, 0);
  canvas.drawPath(triangle(0, 0, -22, -15, -14, 0), fill(COLORS.sharkFin));
  canvas.drawPath(triangle(0, 0, -22, 15, -14, 0), fill(COLORS.sharkFin));
  canvas.restore();

  // 가슴지느러미
  canvas.drawPath(triangle(8, -9, -8, -30, -14, -9), fill(COLORS.sharkFin));
  canvas.drawPath(triangle(8, 9, -8, 30, -14, 9), fill(COLORS.sharkFin));

  // 몸통
  canvas.drawOval(Skia.XYWHRect(-40, -13, 80, 26), fill(COLORS.shark));
  canvas.drawOval(Skia.XYWHRect(-24, -6, 56, 12), fill(COLORS.sharkBelly));
  // 등지느러미 (위에서 보면 몸 중앙의 작은 삼각형)
  canvas.drawPath(triangle(2, 0, -14, -5, -14, 5), fill(COLORS.sharkFin));
  // 눈
  canvas.drawCircle(26, -8, 2.4, fill('#101820'));
  canvas.drawCircle(26, 8, 2.4, fill('#101820'));

  canvas.restore();
}

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
      for (const f of g.fish) drawFish(canvas, f);
      drawShark(canvas, g);
      // 다리와 그물은 상어 위로 지나간다.
      canvas.drawPicture(front);
      canvas.restore();
      drawJoystick(canvas, g);
    },
    { width: g.width, height: g.height },
  );
}

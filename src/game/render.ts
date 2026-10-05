import { createPicture, Skia, SkCanvas, SkPaint, SkPicture } from '@shopify/react-native-skia';

import { COLORS, FISH, SHARK } from './config';
import { Fish, GameState } from './engine';

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
    p.setStyle(1); // PaintStyle.Stroke
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

function drawBackground(canvas: SkCanvas, g: GameState) {
  canvas.drawRect(Skia.XYWHRect(0, 0, g.width, g.height), fill(COLORS.water));
  // 중앙부를 조금 더 깊은 색으로
  canvas.drawRect(
    Skia.XYWHRect(g.width * 0.25, 0, g.width * 0.5, g.height),
    fill(COLORS.waterDeep),
  );

  // 흐르는 물결
  const ripple = stroke(COLORS.ripple, 2);
  for (let i = 0; i < 9; i++) {
    const y = ((g.time * 14 + i * (g.height / 8)) % (g.height + 40)) - 20;
    const x = g.bankWidth + ((i * 97) % Math.max(1, g.width - g.bankWidth * 2 - 60));
    canvas.drawLine(x, y, x + 46, y + Math.sin(g.time + i) * 3, ripple);
  }

  // 양쪽 둑
  canvas.drawRect(Skia.XYWHRect(0, 0, g.bankWidth, g.height), fill(COLORS.bank));
  canvas.drawRect(Skia.XYWHRect(g.width - g.bankWidth, 0, g.bankWidth, g.height), fill(COLORS.bank));
  canvas.drawRect(Skia.XYWHRect(g.bankWidth - 3, 0, 3, g.height), fill(COLORS.bankEdge));
  canvas.drawRect(Skia.XYWHRect(g.width - g.bankWidth, 0, 3, g.height), fill(COLORS.bankEdge));
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
      drawBackground(canvas, g);
      for (const f of g.fish) drawFish(canvas, f);
      drawShark(canvas, g);
      drawJoystick(canvas, g);
    },
    { width: g.width, height: g.height },
  );
}

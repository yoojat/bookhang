// 메이플스토리처럼 굵은 외곽선과 큰 눈이 있는 귀여운 캐릭터 도안들.
import { Skia, SkCanvas } from '@shopify/react-native-skia';

import { FISH, SHARK } from './config';
import { Fish, GameState } from './engine';
import { Spectator } from './map';
import { fill, stroke } from './paint';

const OUT = '#2a3342';
const DEG = 180 / Math.PI;

const outline = (w: number) => stroke(OUT, w, true);

function oval(canvas: SkCanvas, x: number, y: number, w: number, h: number, color: string, ow = 3) {
  const rect = Skia.XYWHRect(x, y, w, h);
  canvas.drawOval(rect, fill(color));
  if (ow > 0) canvas.drawOval(rect, outline(ow));
}

function circle(canvas: SkCanvas, cx: number, cy: number, r: number, color: string, ow = 0) {
  canvas.drawCircle(cx, cy, r, fill(color));
  if (ow > 0) canvas.drawCircle(cx, cy, r, outline(ow));
}

function poly(canvas: SkCanvas, pts: [number, number][], color: string, ow = 3) {
  const path = Skia.Path.Make();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  path.close();
  canvas.drawPath(path, fill(color));
  if (ow > 0) canvas.drawPath(path, outline(ow));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// 상어 "북항이": 옆모습이 둥글둥글한 아기 상어. 이동 방향에 따라 좌우로 뒤집힌다.
// ---------------------------------------------------------------------------
const SHARK_BODY = '#86b4dc';
const SHARK_FIN = '#6a97c2';

export function drawShark(canvas: SkCanvas, g: GameState) {
  const s = g.shark;
  const k = s.radius / SHARK.baseRadius;

  // 피격 후 무적 시간에는 깜빡임
  if (s.blink > 0 && Math.floor(s.blink * 10) % 2 === 0) return;

  const wag = Math.sin(g.time * (5 + s.speed / 25)) * (9 + s.speed / 18);
  const bob = Math.sin(g.time * 3) * 2;

  canvas.save();
  canvas.translate(s.x, s.y + bob * k);
  canvas.scale(s.facing, 1);
  canvas.rotate(s.tilt * DEG, 0, 0);
  canvas.scale(k, k);

  // 그림자 느낌의 물결 (수면 위에 살짝 비침)
  oval(canvas, -44, 26, 92, 14, 'rgba(20,70,100,0.18)', 0);

  // 꼬리지느러미
  canvas.save();
  canvas.translate(-42, 2);
  canvas.rotate(wag, 0, 0);
  poly(canvas, [[2, 0], [-32, -32], [-22, 0], [-32, 30]], SHARK_FIN);
  canvas.restore();

  // 등지느러미
  poly(canvas, [[-12, -30], [6, -64], [28, -30]], SHARK_FIN);

  // 몸통과 배
  oval(canvas, -54, -37, 108, 74, SHARK_BODY);
  oval(canvas, -40, 4, 88, 29, '#f6fafc', 0);

  // 가슴지느러미
  poly(canvas, [[-6, 14], [-26, 42], [12, 28]], SHARK_FIN);

  // 아가미
  for (let i = 0; i < 3; i++) {
    canvas.drawLine(-14 + i * 8, -10, -18 + i * 8, 4, outline(2.4));
  }

  // 볼터치
  oval(canvas, 26, 6, 18, 11, 'rgba(255,115,140,0.6)', 0);

  // 눈
  circle(canvas, 25, -11, 13, '#ffffff', 3);
  circle(canvas, 27.5, -10, 8.5, '#1b2a3a');
  circle(canvas, 24.5, -13.5, 3.4, '#ffffff');
  circle(canvas, 30, -6.5, 1.8, '#ffffff');

  // 입: 먹는 동안에는 크게 벌린다.
  if (s.eat > 0) {
    oval(canvas, 28, 6, 26, 22, '#7a1f2b', 3);
    oval(canvas, 34, 19, 14, 8, '#ff8a9a', 0);
    poly(canvas, [[31, 8], [36, 16], [41, 8]], '#ffffff', 2);
    poly(canvas, [[42, 8], [47, 16], [52, 9]], '#ffffff', 2);
  } else {
    const smile = Skia.Path.Make();
    smile.moveTo(30, 10);
    smile.quadTo(41, 24, 52, 9);
    canvas.drawPath(smile, outline(3.6));
    poly(canvas, [[38, 16], [42, 22], [46, 15]], '#ffffff', 1.6);
  }

  canvas.restore();
}

// ---------------------------------------------------------------------------
// 물고기: 상어와 같은 스타일의 둥근 옆모습
// ---------------------------------------------------------------------------
export function drawFish(canvas: SkCanvas, f: Fish, time: number) {
  const spec = FISH[f.kind];
  const k = (spec.radius / 11) * 1.4;
  const cos = Math.cos(f.angle);
  const facing = cos >= 0 ? 1 : -1;
  const tilt = clamp(Math.atan2(Math.sin(f.angle), Math.abs(cos)), -0.9, 0.9);
  const wag = Math.sin(time * 9 + f.id) * 14;

  canvas.save();
  canvas.translate(f.x, f.y);
  canvas.scale(facing, 1);
  canvas.rotate(tilt * DEG, 0, 0);
  canvas.scale(k, k);

  if (f.kind === 'puffer') {
    // 가시
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cx = Math.cos(a) * 13;
      const cy = Math.sin(a) * 13;
      poly(canvas, [[cx - Math.sin(a) * 3.5, cy + Math.cos(a) * 3.5], [Math.cos(a) * 20, Math.sin(a) * 20], [cx + Math.sin(a) * 3.5, cy - Math.cos(a) * 3.5]], '#d9822b', 2);
    }
    poly(canvas, [[-12, 0], [-24, -8], [-24, 8]], '#e2a14a', 2.4);
    oval(canvas, -14, -14, 28, 28, spec.color);
    oval(canvas, -9, 3, 20, 9, spec.belly, 0);
    circle(canvas, 6, -4, 5.4, '#ffffff', 2);
    circle(canvas, 7, -4, 3, '#1b2a3a');
    oval(canvas, 4, 4, 8, 5, 'rgba(255,115,140,0.6)', 0);
    // 화난 눈썹: 건드리면 안 되는 물고기라는 표시
    canvas.drawLine(1, -11, 11, -8, outline(2.2));
    circle(canvas, 12, 5, 1.8, OUT);
  } else {
    canvas.save();
    canvas.translate(-13, 0);
    canvas.rotate(wag, 0, 0);
    poly(canvas, [[2, 0], [-13, -11], [-9, 0], [-13, 11]], spec.color, 2.4);
    canvas.restore();
    poly(canvas, [[-5, -8], [0, -15], [7, -8]], spec.color, 2.4);
    oval(canvas, -15, -10, 30, 20, spec.color, 2.6);
    oval(canvas, -11, 1.5, 24, 7, spec.belly, 0);
    circle(canvas, 7, -2.5, 4.8, '#ffffff', 2);
    circle(canvas, 8, -2.5, 2.8, '#1b2a3a');
    circle(canvas, 6.4, -3.8, 1, '#ffffff');
    oval(canvas, 7, 2, 7, 4, 'rgba(255,115,140,0.55)', 0);
  }

  canvas.restore();
}

// ---------------------------------------------------------------------------
// 구경꾼: 머리가 큰 2등신 캐릭터. 상어를 바라보고, 먹을 때 팔짝 뛰며 응원한다.
// ---------------------------------------------------------------------------
const SHIRTS = ['#ff7a7a', '#ffb347', '#6ec6ff', '#8bd17c', '#c58bff', '#ff8fc7', '#f2f2f2', '#4fb3a9'];
const PANTS = ['#4a5a7a', '#6b5a4a', '#3d4a5c', '#5a5a5a'];
const HAIRS = ['#2b2118', '#5a3a22', '#8a5a2b', '#d8b45a', '#3a3a4a', '#a8442a'];
const SKINS = ['#ffe0c4', '#f7cba5', '#e8b58d'];
const CAPS = ['#ff5a5a', '#4a8cff', '#ffd34a'];

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function drawSpectator(
  canvas: SkCanvas,
  p: Spectator,
  time: number,
  appearAt: number,
  cheering: boolean,
  look: 1 | -1,
) {
  const age = time - appearAt;
  if (age < 0) return;
  const sc = age >= 0.45 ? 1 : easeOutBack(age / 0.45);
  if (sc <= 0.02) return;

  const jump = cheering
    ? -Math.abs(Math.sin(time * 11 + p.phase)) * 11
    : Math.sin(time * 2 + p.phase) * 1.2;
  const shirt = SHIRTS[p.shirt % SHIRTS.length];
  const pants = PANTS[p.pants % PANTS.length];
  const hair = HAIRS[p.hair % HAIRS.length];
  const skin = SKINS[p.skin % SKINS.length];

  canvas.save();
  canvas.translate(p.x, p.y);
  canvas.scale(sc * 1.15, sc * 1.15);

  // 바닥 그림자
  oval(canvas, -12, -4, 24, 9, 'rgba(0,0,0,0.18)', 0);

  canvas.translate(0, jump);

  // 다리
  oval(canvas, -8, -8, 7, 8, pants, 2.2);
  oval(canvas, 1, -8, 7, 8, pants, 2.2);
  // 몸
  oval(canvas, -10, -25, 20, 20, shirt, 2.6);

  // 팔
  if (cheering) {
    oval(canvas, -16, -42, 7, 14, shirt, 2.2);
    oval(canvas, 9, -42, 7, 14, shirt, 2.2);
  } else {
    oval(canvas, -14, -22, 6, 12, shirt, 2.2);
    oval(canvas, 8, -22, 6, 12, shirt, 2.2);
  }

  // 머리 (머리카락 위에 얼굴을 살짝 아래로 겹친다)
  circle(canvas, 0, -37, 13, hair, 2.8);
  circle(canvas, 0, -35, 11, skin, 2.4);

  // 눈: 상어 쪽을 바라본다. 응원할 때는 웃는 눈.
  const ex = look * 1.6;
  if (cheering) {
    for (const dx of [-4.5, 4.5]) {
      const eye = Skia.Path.Make();
      eye.moveTo(dx + ex - 2.4, -34);
      eye.quadTo(dx + ex, -38, dx + ex + 2.4, -34);
      canvas.drawPath(eye, outline(1.8));
    }
    oval(canvas, -3, -31, 6, 5, '#7a1f2b', 1.4);
  } else {
    circle(canvas, -4.5 + ex, -35, 1.9, OUT);
    circle(canvas, 4.5 + ex, -35, 1.9, OUT);
    canvas.drawLine(-1.5 + ex, -30, 1.5 + ex, -30, outline(1.4));
  }
  oval(canvas, -9, -33, 5, 3.4, 'rgba(255,115,140,0.55)', 0);
  oval(canvas, 4, -33, 5, 3.4, 'rgba(255,115,140,0.55)', 0);

  // 모자 또는 사진 찍는 휴대폰
  if (p.cap >= 0) {
    oval(canvas, -12, -50, 24, 11, CAPS[p.cap % CAPS.length], 2.4);
    oval(canvas, look > 0 ? 2 : -14, -42, 12, 5, CAPS[p.cap % CAPS.length], 2);
  }
  if (p.phone && !cheering) {
    poly(canvas, [[look * 7, -52], [look * 17, -52], [look * 17, -37], [look * 7, -37]], '#3a4658', 2);
    poly(canvas, [[look * 9, -50], [look * 15, -50], [look * 15, -40], [look * 9, -40]], '#9fe3ff', 0);
  }

  canvas.restore();
}

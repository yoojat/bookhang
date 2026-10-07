// 메이플스토리처럼 굵은 외곽선과 큰 눈이 있는 귀여운 캐릭터 도안들.
import { BlendMode, ClipOp, Skia, SkCanvas, SkPaint } from '@shopify/react-native-skia';

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
// 북항이: 상어 본연의 유선형 몸매에 큰 눈과 미소를 더한 귀여운 상어.
// 뾰족한 주둥이, 회청색 등과 흰 배, 삼각 등지느러미, 초승달 꼬리, 아가미 줄무늬, 이빨이 특징이다.
const SHARK_BODY = '#7aa6cf';
const SHARK_FIN = '#5a86b0';
const SHARK_BELLY = '#f4f8fb';
// 도안을 통째로 줄여서 실제 크기에 맞춘다.
const SHARK_SCALE = 1.1;

// 수면선 높이(스프라이트 좌표). 몸의 위쪽 절반이 물 위로 나오고, 먹을 때는 떠올라 입을 드러낸다.
const WATERLINE_IDLE = 13;
const WATERLINE_FAST = 9;

function speedFraction(g: GameState) {
  return Math.min(1, g.shark.speed / SHARK.maxSpeed);
}

function waterlineOf(g: GameState) {
  const s = g.shark;
  const wl = WATERLINE_IDLE + (WATERLINE_FAST - WATERLINE_IDLE) * speedFraction(g);
  return wl + 9 * Math.min(1, Math.max(0, s.eat) / 0.2);
}

// 투명도를 몇 단계로만 쓰도록 맞춰서 페인트가 계속 늘어나지 않게 한다.
const white = (a: number) => `rgba(255,255,255,${(Math.round(clamp(a, 0, 1) * 5) / 5).toFixed(1)})`;

function drawSharkSprite(canvas: SkCanvas, g: GameState) {
  const s = g.shark;
  const k = s.radius / SHARK.baseRadius;
  const phase = g.time * (5 + s.speed / 25);
  const wag = Math.sin(phase) * (10 + s.speed / 16);
  const bob = Math.sin(g.time * 3) * 2.5;

  canvas.save();
  canvas.translate(s.x, s.y + bob * k);
  canvas.scale(s.facing, 1);
  canvas.rotate(s.tilt * DEG, 0, 0);
  canvas.scale(k * SHARK_SCALE, k * SHARK_SCALE);

  // 꼬리지느러미: 위 갈래가 더 긴 초승달 모양
  canvas.save();
  canvas.translate(-54, 0);
  canvas.rotate(wag, 0, 0);
  const tail = Skia.Path.Make();
  tail.moveTo(2, 0);
  tail.quadTo(-14, -10, -32, -36);
  tail.quadTo(-26, -14, -20, -2);
  tail.quadTo(-26, 8, -30, 26);
  tail.quadTo(-14, 8, 2, 3);
  tail.close();
  canvas.drawPath(tail, fill(SHARK_FIN));
  canvas.drawPath(tail, outline(3.2));
  canvas.restore();

  // 등지느러미: 뒤로 눕는 삼각 지느러미 (몸에 어울리는 크기)
  canvas.save();
  canvas.translate(0, -25);
  canvas.rotate(Math.sin(phase + 1) * 2.5, 0, 0);
  const dorsal = Skia.Path.Make();
  dorsal.moveTo(14, 2);
  dorsal.quadTo(4, -22, -12, -36);
  dorsal.quadTo(-12, -16, -28, 2);
  dorsal.close();
  canvas.drawPath(dorsal, fill(SHARK_FIN));
  canvas.drawPath(dorsal, outline(3.2));
  canvas.restore();

  // 꼬리 쪽 작은 등지느러미
  const dorsal2 = Skia.Path.Make();
  dorsal2.moveTo(-34, -14);
  dorsal2.quadTo(-40, -24, -48, -22);
  dorsal2.quadTo(-46, -15, -50, -9);
  dorsal2.close();
  canvas.drawPath(dorsal2, fill(SHARK_FIN));
  canvas.drawPath(dorsal2, outline(2.6));

  // 몸통: 뾰족한 주둥이의 유선형
  const body = Skia.Path.Make();
  body.moveTo(66, 2);
  body.cubicTo(54, -16, 26, -28, -8, -26);
  body.cubicTo(-30, -24, -46, -12, -58, -4);
  body.lineTo(-58, 5);
  body.cubicTo(-46, 12, -28, 24, -4, 26);
  body.cubicTo(24, 28, 54, 18, 66, 2);
  body.close();
  canvas.drawPath(body, fill(SHARK_BODY));

  // 흰 배: 등과 배의 경계가 부드러운 곡선을 이룬다.
  const belly = Skia.Path.Make();
  belly.moveTo(64, 5);
  belly.cubicTo(52, 20, 26, 25, -4, 24);
  belly.cubicTo(-28, 22, -44, 12, -55, 5);
  belly.cubicTo(-38, 9, -8, 9, 20, 9);
  belly.cubicTo(42, 9, 56, 7, 64, 5);
  belly.close();
  canvas.drawPath(belly, fill(SHARK_BELLY));
  canvas.drawPath(body, outline(3.4));

  // 가슴지느러미: 뒤로 뻗은 날개 모양. 헤엄치며 살짝 흔들린다.
  canvas.save();
  canvas.translate(18, 18);
  canvas.rotate(Math.sin(phase + 2) * 10, 0, 0);
  const pec = Skia.Path.Make();
  pec.moveTo(0, -2);
  pec.quadTo(-10, 16, -32, 20);
  pec.quadTo(-16, 8, -16, -4);
  pec.close();
  canvas.drawPath(pec, fill(SHARK_FIN));
  canvas.drawPath(pec, outline(3));
  canvas.restore();

  // 배지느러미(작게)
  const pelvic = Skia.Path.Make();
  pelvic.moveTo(-26, 21);
  pelvic.quadTo(-34, 30, -44, 31);
  pelvic.quadTo(-36, 24, -36, 16);
  pelvic.close();
  canvas.drawPath(pelvic, fill(SHARK_FIN));
  canvas.drawPath(pelvic, outline(2.4));

  // 아가미 줄무늬
  for (let i = 0; i < 3; i++) {
    const gx = 20 - i * 6.5;
    canvas.drawLine(gx, -7, gx - 3, 6, outline(2.2));
  }

  // 볼터치
  oval(canvas, 31, 4, 15, 9, 'rgba(255,110,135,0.6)', 0);

  // 눈: 둥글고 반짝이는 눈
  circle(canvas, 41, -7, 9, '#ffffff', 2.8);
  circle(canvas, 43, -6.5, 6, '#1b2a3a');
  circle(canvas, 40.5, -9.5, 2.5, '#ffffff');
  circle(canvas, 45, -4, 1.3, '#ffffff');
  // 콧구멍
  circle(canvas, 59, -4, 1.3, OUT);

  // 입: 먹는 동안에는 크게 벌린다.
  if (s.eat > 0) {
    poly(canvas, [[64, 4], [26, 12], [34, 34], [58, 26]], '#7a1f2b', 3);
    oval(canvas, 36, 24, 18, 9, '#ff8a9a', 0);
    for (let i = 0; i < 4; i++) {
      const tx = 56 - i * 8.5;
      poly(canvas, [[tx, 6 + (56 - tx) * 0.2], [tx - 4, 6 + (56 - tx) * 0.2], [tx - 2, 13 + (56 - tx) * 0.2]], '#ffffff', 1.4);
    }
    for (let i = 0; i < 3; i++) {
      const tx = 54 - i * 8;
      poly(canvas, [[tx, 29 - i * 1.5], [tx - 4, 30 - i * 1.5], [tx - 2, 23 - i * 1.5]], '#ffffff', 1.4);
    }
  } else {
    const smile = Skia.Path.Make();
    smile.moveTo(64, 5);
    smile.quadTo(48, 22, 26, 14);
    canvas.drawPath(smile, outline(3.2));
    // 이빨
    for (let i = 0; i < 4; i++) {
      const tx = 56 - i * 8;
      const ty = 14.5 + i * 0.6 - (i === 0 ? 1 : 0);
      poly(canvas, [[tx, ty], [tx - 5, ty + 1], [tx - 2, ty + 7]], '#ffffff', 1.4);
    }
  }

  canvas.restore();
}

// 물에 반쯤 잠긴 모습: 수면 위는 그대로, 수면 아래는 물색을 섞어 흐릿하게 그린다.
let underwaterPaint: SkPaint | null = null;
function getUnderwaterPaint() {
  if (!underwaterPaint) {
    underwaterPaint = Skia.Paint();
    underwaterPaint.setColorFilter(
      Skia.ColorFilter.MakeBlend(Skia.Color('rgba(70,160,195,0.5)'), BlendMode.SrcATop),
    );
    underwaterPaint.setAlphaf(0.94);
  }
  return underwaterPaint;
}

export function drawShark(canvas: SkCanvas, g: GameState) {
  const s = g.shark;
  // 피격 후 무적 시간에는 깜빡임
  if (s.blink > 0 && Math.floor(s.blink * 10) % 2 === 0) return;

  const k = s.radius / SHARK.baseRadius;
  const f = s.facing;
  const sp = speedFraction(g);
  const waterY = s.y + waterlineOf(g) * k;
  const x0 = s.x - 240 * k;
  const w = 480 * k;
  const top = s.y - 260 * k;
  const boosted = g.time < g.boostUntil;

  // 카페인 부스트: 몸 뒤로 속도선이 길게 흐른다.
  if (boosted) {
    for (let i = -1; i <= 1; i++) {
      const len = (70 + 40 * Math.sin(g.time * 22 + i * 2)) * k;
      const y = s.y + i * 24 * k;
      canvas.drawLine(s.x - f * 70 * k, y, s.x - f * (70 * k + len), y, stroke('rgba(255,196,64,0.85)', 4, true));
    }
  }

  // 몸이 수면과 만나는 곳의 물거품 띠
  const wob = Math.sin(g.time * 4) * 4;
  canvas.drawOval(Skia.XYWHRect(s.x - 78 * k, waterY - 6 * k, 156 * k, 12 * k), stroke('rgba(255,255,255,0.8)', 3, true));
  canvas.drawOval(
    Skia.XYWHRect(s.x - 96 * k - wob, waterY - 10 * k, 192 * k + wob * 2, 20 * k),
    stroke('rgba(255,255,255,0.4)', 2, true),
  );

  canvas.save();
  canvas.clipRect(Skia.XYWHRect(x0, top, w, waterY - top), ClipOp.Intersect, true);
  drawSharkSprite(canvas, g);
  canvas.restore();

  canvas.save();
  canvas.clipRect(Skia.XYWHRect(x0, waterY, w, 260 * k), ClipOp.Intersect, true);
  canvas.saveLayer(getUnderwaterPaint());
  drawSharkSprite(canvas, g);
  canvas.restore();
  canvas.restore();

  // 헤엄칠 때 뒤로 퍼지는 가벼운 물결과 물방울
  if (sp > 0.1) {
    const len = (30 + 90 * sp) * k;
    const spread = (6 + 12 * sp) * k;
    const baseX = s.x - f * 50 * k;
    for (const sign of [-1, 1]) {
      canvas.drawLine(baseX, waterY, baseX - f * len, waterY + sign * spread, stroke('rgba(255,255,255,0.6)', 2.6, true));
    }
    for (let i = 0; i < 5; i++) {
      const age = (g.time * 1.5 + i / 5) % 1;
      canvas.drawCircle(
        baseX - f * (14 + age * len),
        waterY + Math.sin(i * 5.3) * spread * age,
        (4 - 3 * age) * k,
        fill(white(1 - age)),
      );
    }
  }
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

const BALLOONS = ['#ff5a7a', '#ffd34a', '#5ac8ff', '#7be07b'];

export function drawSpectator(
  canvas: SkCanvas,
  p: Spectator,
  time: number,
  appearAt: number,
  cheering: boolean,
  look: 1 | -1,
  role: 'chef' | 'barista' | null = null,
  // 진지한 표정: 웃거나 응원하지 않고 눈썹을 찌푸린다. (물대포를 쏘는 선원)
  serious = false,
  // 상어가 가까이 와서 좋아하는 중: 머리 위에 하트가 떠오른다.
  love = false,
) {
  const happy = cheering && !serious;
  const age = time - appearAt;
  if (age < 0) return;
  const sc = age >= 0.45 ? 1 : easeOutBack(age / 0.45);
  if (sc <= 0.02) return;

  const jump = happy
    ? -Math.abs(Math.sin(time * 11 + p.phase)) * 12
    : Math.sin(time * 2 + p.phase) * 1.2;
  const shirt = SHIRTS[p.shirt % SHIRTS.length];
  const pants = PANTS[p.pants % PANTS.length];
  const hair = HAIRS[p.hair % HAIRS.length];
  const skin = SKINS[p.skin % SKINS.length];
  const ex = look * 1.4;
  const size = (p.kid ? 0.82 : 1.05) * sc;

  canvas.save();
  canvas.translate(p.x, p.y);
  canvas.scale(size, size);

  // 바닥 그림자
  oval(canvas, -13, -4, 26, 9, 'rgba(0,0,0,0.18)', 0);

  canvas.translate(0, jump);

  // 풍선: 손에 줄을 쥐고 머리 위에서 흔들린다.
  if (p.balloon >= 0 && !p.phone) {
    const sway = Math.sin(time * 2.2 + p.phase) * 4;
    const string = Skia.Path.Make();
    string.moveTo(look * 12, -22);
    string.quadTo(look * 14 + sway, -50, look * 10 + sway, -78);
    canvas.drawPath(string, outline(1.4));
    oval(canvas, look * 10 + sway - 11, -102, 22, 27, BALLOONS[p.balloon % BALLOONS.length], 2.4);
    circle(canvas, look * 10 + sway - 4, -95, 3, 'rgba(255,255,255,0.7)');
  }

  // 머리 뒤쪽 머리카락 (단발/포니테일/올림머리)
  if (p.hairStyle === 1) oval(canvas, -15.5, -47, 31, 30, hair, 2.8);
  if (p.hairStyle === 2) {
    oval(canvas, -look * 20 - 5, -42, 11, 20, hair, 2.6);
  }
  if (p.hairStyle === 3) circle(canvas, 0, -56, 7.5, hair, 2.6);

  // 신발과 다리
  oval(canvas, -9, -6, 8, 6, '#3a3a46', 2);
  oval(canvas, 1, -6, 8, 6, '#3a3a46', 2);
  if (!p.dress) {
    oval(canvas, -8, -13, 7, 9, pants, 2);
    oval(canvas, 1, -13, 7, 9, pants, 2);
  }

  // 몸: 치마 또는 티셔츠
  if (p.dress) {
    poly(canvas, [[-8, -28], [8, -28], [13, -9], [-13, -9]], shirt, 2.6);
    canvas.drawLine(-9, -14, 9, -14, outline(1.6));
  } else {
    oval(canvas, -10.5, -29, 21, 21, shirt, 2.6);
    oval(canvas, -10, -21, 20, 4.5, 'rgba(255,255,255,0.45)', 0);
  }

  // 팔과 손: 응원할 때는 번쩍 들고, 휴대폰이 있으면 얼굴 앞에서 찍는다.
  if (happy) {
    oval(canvas, -17, -45, 7, 17, shirt, 2.2);
    oval(canvas, 10, -45, 7, 17, shirt, 2.2);
    circle(canvas, -13.5, -47, 3.6, skin, 2);
    circle(canvas, 13.5, -47, 3.6, skin, 2);
  } else if (p.phone) {
    oval(canvas, -15, -26, 6.5, 13, shirt, 2.2);
    circle(canvas, -12, -13, 3.4, skin, 2);
    oval(canvas, look * 8 - 3.5, -40, 7, 16, shirt, 2.2);
    circle(canvas, look * 11, -42, 3.4, skin, 2);
  } else {
    oval(canvas, -15, -26, 6.5, 13, shirt, 2.2);
    oval(canvas, 8.5, -26, 6.5, 13, shirt, 2.2);
    circle(canvas, -12, -13, 3.4, skin, 2);
    circle(canvas, 12, -13, 3.4, skin, 2);
    // 테이크아웃 커피잔
    if (p.cup) {
      poly(canvas, [[8.5, -27], [16.5, -27], [15, -14], [10, -14]], '#ffffff', 1.9);
      poly(canvas, [[9, -23], [16, -23], [15.6, -19.5], [9.6, -19.5]], '#2a4f8f', 0);
      canvas.drawLine(8, -28, 17, -28, outline(2));
    }
  }

  // 머리: 큰 얼굴 위에 머리카락이 덮인다.
  circle(canvas, 0, -38, 14.5, hair, 2.8);
  circle(canvas, 0, -35.5, 12.8, skin, 2.4);

  // 앞머리
  poly(
    canvas,
    [[-10, -47], [10, -47], [13, -40], [9, -35], [4, -41], [-1, -34], [-6, -41], [-10, -35], [-13, -40]],
    hair,
    0,
  );

  // 눈: 크고 반짝이는 눈. 응원할 때는 웃는 눈.
  if (happy) {
    for (const dx of [-5.5, 5.5]) {
      const eye = Skia.Path.Make();
      eye.moveTo(dx + ex - 3, -32);
      eye.quadTo(dx + ex, -38, dx + ex + 3, -32);
      canvas.drawPath(eye, outline(2));
    }
    oval(canvas, -3.4, -29, 6.8, 7.2, '#7a1f2b', 1.6);
    oval(canvas, -2, -25.5, 4, 3, '#ff8a9a', 0);
  } else {
    for (const dx of [-5.5, 5.5]) {
      oval(canvas, dx + ex - 3, -36, 6, 8.4, '#222a38', 0);
      circle(canvas, dx + ex - 1, -34, 1.9, '#ffffff');
      circle(canvas, dx + ex + 1, -30.5, 0.9, '#ffffff');
    }
    if (serious) {
      // 찌푸린 눈썹과 꾹 다문 입
      canvas.drawLine(-10 + ex, -42, -2 + ex, -39, outline(2.4));
      canvas.drawLine(10 + ex, -42, 2 + ex, -39, outline(2.4));
      canvas.drawLine(-2.4 + ex, -25, 2.4 + ex, -25, outline(1.8));
    } else {
      const mouth = Skia.Path.Make();
      mouth.moveTo(-2.6 + ex, -26);
      mouth.quadTo(ex, -23.4, 2.6 + ex, -26);
      canvas.drawPath(mouth, outline(1.5));
    }
  }
  oval(canvas, -12, -30, 6.5, 4, 'rgba(255,110,135,0.6)', 0);
  oval(canvas, 5.5, -30, 6.5, 4, 'rgba(255,110,135,0.6)', 0);

  // 바리스타: 어디야의 남색 앞치마와 모자
  if (role === 'barista') {
    poly(canvas, [[-7, -28], [7, -28], [9, -9], [-9, -9]], '#1f3f77', 2.2);
    oval(canvas, -13, -52, 26, 11, '#1f3f77', 2.4);
    oval(canvas, look > 0 ? 3 : -17, -44, 14, 5, '#1f3f77', 2);
    circle(canvas, 0, -50, 3, '#ffffff', 1.2);
  }

  // 요리사 모자와 앞치마 (생닭 던지는 사람)
  if (role === 'chef') {
    poly(canvas, [[-7, -28], [7, -28], [9, -9], [-9, -9]], '#e85a5a', 2.2);
    circle(canvas, -8, -56, 7, '#ffffff', 2.4);
    circle(canvas, 0, -60, 8.5, '#ffffff', 2.4);
    circle(canvas, 8, -56, 7, '#ffffff', 2.4);
    oval(canvas, -12, -53, 24, 8, '#ffffff', 2.4);
  }

  // 던지려는 사람 머리 위에 말풍선을 띄워 눈에 띄게 한다. (생닭: !, 커피: 커피잔)
  if (role) {
    const pop = Math.sin(time * 9) * 2;
    poly(canvas, [[-4, -83 + pop], [4, -83 + pop], [0, -76 + pop]], '#fffbe8', 2.4);
    oval(canvas, -17, -108 + pop, 34, 28, '#fffbe8', 2.6);
    if (role === 'chef') {
      canvas.drawLine(0, -102 + pop, 0, -93 + pop, outline(3.4));
      circle(canvas, 0, -88 + pop, 1.9, OUT);
    } else {
      poly(canvas, [[-7, -101 + pop], [5, -101 + pop], [3.5, -90 + pop], [-5.5, -90 + pop]], '#4a2c1a', 2);
      canvas.drawLine(6, -99 + pop, 9, -96 + pop, outline(2));
    }
  }

  if (love) {
    const rise = (time * 1.3 + p.phase) % 1;
    heart(canvas, 0, -66 - rise * 20, 6.5 - rise * 2);
  }

  // 모자
  if (p.cap >= 0 && !role) {
    const c = CAPS[p.cap % CAPS.length];
    oval(canvas, -13.5, -53, 27, 14, c, 2.4);
    oval(canvas, look > 0 ? 1 : -15, -43.5, 14, 5.5, c, 2);
    circle(canvas, 0, -53, 2.4, '#ffffff', 1.4);
  }

  // 사진 찍는 휴대폰
  if (p.phone && !happy) {
    poly(canvas, [[look * 8, -55], [look * 19, -55], [look * 19, -39], [look * 8, -39]], '#3a4658', 2);
    poly(canvas, [[look * 10, -53], [look * 17, -53], [look * 17, -41.5], [look * 10, -41.5]], '#9fe3ff', 0);
  }

  canvas.restore();
}

// ---------------------------------------------------------------------------
// 생닭: 먹으면 라이프가 하나 오른다. 날아가는 동안에는 빙글빙글 돈다.
// ---------------------------------------------------------------------------
function heart(canvas: SkCanvas, cx: number, cy: number, r: number) {
  circle(canvas, cx - r * 0.55, cy, r * 0.62, '#ff4f6d', 1.6);
  circle(canvas, cx + r * 0.55, cy, r * 0.62, '#ff4f6d', 1.6);
  poly(canvas, [[cx - r * 1.12, cy + r * 0.2], [cx + r * 1.12, cy + r * 0.2], [cx, cy + r * 1.35]], '#ff4f6d', 1.6);
}

export function drawChicken(
  canvas: SkCanvas,
  x: number,
  y: number,
  time: number,
  elevation: number,
  spin: number,
  visible: boolean,
) {
  if (!visible) return;
  const bob = elevation > 0 ? 0 : Math.sin(time * 3 + x) * 2.5;

  // 물에 떠 있을 때는 아래에 물결을 그린다.
  if (elevation <= 0) {
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    canvas.drawOval(
      Skia.XYWHRect(x - 30 * pulse, y - 6 * pulse + 10, 60 * pulse, 14 * pulse),
      stroke('rgba(255,255,255,0.8)', 2.5, true),
    );
  } else {
    oval(canvas, x - 14, y + 8, 28, 8, 'rgba(0,40,70,0.2)', 0);
  }

  canvas.save();
  canvas.translate(x, y - elevation + bob);
  canvas.rotate(spin, 0, 0);
  canvas.scale(1.3, 1.3);

  // 다리 두 개: 허벅지는 통통하고 정강이 끝에 하얀 뼈마디가 보인다.
  for (const sign of [-1, 1]) {
    canvas.save();
    canvas.translate(sign * 9, 9);
    canvas.rotate(-sign * 26, 0, 0);
    oval(canvas, -7.5, -3, 15, 21, '#efc3a5', 2.4);
    oval(canvas, -4.5, -1, 7, 11, 'rgba(255,240,225,0.55)', 0);
    poly(canvas, [[-3.4, 15], [3.4, 15], [2.6, 27], [-2.6, 27]], '#e9b896', 2.2);
    circle(canvas, -2.6, 29, 3.1, '#fff3df', 1.9);
    circle(canvas, 2.6, 29, 3.1, '#fff3df', 1.9);
    canvas.restore();
  }

  // 접힌 날개
  for (const sign of [-1, 1]) {
    canvas.save();
    canvas.translate(sign * 19, 1);
    canvas.rotate(-sign * 16, 0, 0);
    oval(canvas, -6, -10, 12, 22, '#e9b594', 2.4);
    poly(canvas, [[-3.5, 10], [3.5, 10], [0, 17]], '#e0a583', 1.9);
    canvas.restore();
  }

  // 몸통: 가장자리는 분홍빛, 가운데는 노르스름한 껍질
  oval(canvas, -19, -18, 38, 36, '#ebb89b', 2.8);
  oval(canvas, -16, -16, 32, 31, '#f6d3b6', 0);
  // 가슴살 두 덩어리와 가운데 뼈 선
  oval(canvas, -13, -12, 14, 24, '#fbe4d0', 0);
  oval(canvas, -1, -12, 14, 24, '#fbe4d0', 0);
  canvas.drawLine(0, -10, 0, 12, stroke('rgba(176,110,92,0.55)', 1.7, true));
  // 목 자리(잘린 단면)
  oval(canvas, -6.5, -25, 13, 10, '#e2ab90', 2.2);
  oval(canvas, -3.8, -23.5, 7.6, 5.4, '#a85c4e', 0);
  // 닭살: 오돌토돌한 껍질
  for (const [dx, dy] of [[-12, -6], [-8, 2], [-14, 6], [-5, 8], [-9, -9], [6, -8], [10, -3], [4, 4], [12, 5], [8, 10], [-2, -3], [2, 12], [14, -9], [-15, 0]]) {
    circle(canvas, dx, dy, 0.95, 'rgba(176,100,84,0.55)');
  }
  // 물기 어린 윤기
  oval(canvas, -12, -14, 12, 5.5, 'rgba(255,255,255,0.55)', 0);
  canvas.restore();

  // 먹으면 라이프가 오른다는 표시
  if (elevation <= 0) heart(canvas, x, y - 44 + Math.sin(time * 4) * 3, 7);
}

// ---------------------------------------------------------------------------
// 아이스 아메리카노: 마시면 10초간 카페인 부스트
// ---------------------------------------------------------------------------
function bolt(canvas: SkCanvas, cx: number, cy: number, sc: number) {
  poly(
    canvas,
    [[cx + 2 * sc, cy - 8 * sc], [cx - 5 * sc, cy + 1 * sc], [cx - 0.5 * sc, cy + 1 * sc], [cx - 3 * sc, cy + 9 * sc], [cx + 5 * sc, cy - 1 * sc], [cx + 0.5 * sc, cy - 1 * sc]],
    '#ffd34a',
    1.8,
  );
}

export function drawCoffee(
  canvas: SkCanvas,
  x: number,
  y: number,
  time: number,
  elevation: number,
  spin: number,
  visible: boolean,
) {
  if (!visible) return;
  const bob = elevation > 0 ? 0 : Math.sin(time * 3 + x) * 2.5;

  if (elevation <= 0) {
    const pulse = 1 + Math.sin(time * 4) * 0.12;
    canvas.drawOval(
      Skia.XYWHRect(x - 28 * pulse, y - 6 * pulse + 12, 56 * pulse, 14 * pulse),
      stroke('rgba(255,255,255,0.8)', 2.5, true),
    );
  } else {
    oval(canvas, x - 12, y + 12, 24, 8, 'rgba(0,40,70,0.2)', 0);
  }

  canvas.save();
  canvas.translate(x, y - elevation + bob);
  canvas.rotate(spin, 0, 0);
  canvas.scale(1.25, 1.25);

  // 빨대
  canvas.drawLine(3, -14, 9, -30, stroke('#1f3f77', 3.4, true));
  // 투명한 컵과 커피
  poly(canvas, [[-11, -12], [11, -12], [8, 16], [-8, 16]], 'rgba(235,246,252,0.85)', 2.6);
  poly(canvas, [[-10, -5], [10, -5], [7.5, 15], [-7.5, 15]], '#4a2c1a', 0);
  // 얼음
  oval(canvas, -7, -4, 7, 7, 'rgba(255,255,255,0.75)', 1.4);
  oval(canvas, 1, 2, 6.5, 6.5, 'rgba(255,255,255,0.7)', 1.4);
  // 뚜껑과 남색 슬리브
  oval(canvas, -12, -17, 24, 8, '#f6fafc', 2.2);
  poly(canvas, [[-9.6, 3], [9.6, 3], [8.6, 10], [-8.6, 10]], '#2a4f8f', 0);
  // 귀여운 얼굴
  circle(canvas, -3.4, 6.5, 1.1, '#ffffff');
  circle(canvas, 3.4, 6.5, 1.1, '#ffffff');
  canvas.restore();

  // 먹으면 부스트가 걸린다는 번개 표시
  if (elevation <= 0) bolt(canvas, x, y - 40 + Math.sin(time * 4) * 3, 1.15);
}

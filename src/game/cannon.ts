// 물대포: 수로에 들어온 구조정이 수면의 목표 지점을 조준(경고)했다가 물줄기를 발사한다.
// (실제로 북항에서 배 위에서 물대포를 쏘며 부캉이를 바다로 내보내려 한 일에서 따왔다.)
import { PaintStyle, Skia, SkCanvas, SkPaint, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';

import { CANNON } from './config';
import { Shot } from './engine';
import { Spectator } from './map';
import { fill, stroke } from './paint';
import { drawSpectator } from './sprites';

const OUT = '#2a3342';
const outline = (w: number) => stroke(OUT, w, true);

function oval(canvas: SkCanvas, x: number, y: number, w: number, h: number, color: string, ow = 2.6) {
  const rect = Skia.XYWHRect(x, y, w, h);
  canvas.drawOval(rect, fill(color));
  if (ow > 0) canvas.drawOval(rect, outline(ow));
}

const CREW: Spectator = {
  x: 0,
  y: 0,
  shirt: 6,
  pants: 0,
  hair: 0,
  skin: 1,
  cap: 1,
  phone: false,
  phase: 0,
  hairStyle: 0,
  dress: false,
  kid: false,
  balloon: -1,
  cup: false,
};

function poly(canvas: SkCanvas, pts: [number, number][], color: string, ow = 2.8) {
  const path = Skia.Path.Make();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  path.close();
  canvas.drawPath(path, fill(color));
  if (ow > 0) canvas.drawPath(path, outline(ow));
}

// 수면 위의 구조정: 선원이 타고 있고 뱃머리의 물대포가 목표를 향해 돌아간다.
// firing: 발사 후 경과 시간(발사 전에는 0 이하), alarm: 발사 직전 경고등
function drawBoat(canvas: SkCanvas, shot: Shot, time: number, angle: number, firing: number, alarm: boolean) {
  const f = shot.facing;
  const bob = Math.sin(time * 3 + shot.id) * 2;
  const x = shot.cx;
  const y = shot.cy + bob;

  // 수면 그림자와 뱃길
  oval(canvas, x - 74, y + 8, 148, 18, 'rgba(0,50,80,0.18)', 0);

  canvas.save();
  canvas.translate(x, y);
  canvas.scale(f, 1);
  // 선체: 수면 위로 보이는 부분
  poly(canvas, [[-66, -8], [72, -8], [88, -16], [58, 14], [-54, 14]], '#e8564f');
  poly(canvas, [[-66, -8], [72, -8], [84, -13], [-64, -2]], '#ffffff', 0);
  // 선실과 경광등
  poly(canvas, [[-56, -40], [-18, -40], [-18, -8], [-56, -8]], '#ffffff');
  circle(canvas, -37, -24, 7.5, '#8fd3e8', 2.4);
  poly(canvas, [[-46, -40], [-28, -40], [-28, -48], [-46, -48]], alarm && Math.sin(time * 28) > 0 ? '#ff3b3b' : '#9aa4ae', 2.4);
  canvas.restore();

  // 선체 아랫부분은 물에 잠긴 것처럼 물결로 가린다.
  canvas.drawOval(Skia.XYWHRect(x - 72, y + 8, 144, 12), stroke('rgba(255,255,255,0.9)', 3, true));
  canvas.drawOval(Skia.XYWHRect(x - 86, y + 5, 172, 18), stroke('rgba(255,255,255,0.4)', 2, true));

  // 선원: 발사 순간에는 두 팔을 든다.
  CREW.x = x + f * 8;
  CREW.y = y - 6;
  drawSpectator(canvas, CREW, time, -10, false, f, null, true);

  // 뱃머리 물대포: 목표를 향해 회전하고 발사하면 뒤로 밀린다.
  const tx = x + f * 50;
  const ty = y - 18;
  oval(canvas, tx - 15, ty - 2, 30, 20, '#6c7480');
  canvas.save();
  canvas.translate(tx, ty);
  canvas.rotate((angle * 180) / Math.PI, 0, 0);
  // 발사하는 동안 포신이 덜덜 떨린다.
  canvas.translate(firing > 0 ? -4 + Math.sin(time * 70) * 1.8 : 0, firing > 0 ? Math.cos(time * 63) * 1.2 : 0);
  oval(canvas, -4, -7, 40, 14, '#8f9ba8');
  oval(canvas, 30, -10, 13, 20, '#f2c14e');
  oval(canvas, -10, -10, 16, 20, '#4fa3e0');
  canvas.restore();
}

function circle(canvas: SkCanvas, cx: number, cy: number, r: number, color: string, ow = 0) {
  canvas.drawCircle(cx, cy, r, fill(color));
  if (ow > 0) canvas.drawCircle(cx, cy, r, outline(ow));
}

// 그물을 끄는 작업선: 주황색 선체에 선원이 타고 있다. f: 바라보는 방향
export function drawNetBoat(canvas: SkCanvas, x: number, y: number, f: 1 | -1, time: number) {
  const bob = Math.sin(time * 3 + x * 0.05) * 2;
  const by = y + bob;
  oval(canvas, x - 56, by + 8, 112, 14, 'rgba(0,50,80,0.18)', 0);

  canvas.save();
  canvas.translate(x, by);
  canvas.scale(f, 1);
  poly(canvas, [[-48, -6], [52, -6], [66, -14], [42, 12], [-40, 12]], '#ff9a3c');
  poly(canvas, [[-48, -6], [52, -6], [62, -11], [-47, -1]], '#ffffff', 0);
  poly(canvas, [[-40, -32], [-8, -32], [-8, -6], [-40, -6]], '#ffffff');
  circle(canvas, -24, -19, 5.5, '#8fd3e8', 2.2);
  // 그물을 감는 윈치
  circle(canvas, 32, -13, 7.5, '#6c7480', 2.4);
  canvas.drawLine(32, -13, 32, -20, outline(2.4));
  canvas.restore();

  canvas.drawOval(Skia.XYWHRect(x - 52, by + 6, 104, 10), stroke('rgba(255,255,255,0.9)', 3, true));
  canvas.drawOval(Skia.XYWHRect(x - 64, by + 3, 128, 16), stroke('rgba(255,255,255,0.4)', 2, true));

  CREW.x = x + f * 8;
  CREW.y = by - 6;
  drawSpectator(canvas, CREW, time, -10, false, f, null, true);
}

// 대포에서 목표까지 이어지는 포물선 물줄기
function jetPath(shot: Shot, muzzleX: number, muzzleY: number) {
  const mx = (muzzleX + shot.tx) / 2;
  const my = (muzzleY + shot.ty) / 2;
  const len = Math.hypot(shot.tx - muzzleX, shot.ty - muzzleY);
  const nx = -(shot.ty - muzzleY) / Math.max(1, len);
  const ny = (shot.tx - muzzleX) / Math.max(1, len);
  const arc = Math.min(70, len * 0.25);
  const path = Skia.Path.Make();
  path.moveTo(muzzleX, muzzleY);
  path.quadTo(mx + nx * arc, my + ny * arc - arc * 0.6, shot.tx, shot.ty);
  return path;
}

// 프레임마다 색(투명도)이 바뀌는 도형용: 색마다 새 페인트를 캐시하지 않고 하나를 재사용한다.
let dynFillPaint: SkPaint | null = null;
let dynStrokePaint: SkPaint | null = null;

function dynFill(css: string) {
  if (!dynFillPaint) {
    dynFillPaint = Skia.Paint();
    dynFillPaint.setAntiAlias(true);
  }
  dynFillPaint.setColor(Skia.Color(css));
  return dynFillPaint;
}

function dynStroke(css: string, width: number) {
  if (!dynStrokePaint) {
    dynStrokePaint = Skia.Paint();
    dynStrokePaint.setAntiAlias(true);
    dynStrokePaint.setStyle(PaintStyle.Stroke);
    dynStrokePaint.setStrokeCap(StrokeCap.Round);
    dynStrokePaint.setStrokeJoin(StrokeJoin.Round);
  }
  dynStrokePaint.setColor(Skia.Color(css));
  dynStrokePaint.setStrokeWidth(width);
  return dynStrokePaint;
}

export function drawShot(canvas: SkCanvas, shot: Shot) {
  const angle = Math.atan2(shot.ty - (shot.cy - 18), shot.tx - (shot.cx + shot.facing * 50));
  const R = CANNON.radius;
  const turretX = shot.cx + shot.facing * 50;
  const turretY = shot.cy - 18;
  const muzzleX = turretX + Math.cos(angle) * 44;
  const muzzleY = turretY + Math.sin(angle) * 44;
  const sinceFire = shot.t - shot.aim;

  // 배가 들어오는 동안에는 조준 표시 없이 배만 보인다.
  if (shot.t < 0) {
    drawBoat(canvas, shot, shot.t, angle, 0, false);
    return;
  }

  if (sinceFire < 0) {
    // 조준 중: 목표 지점에 원이 줄어들며 경고하고, 마지막에는 빨갛게 고정된다.
    const lockAt = shot.aim - CANNON.lockTime;
    const locked = shot.t >= lockAt;
    const shrink = Math.min(1, shot.t / Math.max(0.01, lockAt));
    const ringR = locked ? R : R * (1.6 - 0.6 * shrink);
    const pulse = locked ? 0.6 + 0.4 * Math.sin(shot.t * 36) : 1;
    const color = locked ? `rgba(255,70,70,${0.95 * pulse})` : 'rgba(255,255,255,0.9)';
    canvas.drawCircle(shot.tx, shot.ty, R, dynFill(locked ? `rgba(255,70,70,${0.28 * pulse})` : 'rgba(255,255,255,0.12)'));
    canvas.drawCircle(shot.tx, shot.ty, ringR, dynStroke(color, 5));
    if (locked) {
      // 가운데 조준점
      canvas.drawLine(shot.tx - 14, shot.ty, shot.tx + 14, shot.ty, dynStroke(color, 4));
      canvas.drawLine(shot.tx, shot.ty - 14, shot.tx, shot.ty + 14, dynStroke(color, 4));
    }
    // 대포에서 목표까지 점선
    const dots = 9;
    for (let i = 1; i < dots; i++) {
      const t = i / dots;
      canvas.drawCircle(
        muzzleX + (shot.tx - muzzleX) * t,
        muzzleY + (shot.ty - muzzleY) * t,
        3.2,
        dynFill(locked ? 'rgba(255,90,90,0.8)' : 'rgba(255,255,255,0.7)'),
      );
    }
    drawBoat(canvas, shot, shot.t, angle, 0, locked);
    return;
  }

  // 발사: 물줄기가 상어를 따라오며 계속 뿜어져 나오고, 끝날 때 잦아든다.
  const f = Math.min(1, sinceFire / CANNON.fireTime);
  const fade = f < 0.8 ? 1 : Math.max(0, 1 - (f - 0.8) / 0.2);
  const pulse = 1 + Math.sin(sinceFire * 40) * 0.08;
  const jet = jetPath(shot, muzzleX, muzzleY);
  canvas.drawPath(jet, dynStroke(`rgba(190,230,255,${0.55 * fade})`, 34 * pulse));
  canvas.drawPath(jet, dynStroke(`rgba(255,255,255,${0.95 * fade})`, 18 * pulse));

  const splashR = R * (0.78 + 0.06 * Math.sin(sinceFire * 18));
  canvas.drawCircle(shot.tx, shot.ty, splashR, dynFill(`rgba(255,255,255,${0.5 * fade})`));
  canvas.drawCircle(shot.tx, shot.ty, splashR, dynStroke(`rgba(150,210,245,${0.9 * fade})`, 5));
  canvas.drawCircle(shot.tx, shot.ty, splashR * 0.55, dynFill(`rgba(255,255,255,${0.8 * fade})`));
  // 사방으로 튀는 물방울
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + sinceFire * 3;
    const d = R * (0.8 + 0.3 * Math.sin(sinceFire * 9 + i * 1.7));
    canvas.drawCircle(
      shot.tx + Math.cos(a) * d,
      shot.ty + Math.sin(a) * d - Math.abs(Math.sin(sinceFire * 7 + i)) * 20,
      6.5,
      dynFill(`rgba(255,255,255,${0.9 * fade})`),
    );
  }

  drawBoat(canvas, shot, shot.t, angle, sinceFire, false);
}

// 그물 몰이: 두 척의 작업선과 양쪽 기슭의 작업자가 그물을 끌며 수로를 따라 내려온다.
// 두 배 사이의 빈틈이 상어가 빠져나갈 길이다.
import { Skia, SkCanvas } from '@shopify/react-native-skia';

import { drawNetBoat } from './cannon';
import { NET } from './config';
import { Net } from './engine';
import { HALF_W, pointAt, Spectator } from './map';
import { fill, stroke } from './paint';
import { drawSpectator } from './sprites';

const WORKER: Spectator = {
  x: 0,
  y: 0,
  shirt: 2,
  pants: 3,
  hair: 0,
  skin: 1,
  cap: 2,
  phone: false,
  phase: 0,
  hairStyle: 0,
  dress: false,
  kid: false,
  balloon: -1,
  cup: false,
};

export function drawNet(canvas: SkCanvas, net: Net, time: number, highTide: boolean) {
  const base = pointAt(net.s);
  const tx = Math.cos(base.angle);
  const ty = Math.sin(base.angle);
  const nx = -ty;
  const ny = tx;
  const at = (off: number, along = 0) => ({ x: base.x + nx * off + tx * along, y: base.y + ny * off + ty * along });
  const half = NET.band / 2;
  const edge = HALF_W + 34;

  const segments: [number, number][] = [
    [-edge, net.gapOff - net.gapHalf],
    [net.gapOff + net.gapHalf, edge],
  ];
  // 만조에는 그물이 물에 잠겨 흐릿하게 보인다.
  const body = highTide ? 'rgba(235,245,250,0.16)' : 'rgba(235,245,250,0.34)';
  const mesh = highTide ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)';
  const rope = highTide ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.95)';

  for (const [a, b] of segments) {
    if (b - a < 4) continue;
    const quad = Skia.Path.Make();
    const p1 = at(a, -half);
    const p2 = at(b, -half);
    const p3 = at(b, half);
    const p4 = at(a, half);
    quad.moveTo(p1.x, p1.y);
    quad.lineTo(p2.x, p2.y);
    quad.lineTo(p3.x, p3.y);
    quad.lineTo(p4.x, p4.y);
    quad.close();
    canvas.drawPath(quad, fill(body));
    // 그물눈
    for (let o = a; o <= b; o += 18) {
      const u = at(o, -half);
      const v = at(o, half);
      canvas.drawLine(u.x, u.y, v.x, v.y, stroke(mesh, 2, true));
    }
    for (const along of [-half, 0, half]) {
      const u = at(a, along);
      const v = at(b, along);
      canvas.drawLine(u.x, u.y, v.x, v.y, stroke(rope, along === 0 ? 4 : 2.4, true));
    }
    // 위쪽 줄에 달린 주황 부표
    for (let o = a + 14; o < b; o += 40) {
      const u = at(o, 0);
      canvas.drawCircle(u.x, u.y, 6.5, fill('#ff8a3d'));
      canvas.drawCircle(u.x, u.y, 6.5, stroke('#2a3342', 2, true));
    }
  }

  // 빈틈 양쪽의 작업선
  const boatA = at(net.gapOff - net.gapHalf - 52);
  const boatB = at(net.gapOff + net.gapHalf + 52);
  drawNetBoat(canvas, boatA.x, boatA.y, 1, time);
  drawNetBoat(canvas, boatB.x, boatB.y, -1, time);

  // 양쪽 산책로에서 그물 끝을 당기는 작업자
  for (const side of [-1, 1]) {
    const w = at(side * (HALF_W + 58));
    WORKER.x = w.x;
    WORKER.y = w.y;
    drawSpectator(canvas, WORKER, time, -10, false, side === -1 ? 1 : -1, null, true);
  }
}

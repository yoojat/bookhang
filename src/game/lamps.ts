// 밤의 불빛: 기슭에서 손전등이나 대형 랜턴으로 상어를 비추는 사람들.
// (실제로 북항에서 한밤중에 부캉이를 향해 손전등과 랜턴, 레이저를 비춘 일에서 따왔다.)
import { Skia, SkCanvas } from '@shopify/react-native-skia';

import { LAMP } from './config';
import { GameState, Lamp } from './engine';
import { Spectator } from './map';
import { fill, stroke } from './paint';
import { drawSpectator } from './sprites';

function person(lamp: Lamp): Spectator {
  const i = lamp.id;
  return {
    x: lamp.x,
    y: lamp.y,
    shirt: (i * 3) % 8,
    pants: i % 4,
    hair: (i * 5) % 6,
    skin: i % 3,
    cap: i % 2 === 0 ? i % 3 : -1,
    phone: false,
    phase: i * 1.3,
    hairStyle: i % 4,
    dress: false,
    kid: false,
    balloon: -1,
    cup: false,
  };
}

// 불빛을 든 사람 (밤의 어둠에 가려져 보이도록 어두운 덮개보다 먼저 그린다)
export function drawLampPerson(canvas: SkCanvas, g: GameState, lamp: Lamp) {
  drawSpectator(canvas, person(lamp), g.time, g.time - lamp.t, false, lamp.tx >= lamp.x ? 1 : -1, null, true);
}

// 불빛 줄기와 닿는 자리: 어둠 위에 밝게 겹쳐 그린다.
export function drawLampBeam(canvas: SkCanvas, lamp: Lamp) {
  if (lamp.t < 0.15) return;
  const spec = lamp.kind === 'flash' ? LAMP.flash : LAMP.lantern;
  const a = lamp.angle;
  const ox = lamp.x + Math.cos(a) * 18;
  const oy = lamp.y - 38 + Math.sin(a) * 8;
  const len = Math.hypot(lamp.tx - ox, lamp.ty - oy) + 70;
  // 사람이 나타나는 동안 불빛이 서서히 켜진다.
  const on = Math.min(1, lamp.t / LAMP.arrive);

  const warm = lamp.kind === 'flash';
  const layers: [number, string][] = [
    [1, warm ? 'rgba(255,252,225,0.10)' : 'rgba(255,238,175,0.10)'],
    [0.66, warm ? 'rgba(255,252,225,0.14)' : 'rgba(255,238,175,0.14)'],
    [0.33, warm ? 'rgba(255,255,240,0.2)' : 'rgba(255,244,190,0.2)'],
  ];
  if (on > 0.3) {
    for (const [k, color] of layers) {
      const h = spec.half * k;
      const path = Skia.Path.Make();
      path.moveTo(ox, oy);
      path.lineTo(ox + Math.cos(a - h) * len, oy + Math.sin(a - h) * len);
      path.lineTo(ox + Math.cos(a + h) * len, oy + Math.sin(a + h) * len);
      path.close();
      canvas.drawPath(path, fill(color));
    }
    // 수면에 맺힌 밝은 자리
    const r = warm ? 62 : 104;
    canvas.drawCircle(lamp.tx, lamp.ty, r, fill('rgba(255,255,235,0.22)'));
    canvas.drawCircle(lamp.tx, lamp.ty, r * 0.55, fill('rgba(255,255,245,0.3)'));
  }
  // 손에 든 손전등/랜턴
  canvas.drawCircle(ox, oy, warm ? 16 : 26, fill('rgba(255,250,210,0.35)'));
  canvas.drawCircle(ox, oy, warm ? 7 : 12, fill(warm ? '#fff6c0' : '#ffd86a'));
  canvas.drawCircle(ox, oy, warm ? 7 : 12, stroke('#2a3342', 2.4, true));
}

// 상어가 불빛에 눈부셔 하는 효과: 하얀 빛무리와 번쩍이는 줄기
export function drawGlare(canvas: SkCanvas, g: GameState) {
  if (g.glare < 0.08) return;
  const s = g.shark;
  const q = Math.min(0.55, Math.round(g.glare * 8) / 10);
  const glow = `rgba(255,255,255,${q.toFixed(1)})`;
  canvas.drawCircle(s.x, s.y, 60 + g.glare * 30, fill(glow));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + g.time * 2;
    canvas.drawLine(
      s.x + Math.cos(a) * 62,
      s.y + Math.sin(a) * 62,
      s.x + Math.cos(a) * (96 + g.glare * 30),
      s.y + Math.sin(a) * (96 + g.glare * 30),
      stroke('rgba(255,255,255,0.9)', 4, true),
    );
  }
}

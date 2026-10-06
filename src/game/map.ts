// 북항 친수공원 오른쪽 수로(제4~제6보도교)를 단순화한 맵.
// 안내 지도에서 수로 중심선을 직접 따서 좌표로 옮겼고, 게임용으로 폭을 넓혔다.

export interface Pt {
  x: number;
  y: number;
}

// 지도 이미지(오른쪽 수로 영역을 잘라낸 것) 기준 중심선 좌표. 위(베이파크브릿지 쪽) -> 아래(바다) 방향.
const CENTERLINE: [number, number][] = [
  [150, 255],
  [275, 345],
  [365, 430],
  [415, 510],
  [455, 600], // 제4보도교 부근
  [490, 700],
  [540, 800],
  [540, 900],
  [535, 1000],
  [515, 1100],
  [485, 1200],
  [462, 1295], // 제5보도교 부근
  [395, 1380],
  [325, 1460],
  [245, 1535],
  [165, 1615],
  [105, 1690], // 제6보도교 부근
  [60, 1760], // 바다
];

// 지도 좌표 -> 게임 월드 좌표 배율
const SCALE = 3.2;
const STEPS = 14;

export const CANAL_WIDTH = 380;
export const HALF_W = CANAL_WIDTH / 2;

// 지도 좌표(크롭 이미지 기준) 1716 부근에서 수로가 바다와 만난다.
export const SEA_Y = 1715 * SCALE;

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function buildPath(): Pt[] {
  const c = CENTERLINE.map(([x, y]) => ({ x: x * SCALE, y: y * SCALE }));
  const out: Pt[] = [];
  for (let i = 0; i < c.length - 1; i++) {
    const p0 = c[Math.max(0, i - 1)];
    const p1 = c[i];
    const p2 = c[i + 1];
    const p3 = c[Math.min(c.length - 1, i + 2)];
    for (let k = 0; k < STEPS; k++) {
      const t = k / STEPS;
      out.push({ x: catmull(p0.x, p1.x, p2.x, p3.x, t), y: catmull(p0.y, p1.y, p2.y, p3.y, t) });
    }
  }
  out.push(c[c.length - 1]);
  return out;
}

export const PATH: Pt[] = buildPath();

// 누적 길이
export const CUM: number[] = [0];
for (let i = 1; i < PATH.length; i++) {
  CUM.push(CUM[i - 1] + Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].y - PATH[i - 1].y));
}
export const TOTAL_LENGTH = CUM[CUM.length - 1];

export function pointAt(s: number): Pt & { angle: number } {
  const ss = Math.min(TOTAL_LENGTH, Math.max(0, s));
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < ss) i++;
  const a = PATH[i - 1];
  const b = PATH[i];
  const t = (ss - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

interface Nearest {
  dist: number;
  x: number;
  y: number;
  s: number;
}

function nearestIn(x: number, y: number, i0: number, i1: number): Nearest {
  let best: Nearest = { dist: Infinity, x: 0, y: 0, s: 0 };
  for (let i = i0; i < i1; i++) {
    const a = PATH[i];
    const b = PATH[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - a.x) * dx + (y - a.y) * dy) / len2));
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best.dist) best = { dist: d, x: px, y: py, s: CUM[i] + t * Math.sqrt(len2) };
  }
  return best;
}

// 지도 좌표를 월드 좌표로 바꾸고 중심선 위의 가장 가까운 지점의 누적 길이를 돌려준다.
function snapS(mapX: number, mapY: number) {
  return nearestIn(mapX * SCALE, mapY * SCALE, 0, PATH.length - 1).s;
}

// --- 랜드마크 (누적 길이 기준) ---
export const BRIDGE4_S = snapS(480, 600);
export const BRIDGE5_S = snapS(465, 1290);
export const BRIDGE6_S = snapS(100, 1690);
// 부캉이가 실제로 머무는 구간: 제4보도교 ~ 제5보도교 아래 차단 그물
export const PLAY_START_S = BRIDGE4_S - 140;
export const PLAY_END_S = BRIDGE5_S + 330;

const indexAtS = (s: number) => {
  let i = 0;
  while (i < CUM.length - 1 && CUM[i] < s) i++;
  return i;
};
const PLAY_I0 = indexAtS(PLAY_START_S);
const PLAY_I1 = indexAtS(PLAY_END_S);
const START = pointAt(PLAY_START_S);
const END = pointAt(PLAY_END_S);
const START_T = { x: Math.cos(START.angle), y: Math.sin(START.angle) };
const END_T = { x: Math.cos(END.angle), y: Math.sin(END.angle) };

export function nearestPlay(x: number, y: number) {
  return nearestIn(x, y, PLAY_I0, PLAY_I1);
}

export interface Constrained {
  x: number;
  y: number;
  hit: boolean;
  // 수로 중심선 쪽 방향
  nx: number;
  ny: number;
}

// 위치를 플레이 가능한 수로 안으로 밀어 넣는다. r 은 몸 반지름.
export function constrain(x: number, y: number, r: number): Constrained {
  let hit = false;
  let n = nearestPlay(x, y);

  // 양 끝은 둥글게 막히지 않고 차단선(그물/부표)에서 평평하게 막는다.
  if (n.s >= PLAY_END_S - 0.5) {
    const along = (x - END.x) * END_T.x + (y - END.y) * END_T.y;
    const lim = -r * 0.8;
    if (along > lim) {
      x -= END_T.x * (along - lim);
      y -= END_T.y * (along - lim);
      hit = true;
      n = nearestPlay(x, y);
    }
  } else if (n.s <= PLAY_START_S + 0.5) {
    const along = (x - START.x) * START_T.x + (y - START.y) * START_T.y;
    const lim = r * 0.8;
    if (along < lim) {
      x += START_T.x * (lim - along);
      y += START_T.y * (lim - along);
      hit = true;
      n = nearestPlay(x, y);
    }
  }

  const limit = HALF_W - r;
  if (n.dist > limit) {
    const k = limit / n.dist;
    x = n.x + (x - n.x) * k;
    y = n.y + (y - n.y) * k;
    hit = true;
  }

  const dx = n.x - x;
  const dy = n.y - y;
  const d = Math.hypot(dx, dy);
  return { x, y, hit, nx: d > 1e-3 ? dx / d : 0, ny: d > 1e-3 ? dy / d : 0 };
}

// 수로 위의 임의 지점 (오프셋: 중심선에서 옆으로 떨어진 거리)
export function randomPlayPoint(margin: number) {
  const s = PLAY_START_S + 120 + Math.random() * (PLAY_END_S - PLAY_START_S - 240);
  const p = pointAt(s);
  const off = (Math.random() * 2 - 1) * Math.max(0, HALF_W - margin);
  return { x: p.x - Math.sin(p.angle) * off, y: p.y + Math.cos(p.angle) * off };
}

export function playStartPoint() {
  const p = pointAt((BRIDGE4_S + BRIDGE5_S) / 2 - 300);
  return { x: p.x, y: p.y };
}

// --- 맵 오브젝트 ---
export const BRIDGES = [
  { name: '제4보도교', s: BRIDGE4_S, kind: 'wood' as const },
  { name: '제5보도교', s: BRIDGE5_S, kind: 'white' as const },
  { name: '제6보도교', s: BRIDGE6_S, kind: 'white' as const },
];

export const GATES = [
  { name: '', s: PLAY_START_S },
  { name: '차단 그물', s: PLAY_END_S },
];

export const WORLD = { minX: -400, minY: 300, maxX: 2400, maxY: SEA_Y + 900 };

export interface Tree {
  x: number;
  y: number;
  r: number;
  tone: number;
}

function buildTrees(): Tree[] {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const trees: Tree[] = [];
  let tries = 0;
  while (trees.length < 150 && tries < 3000) {
    tries++;
    const x = WORLD.minX + rnd() * (WORLD.maxX - WORLD.minX);
    const y = WORLD.minY + rnd() * (SEA_Y - 80 - WORLD.minY);
    const n = nearestIn(x, y, 0, PATH.length - 1);
    if (n.dist < HALF_W + 150) continue;
    trees.push({ x, y, r: 26 + rnd() * 22, tone: Math.floor(rnd() * 3) });
  }
  return trees;
}

export const TREES = buildTrees();

export interface MapLabel {
  text: string;
  x: number;
  y: number;
}

function labelBeside(s: number, text: string, side: 1 | -1): MapLabel {
  const p = pointAt(s);
  return { text, x: p.x + side * (HALF_W + 120), y: p.y };
}

export const LABELS: MapLabel[] = [
  labelBeside(BRIDGE4_S, '제4보도교', 1),
  labelBeside(BRIDGE5_S, '제5보도교', 1),
  labelBeside(PLAY_END_S, '차단 그물', 1),
  labelBeside(BRIDGE6_S, '제6보도교 · 바다 출구', 1),
  { text: '외해', x: PATH[PATH.length - 1].x + 260, y: SEA_Y + 380 },
];

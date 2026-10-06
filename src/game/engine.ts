import { CAFFEINE, CANNON, CHICKEN, difficulty, ItemKind, FISH, FishKind, GAME, SHARK } from './config';
import {
  constrain,
  CROWD,
  HALF_W,
  nearestPlay,
  PLAY_END_S,
  PLAY_START_S,
  playStartPoint,
  pointAt,
  SHOP,
  QUEUE_MAX,
  randomPlayPoint,
  TOTAL_LENGTH,
} from './map';

export interface Fish {
  id: number;
  kind: FishKind;
  x: number;
  y: number;
  angle: number;
  wobble: number;
}

// 물대포 한 발: 수로에 들어온 배(cx,cy)가 수면의 목표(tx,ty)를 조준했다가 발사한다.
export interface Shot {
  id: number;
  // 배의 현재 위치와 바라보는 방향(좌/우)
  cx: number;
  cy: number;
  facing: 1 | -1;
  // 배가 수로 중심선을 따라 들어오는 시작점/자리 (누적 길이)와 중심선에서 옆으로 떨어진 거리
  sFrom: number;
  sStation: number;
  off: number;
  tx: number;
  ty: number;
  // 조준 시작 기준 경과 시간. 배가 들어오는 동안은 음수이고, 0 이 되면 조준을 시작한다.
  t: number;
  // 조준에 걸리는 시간. 이 시간이 지나면 발사한다.
  aim: number;
  hit: boolean;
}

// 생닭을 던지는 사람과 던져진 생닭
export interface Thrower {
  kind: ItemKind;
  x: number;
  y: number;
  t: number;
  thrown: boolean;
  // 닭이 떨어질 수면 위치
  lx: number;
  ly: number;
}

export interface Chicken {
  id: number;
  kind: ItemKind;
  // 던진 위치와 떨어질 위치(x, y)
  sx: number;
  sy: number;
  x: number;
  y: number;
  t: number;
}

export interface GameState {
  // 화면 크기 (조이스틱/카메라 계산용)
  width: number;
  height: number;
  zoom: number;
  camera: { x: number; y: number };
  // 어디야 카페 근처일수록 1에 가까워지는 값 (카메라를 카페 쪽으로 당기고 화면을 넓힌다)
  focus: number;
  time: number;
  // 실제로 플레이한 시간(초). 게임 오버 뒤에는 늘지 않는다. 북항 체류일 계산에 쓴다.
  playTime: number;
  shark: {
    x: number;
    y: number;
    angle: number;
    radius: number;
    speed: number;
    blink: number;
    // 옆모습 스프라이트용: 바라보는 방향(좌/우)과 기울기, 먹는 입모양 타이머
    facing: 1 | -1;
    tilt: number;
    eat: number;
  };
  // 구경꾼: 현재 나와 있는 인원과 각자 나타난 시각, 응원 종료 시각
  crowd: { shown: number; appear: number[] };
  // 카페 대기줄: 나와 있는 손님 수와 각자 나타난 시각
  queue: { shown: number; appear: number[] };
  cheerUntil: number;
  joystick: { active: boolean; ox: number; oy: number; dx: number; dy: number };
  fish: Fish[];
  shots: Shot[];
  cannonTimer: number;
  thrower: Thrower | null;
  chickens: Chicken[];
  throwerTimer: number;
  // 카페인 부스트가 끝나는 게임 시각
  boostUntil: number;
  score: number;
  lives: number;
  over: boolean;
  // 시작 화면 등에서 게임 진행을 멈춘다.
  paused: boolean;
  spawnTimer: number;
  nextId: number;
}

export interface GameEvents {
  // score: 얻은 점수, people: 새로 구경하러 온 사람 수
  onEat: (score: number, people: number) => void;
  onHurt: () => void;
  // 생닭을 먹고 라이프가 올랐을 때
  onHeal: () => void;
  // 생닭 던지는 사람이 나타났을 때
  onThrow: (kind: ItemKind) => void;
  // 아이스 아메리카노를 마셔서 카페인 부스트가 시작됐을 때(끝나는 게임 시각)
  onBoost: (until: number) => void;
}

const FISH_KINDS = Object.keys(FISH) as FishKind[];

function pickKind(): FishKind {
  const total = FISH_KINDS.reduce((sum, k) => sum + FISH[k].weight, 0);
  let r = Math.random() * total;
  for (const kind of FISH_KINDS) {
    r -= FISH[kind].weight;
    if (r <= 0) return kind;
  }
  return 'anchovy';
}

// 화면 밖에서 수로 안쪽 임의 위치에 물고기를 하나 만든다.
function spawnFish(g: GameState, minDist: number) {
  const kind = pickKind();
  const spec = FISH[kind];
  for (let attempt = 0; attempt < 8; attempt++) {
    const p = randomPlayPoint(spec.radius * 2);
    if (Math.hypot(p.x - g.shark.x, p.y - g.shark.y) < minDist) continue;
    g.fish.push({ id: g.nextId++, kind, x: p.x, y: p.y, angle: Math.random() * Math.PI * 2, wobble: Math.random() * 6 });
    return;
  }
}

// 어디야 카페 앞에 서 있는 손님 수: 구경꾼이 늘수록 줄이 길어진다.
export const queueSize = (people: number) =>
  Math.max(0, Math.min(QUEUE_MAX, Math.floor((people - GAME.crowdBase) / 2)));

export const cupsSold = (people: number) => people * GAME.cupsPerPerson;

export const crowdSize = (score: number) =>
  Math.min(CROWD.length, GAME.crowdBase + Math.floor(score / GAME.scorePerPerson));

export function createGame(width: number, height: number): GameState {
  const zoom = width / GAME.viewWidth;
  const start = playStartPoint();
  const g: GameState = {
    width,
    height,
    zoom,
    camera: { x: start.x, y: start.y },
    focus: 0,
    time: 0,
    playTime: 0,
    shark: {
      x: start.x,
      y: start.y,
      angle: Math.PI / 2,
      radius: SHARK.baseRadius,
      speed: 0,
      blink: 0,
      facing: 1,
      tilt: 0.9,
      eat: 0,
    },
    crowd: { shown: 0, appear: [] },
    queue: { shown: 0, appear: [] },
    cheerUntil: 0,
    joystick: { active: false, ox: 0, oy: 0, dx: 0, dy: 0 },
    fish: [],
    shots: [],
    cannonTimer: CANNON.firstDelay,
    thrower: null,
    chickens: [],
    throwerTimer: CHICKEN.firstDelay,
    boostUntil: 0,
    score: 0,
    lives: GAME.lives,
    over: false,
    paused: false,
    spawnTimer: 0,
    nextId: 1,
  };
  const initial = crowdSize(0);
  for (let i = 0; i < initial; i++) g.crowd.appear.push(-10);
  g.crowd.shown = initial;
  g.queue.shown = queueSize(initial);
  for (let i = 0; i < g.queue.shown; i++) g.queue.appear.push(-10);
  for (let i = 0; i < GAME.maxFish; i++) spawnFish(g, 300);
  return g;
}

// 같은 객체를 유지한 채 처음 상태로 되돌린다.
export function resetGame(g: GameState, width: number, height: number) {
  Object.assign(g, createGame(width, height));
}

function hurt(g: GameState, events: GameEvents) {
  if (g.shark.blink > 0 || g.over) return false;
  g.lives -= 1;
  g.shark.blink = GAME.invulnerableSeconds;
  // 게임 오버 여부를 먼저 정해 둔다. (onHurt 에서 화면이 이 값을 읽는다)
  if (g.lives <= 0) g.over = true;
  events.onHurt();
  return true;
}

// 배의 위치를 계산한다: 들어올 때는 감속하며 자리로, 쏜 뒤에는 가속하며 빠져나간다.
function placeBoat(shot: Shot) {
  const sinceFire = shot.t - shot.aim;
  let s = shot.sStation;
  if (shot.t < 0) {
    const u = (shot.t + CANNON.arriveTime) / CANNON.arriveTime;
    s = shot.sFrom + (shot.sStation - shot.sFrom) * (1 - (1 - u) * (1 - u));
  } else if (sinceFire > CANNON.fireTime) {
    const v = Math.min(1, (sinceFire - CANNON.fireTime) / CANNON.leaveTime);
    s = shot.sStation + (shot.sFrom - shot.sStation) * v * v;
  }
  const p = pointAt(s);
  shot.cx = p.x - Math.sin(p.angle) * shot.off;
  shot.cy = p.y + Math.cos(p.angle) * shot.off;
  const dx = shot.tx - shot.cx;
  if (Math.abs(dx) > 24) shot.facing = dx > 0 ? 1 : -1;
}

// 상어 근처 수로에 구조정을 들여보낸다. 배는 수로 위아래 쪽에서 들어와 자리를 잡고 조준한다.
function spawnShot(g: GameState) {
  const s = g.shark;
  const near = nearestPlay(s.x, s.y);
  const dir = Math.random() < 0.5 ? -1 : 1;
  const dist = 300 + Math.random() * 150;
  const sStation = Math.min(PLAY_END_S - 100, Math.max(PLAY_START_S + 100, near.s + dir * dist));
  const sFrom = Math.min(TOTAL_LENGTH - 40, Math.max(40, sStation + dir * 650));
  const d = difficulty(g.time);
  const shot: Shot = {
    id: g.nextId++,
    cx: 0,
    cy: 0,
    facing: 1,
    sFrom,
    sStation,
    off: (Math.random() * 2 - 1) * (HALF_W - 110),
    tx: s.x,
    ty: s.y,
    t: -CANNON.arriveTime,
    aim: CANNON.aimStart + (CANNON.aimMin - CANNON.aimStart) * d,
    hit: false,
  };
  placeBoat(shot);
  g.shots.push(shot);
}

function updateShots(g: GameState, dt: number, events: GameEvents) {
  const s = g.shark;

  g.cannonTimer -= dt;
  const maxShots = Math.min(CANNON.maxShots, 1 + Math.floor(g.time / CANNON.extraEverySeconds));
  if (g.cannonTimer <= 0 && g.shots.length < maxShots) {
    spawnShot(g);
    const d = difficulty(g.time);
    g.cannonTimer = CANNON.intervalStart + (CANNON.intervalMin - CANNON.intervalStart) * d;
  }

  for (let i = g.shots.length - 1; i >= 0; i--) {
    const shot = g.shots[i];
    shot.t += dt;

    // 조준 중에는 상어를 따라가다가, 발사 직전에는 목표가 고정된다.
    if (shot.t < shot.aim - CANNON.lockTime) {
      const follow = Math.min(1, 3 * (g.time < g.boostUntil ? CAFFEINE.cannonSlow : 1) * dt);
      shot.tx += (s.x - shot.tx) * follow;
      shot.ty += (s.y - shot.ty) * follow;
    }

    const sinceFire = shot.t - shot.aim;
    // 발사 중에는 물줄기가 상어를 계속 따라온다.
    if (sinceFire >= 0 && sinceFire < CANNON.fireTime) {
      const follow = Math.min(1, CANNON.fireFollow * (g.time < g.boostUntil ? CAFFEINE.cannonSlow : 1) * dt);
      shot.tx += (s.x - shot.tx) * follow;
      shot.ty += (s.y - shot.ty) * follow;
    }
    if (sinceFire >= 0 && sinceFire < CANNON.fireTime && !shot.hit) {
      if (Math.hypot(s.x - shot.tx, s.y - shot.ty) < CANNON.radius + s.radius * 0.8) {
        if (hurt(g, events)) shot.hit = true;
      }
    }

    placeBoat(shot);
    if (sinceFire > CANNON.fireTime + CANNON.leaveTime) g.shots.splice(i, 1);
  }
}

// 새 판을 준비해 두되 진행은 멈춘다. (시작 화면용)
export function resetPaused(g: GameState, width: number, height: number) {
  resetGame(g, width, height);
  g.paused = true;
}

function normalizeAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function setJoystick(g: GameState, active: boolean, ox = 0, oy = 0, dx = 0, dy = 0) {
  g.joystick.active = active;
  g.joystick.ox = ox;
  g.joystick.oy = oy;
  g.joystick.dx = dx;
  g.joystick.dy = dy;
}

// 점수를 올리고 상어를 키우고 구경꾼을 늘린다.
function gainScore(g: GameState, points: number, events: GameEvents) {
  const s = g.shark;
  g.score += points;
  s.radius = Math.min(SHARK.maxRadius, SHARK.baseRadius + Math.floor(g.score / SHARK.growEveryScore));
  s.eat = 0.4;
  g.cheerUntil = g.time + 0.9;
  const before = g.crowd.shown;
  const target = crowdSize(g.score);
  while (g.crowd.shown < target) {
    g.crowd.appear[g.crowd.shown] = g.time + (g.crowd.shown - before) * 0.12;
    g.crowd.shown++;
  }
  const qBefore = g.queue.shown;
  const qTarget = queueSize(g.crowd.shown);
  while (g.queue.shown < qTarget) {
    g.queue.appear[g.queue.shown] = g.time + (g.queue.shown - qBefore) * 0.25;
    g.queue.shown++;
  }
  events.onEat(points, g.crowd.shown - before);
}

// 생닭을 던질 사람을 화면 안 기슭에 세우고, 닭이 떨어질 수면 위치를 정한다.
// (화면 밖에 서면 플레이어가 못 보므로, 카메라에 보이는 자리만 고른다.)
function spawnThrower(g: GameState): ItemKind | null {
  const s = g.shark;
  const halfVW = g.width / g.zoom / 2;
  const halfVH = g.height / g.zoom / 2;
  const near = nearestPlay(s.x, s.y);
  for (let attempt = 0; attempt < 30; attempt++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const cs = Math.min(PLAY_END_S - 80, Math.max(PLAY_START_S + 80, near.s + (Math.random() * 2 - 1) * 380));
    const p = pointAt(cs);
    const tx = p.x - Math.sin(p.angle) * side * (HALF_W + 62);
    const ty = p.y + Math.cos(p.angle) * side * (HALF_W + 62);
    if (Math.abs(tx - g.camera.x) > halfVW - 40 || Math.abs(ty - g.camera.y) > halfVH - 90) continue;

    // 닭이 떨어질 곳: 상어 가까운 수면이면서 던지는 사람과 적당히 떨어진 곳
    for (let k = 0; k < 8; k++) {
      const land = randomPlayPoint(60);
      const ds = Math.hypot(land.x - s.x, land.y - s.y);
      const dt = Math.hypot(land.x - tx, land.y - ty);
      if (ds < CHICKEN.minDist || ds > CHICKEN.maxDist || dt < 150 || dt > 480) continue;
      if (Math.abs(land.x - g.camera.x) > halfVW - 30 || Math.abs(land.y - g.camera.y) > halfVH - 60) continue;
      // 부스트 중에는 커피를 또 주지 않는다.
      const kind: ItemKind = g.time >= g.boostUntil && Math.random() < CAFFEINE.chance ? 'coffee' : 'chicken';
      g.thrower = { kind, x: tx, y: ty, t: 0, thrown: false, lx: land.x, ly: land.y };
      return kind;
    }
  }
  return null;
}

function updateThrower(g: GameState, dt: number, mouthX: number, mouthY: number, events: GameEvents) {
  const s = g.shark;

  g.throwerTimer -= dt;
  if (!g.thrower && g.chickens.length === 0 && g.throwerTimer <= 0) {
    // 자리를 못 찾으면 잠시 뒤 다시 시도한다.
    const kind = spawnThrower(g);
    if (kind) {
      g.throwerTimer = CHICKEN.intervalMin + Math.random() * (CHICKEN.intervalMax - CHICKEN.intervalMin);
      events.onThrow(kind);
    } else {
      g.throwerTimer = 1.5;
    }
  }

  const th = g.thrower;
  if (th) {
    th.t += dt;
    if (!th.thrown && th.t >= CHICKEN.throwAt) {
      th.thrown = true;
      g.chickens.push({ id: g.nextId++, kind: th.kind, sx: th.x, sy: th.y - 30, x: th.lx, y: th.ly, t: 0 });
    }
    if (th.t >= CHICKEN.leaveAt) g.thrower = null;
  }

  for (let i = g.chickens.length - 1; i >= 0; i--) {
    const c = g.chickens[i];
    c.t += dt;
    const age = c.t - CHICKEN.flight;
    if (age > CHICKEN.rest) {
      g.chickens.splice(i, 1);
      continue;
    }
    if (age < 0) continue;
    const reached =
      Math.hypot(c.x - mouthX, c.y - mouthY) < s.radius * 0.95 + CHICKEN.eatRadius ||
      Math.hypot(c.x - s.x, c.y - s.y) < s.radius * 1.3 + CHICKEN.eatRadius * 0.7;
    if (reached) {
      g.chickens.splice(i, 1);
      if (c.kind === 'coffee') {
        g.boostUntil = g.time + CAFFEINE.duration;
        s.eat = 0.4;
        events.onBoost(g.boostUntil);
      } else if (g.lives < GAME.maxLives) {
        g.lives += 1;
        s.eat = 0.4;
        events.onHeal();
      } else {
        gainScore(g, CHICKEN.fullLifeScore, events);
      }
    }
  }
}

export function updateGame(g: GameState, dt: number, events: GameEvents) {
  if (g.paused) return;
  g.time += dt;
  const s = g.shark;

  // 카메라는 상어를 부드럽게 따라간다. 카페 근처에서는 카페 전체가 보이도록 옆으로 당기고 화면을 넓힌다.
  const shopCy = SHOP.y + SHOP.h / 2 + 80;
  const focusTarget = Math.min(1, Math.max(0, 1 - (Math.abs(s.y - shopCy) - 250) / 450));
  g.focus += (focusTarget - g.focus) * Math.min(1, 2.5 * dt);
  const viewW = GAME.viewWidth + GAME.shopViewExtra * g.focus;
  g.zoom = g.width / viewW;
  const halfView = viewW / 2;
  const wantX = Math.min(s.x + halfView - 70, Math.max(s.x, SHOP.x + SHOP.w + 40 - halfView));
  const camX = s.x + (wantX - s.x) * g.focus;
  const follow = Math.min(1, 6 * dt);
  g.camera.x += (camX - g.camera.x) * follow;
  g.camera.y += (s.y - g.camera.y) * follow;

  if (g.over) return;
  g.playTime += dt;

  // --- 조이스틱 입력 -> 상어 이동 ---
  const boosted = g.time < g.boostUntil;
  const { active, dx, dy } = g.joystick;
  const mag = Math.min(Math.hypot(dx, dy), SHARK.joystickRadius);
  const throttle = active ? mag / SHARK.joystickRadius : 0;
  if (active && mag > 4) {
    const target = Math.atan2(dy, dx);
    const diff = normalizeAngle(target - s.angle);
    s.angle += diff * Math.min(1, SHARK.turnRate * (boosted ? CAFFEINE.turnMul : 1) * dt);
  }
  const targetSpeed = throttle * SHARK.maxSpeed * (boosted ? CAFFEINE.speedMul : 1);
  s.speed += (targetSpeed - s.speed) * Math.min(1, (boosted ? 9 : 6) * dt);
  s.x += Math.cos(s.angle) * s.speed * dt;
  s.y += Math.sin(s.angle) * s.speed * dt;

  // 옆모습 스프라이트: 좌우 방향은 뒤집고, 위아래 움직임은 기울기로 표현한다.
  const c = Math.cos(s.angle);
  if (c > 0.2) s.facing = 1;
  else if (c < -0.2) s.facing = -1;
  // 위아래로 헤엄칠 때도 고개를 크게 숙이지 않고 수면 위에서 살짝만 기운다.
  const targetTilt = Math.max(-0.3, Math.min(0.3, Math.sin(s.angle) * 0.4));
  s.tilt += (targetTilt - s.tilt) * Math.min(1, 10 * dt);
  if (s.eat > 0) s.eat -= dt;

  // 수로 벽에 부딪히면 벽을 따라 미끄러진다. (몸이 크므로 여유를 둔다)
  const wall = constrain(s.x, s.y, s.radius * 1.5, s.radius * 3.4);
  s.x = wall.x;
  s.y = wall.y;
  if (s.blink > 0) s.blink -= dt;

  updateShots(g, dt, events);
  if (g.over) return;

  // --- 물고기 스폰 (화면 밖에서만) ---
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0 && g.fish.length < GAME.maxFish) {
    const halfW = g.width / g.zoom / 2;
    const halfH = g.height / g.zoom / 2;
    spawnFish(g, Math.hypot(halfW, halfH) + 40);
    g.spawnTimer = GAME.spawnInterval;
  }

  // --- 물고기 이동/충돌 ---
  const mouthX = s.x + s.facing * Math.cos(s.tilt) * s.radius * 3.2;
  const mouthY = s.y + Math.sin(s.tilt) * s.radius * 3.2;

  for (let i = g.fish.length - 1; i >= 0; i--) {
    const f = g.fish[i];
    const spec = FISH[f.kind];

    // 상어가 가까우면 반대 방향으로 도망
    const fx = f.x - s.x;
    const fy = f.y - s.y;
    const dist = Math.hypot(fx, fy);
    let speed = spec.speed;
    if (spec.flee > 0 && dist < GAME.fleeDistance) {
      const away = Math.atan2(fy, fx);
      const diff = normalizeAngle(away - f.angle);
      f.angle += diff * Math.min(1, 4 * spec.flee * dt);
      speed *= 1 + 0.6 * spec.flee;
    } else {
      f.wobble += dt * 3;
      f.angle += Math.sin(f.wobble) * 0.6 * dt;
    }
    f.x += Math.cos(f.angle) * speed * dt;
    f.y += Math.sin(f.angle) * speed * dt;

    // 수로 벽에 닿으면 안쪽으로 방향을 튼다.
    const c = constrain(f.x, f.y, spec.radius * 1.4);
    if (c.hit) {
      f.x = c.x;
      f.y = c.y;
      const inward = c.nx === 0 && c.ny === 0 ? f.angle + Math.PI : Math.atan2(c.ny, c.nx);
      f.angle = inward + (Math.random() - 0.5) * 0.8;
    }

    // 충돌: 입 위치와 물고기 거리
    const hit =
      Math.hypot(f.x - mouthX, f.y - mouthY) < s.radius * 0.95 + spec.radius * 0.8 ||
      Math.hypot(f.x - s.x, f.y - s.y) < s.radius * 1.3 + spec.radius * 0.7;
    if (!hit) continue;

    g.fish.splice(i, 1);
    gainScore(g, spec.score, events);
  }

  updateThrower(g, dt, mouthX, mouthY, events);
}

export const visitorsFor = (score: number) => crowdSize(score) * GAME.visitorsPerPerson;

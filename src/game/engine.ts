import { FISH, FishKind, GAME, SHARK } from './config';
import { constrain, playStartPoint, randomPlayPoint } from './map';

export interface Fish {
  id: number;
  kind: FishKind;
  x: number;
  y: number;
  angle: number;
  wobble: number;
}

export interface GameState {
  // 화면 크기 (조이스틱/카메라 계산용)
  width: number;
  height: number;
  zoom: number;
  camera: { x: number; y: number };
  time: number;
  shark: { x: number; y: number; angle: number; radius: number; speed: number; blink: number };
  joystick: { active: boolean; ox: number; oy: number; dx: number; dy: number };
  fish: Fish[];
  score: number;
  lives: number;
  over: boolean;
  spawnTimer: number;
  nextId: number;
}

export interface GameEvents {
  onEat: (score: number) => void;
  onHurt: () => void;
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

export function createGame(width: number, height: number): GameState {
  const zoom = width / GAME.viewWidth;
  const start = playStartPoint();
  const g: GameState = {
    width,
    height,
    zoom,
    camera: { x: start.x, y: start.y },
    time: 0,
    shark: { x: start.x, y: start.y, angle: Math.PI / 2, radius: SHARK.baseRadius, speed: 0, blink: 0 },
    joystick: { active: false, ox: 0, oy: 0, dx: 0, dy: 0 },
    fish: [],
    score: 0,
    lives: GAME.lives,
    over: false,
    spawnTimer: 0,
    nextId: 1,
  };
  for (let i = 0; i < GAME.maxFish; i++) spawnFish(g, 300);
  return g;
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

export function updateGame(g: GameState, dt: number, events: GameEvents) {
  g.time += dt;
  const s = g.shark;

  // 카메라는 상어를 부드럽게 따라간다.
  const follow = Math.min(1, 6 * dt);
  g.camera.x += (s.x - g.camera.x) * follow;
  g.camera.y += (s.y - g.camera.y) * follow;

  if (g.over) return;

  // --- 조이스틱 입력 -> 상어 이동 ---
  const { active, dx, dy } = g.joystick;
  const mag = Math.min(Math.hypot(dx, dy), SHARK.joystickRadius);
  const throttle = active ? mag / SHARK.joystickRadius : 0;
  if (active && mag > 4) {
    const target = Math.atan2(dy, dx);
    const diff = normalizeAngle(target - s.angle);
    s.angle += diff * Math.min(1, SHARK.turnRate * dt);
  }
  const targetSpeed = throttle * SHARK.maxSpeed;
  s.speed += (targetSpeed - s.speed) * Math.min(1, 6 * dt);
  s.x += Math.cos(s.angle) * s.speed * dt;
  s.y += Math.sin(s.angle) * s.speed * dt;

  // 수로 벽에 부딪히면 벽을 따라 미끄러진다.
  const wall = constrain(s.x, s.y, s.radius * 0.9);
  s.x = wall.x;
  s.y = wall.y;
  if (s.blink > 0) s.blink -= dt;

  // --- 물고기 스폰 (화면 밖에서만) ---
  g.spawnTimer -= dt;
  if (g.spawnTimer <= 0 && g.fish.length < GAME.maxFish) {
    const halfW = g.width / g.zoom / 2;
    const halfH = g.height / g.zoom / 2;
    spawnFish(g, Math.hypot(halfW, halfH) + 40);
    g.spawnTimer = GAME.spawnInterval;
  }

  // --- 물고기 이동/충돌 ---
  const mouthX = s.x + Math.cos(s.angle) * s.radius * 0.9;
  const mouthY = s.y + Math.sin(s.angle) * s.radius * 0.9;

  for (let i = g.fish.length - 1; i >= 0; i--) {
    const f = g.fish[i];
    const spec = FISH[f.kind];

    // 상어가 가까우면 반대 방향으로 도망
    const fx = f.x - s.x;
    const fy = f.y - s.y;
    const dist = Math.hypot(fx, fy);
    let speed = spec.speed;
    if (spec.flee > 0 && dist < GAME.fleeDistance && !spec.harmful) {
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
    const hit = Math.hypot(f.x - mouthX, f.y - mouthY) < s.radius * 0.7 + spec.radius * 0.6;
    if (!hit) continue;

    if (spec.harmful) {
      if (s.blink <= 0) {
        g.lives -= 1;
        s.blink = GAME.invulnerableSeconds;
        events.onHurt();
        if (g.lives <= 0) g.over = true;
      }
      g.fish.splice(i, 1);
    } else {
      g.score += spec.score;
      s.radius = Math.min(
        SHARK.maxRadius,
        SHARK.baseRadius + Math.floor(g.score / SHARK.growEveryScore),
      );
      g.fish.splice(i, 1);
      events.onEat(spec.score);
    }
  }
}

export const visitorsFor = (score: number) => score * GAME.visitorsPerScore;

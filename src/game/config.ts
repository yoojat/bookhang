export type FishKind = 'anchovy' | 'mullet' | 'puffer';

export interface FishSpec {
  radius: number;
  speed: number;
  score: number;
  color: string;
  belly: string;
  // 0 = 상어를 신경 쓰지 않음, 1 = 가까이 오면 도망
  flee: number;
  harmful: boolean;
  weight: number;
}

export const FISH: Record<FishKind, FishSpec> = {
  anchovy: { radius: 6, speed: 70, score: 10, color: '#9fb8c9', belly: '#e3eef5', flee: 0.4, harmful: false, weight: 5 },
  mullet: { radius: 11, speed: 95, score: 30, color: '#7a8c99', belly: '#d9e1e6', flee: 1, harmful: false, weight: 4 },
  puffer: { radius: 12, speed: 45, score: 0, color: '#c9a24a', belly: '#f1e2b0', flee: 0, harmful: true, weight: 1.4 },
};

export const SHARK = {
  baseRadius: 16,
  maxRadius: 30,
  maxSpeed: 190,
  turnRate: 5,
  joystickRadius: 60,
  growEveryScore: 120,
};

export const GAME = {
  maxFish: 18,
  spawnInterval: 0.45,
  lives: 3,
  invulnerableSeconds: 1.5,
  // 점수 1점당 늘어나는 "방문객" 수치 연출용 배율
  visitorsPerScore: 120,
};

export const COLORS = {
  water: '#1f6f8b',
  waterDeep: '#17566e',
  bank: '#8a8f94',
  bankEdge: '#5f656a',
  ripple: 'rgba(255,255,255,0.12)',
  shark: '#6b7b89',
  sharkBelly: '#dfe7ec',
  sharkFin: '#55646f',
};

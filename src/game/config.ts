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
  anchovy: { radius: 6, speed: 100, score: 10, color: '#9fb8c9', belly: '#e3eef5', flee: 0.4, harmful: false, weight: 5 },
  mullet: { radius: 11, speed: 135, score: 30, color: '#7a8c99', belly: '#d9e1e6', flee: 1, harmful: false, weight: 4 },
  puffer: { radius: 12, speed: 65, score: 0, color: '#c9a24a', belly: '#f1e2b0', flee: 0, harmful: true, weight: 1.4 },
};

export const SHARK = {
  baseRadius: 16,
  maxRadius: 24,
  maxSpeed: 300,
  turnRate: 5,
  joystickRadius: 60,
  growEveryScore: 150,
};

export const GAME = {
  maxFish: 18,
  // 화면 가로가 월드 좌표로 이만큼 보이도록 카메라 배율을 정한다.
  viewWidth: 600,
  fleeDistance: 170,
  spawnInterval: 0.45,
  lives: 3,
  invulnerableSeconds: 1.5,
  // 점수 1점당 늘어나는 "방문객" 수치 연출용 배율
  visitorsPerScore: 120,
};

export const COLORS = {
  land: '#9ccf74',
  promenade: '#f1e6c4',
  bankEdge: '#b8bdc0',
  water: '#5fb8d1',
  waterLight: '#74c6dc',
  waterDeep: '#58b0cb',
  ripple: 'rgba(255,255,255,0.35)',
  sea: '#8fd6df',
  seaDeep: '#6fc3d0',
  seawall: '#a9aeb2',
  woodDeck: '#a9825a',
  woodDeckLine: '#8a6a47',
  woodRail: '#7b5c3c',
  whiteDeck: '#eef2f3',
  whiteRail: '#c9d2d6',
  buoy: '#ff8a3d',
  shark: '#6b7b89',
  sharkBelly: '#dfe7ec',
  sharkFin: '#55646f',
};

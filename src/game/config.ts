export type FishKind = 'anchovy' | 'mullet';

// 던져 주는 물건: 생닭(라이프 +1), 어디야 아이스 아메리카노(카페인 부스트)
export type ItemKind = 'chicken' | 'coffee';

export interface FishSpec {
  radius: number;
  speed: number;
  score: number;
  color: string;
  belly: string;
  // 0 = 상어를 신경 쓰지 않음, 1 = 가까이 오면 도망
  flee: number;
  weight: number;
}

export const FISH: Record<FishKind, FishSpec> = {
  anchovy: { radius: 6, speed: 100, score: 10, color: '#9fb8c9', belly: '#e3eef5', flee: 0.4, weight: 5 },
  mullet: { radius: 11, speed: 135, score: 30, color: '#7a8c99', belly: '#d9e1e6', flee: 1, weight: 4 },
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
  // 어디야 카페 근처에서는 카페 전체가 보이도록 화면을 이만큼 더 넓게 보여준다.
  shopViewExtra: 230,
  fleeDistance: 170,
  spawnInterval: 0.45,
  lives: 3,
  // 생닭으로 늘릴 수 있는 최대 라이프
  maxLives: 5,
  invulnerableSeconds: 1.5,
  // 구경꾼: 기본 인원 + 점수 N점마다 1명. 사람 한 명이 방문객 수 몇 명을 나타내는지도 정한다.
  crowdBase: 0,
  // 게임 속 하루: 플레이 시간 이만큼(초)이 지날 때마다 북항 체류일이 하루 늘어난다.
  secondsPerDay: 30,
  scorePerPerson: 10,
  visitorsPerPerson: 1200,
  // 어디야 카페: 구경꾼 한 명당 팔리는 커피 잔 수(표시용), 줄 서는 최대 인원
  cupsPerPerson: 60,
  queueMax: 12,
};

// 물대포: 북항에서 실제로 배 위에서 물줄기를 쏘며 부캉이를 외해로 유도하려 한 일에서 따왔다.
// 난이도는 게임 시간에 따라 올라간다. (임시 값, 추후 조정)
export const CANNON = {
  radius: 80,
  // 조준(경고) 시간: 처음 -> 최소
  aimStart: 1.5,
  aimMin: 0.75,
  // 발사 직전 이 시간 동안은 목표가 고정되어 피해야 한다.
  lockTime: 0.5,
  // 배가 목표 위치로 들어오는 시간 / 쏜 뒤 빠져나가는 시간
  arriveTime: 1.4,
  leaveTime: 1.2,
  // 발사하는 동안(약 1초) 물줄기가 상어를 따라온다. fireFollow 가 클수록 빨리 따라붙는다.
  fireTime: 1.0,
  fireFollow: 2.2,
  // 발사 간격: 처음 -> 최소
  intervalStart: 4.5,
  intervalMin: 1.6,
  firstDelay: 5,
  // 이 시간(초)에 최고 난이도에 도달
  rampSeconds: 150,
  // 동시에 존재할 수 있는 물대포 수는 이 시간(초)마다 하나씩 늘어난다.
  extraEverySeconds: 60,
  maxShots: 3,
};

// 생닭 던지는 사람: 가끔 기슭에 나타나 수로로 생닭을 던진다. 먹으면 라이프가 하나 오른다.
export const CHICKEN = {
  firstDelay: 7,
  intervalMin: 16,
  intervalMax: 24,
  // 사람이 등장해서 던질 때까지 / 퇴장할 때까지 (초)
  throwAt: 1.4,
  leaveAt: 3.4,
  flight: 0.9,
  // 물에 떠 있는 시간(초). 이 시간이 지나면 가라앉는다.
  rest: 10,
  eatRadius: 28,
  // 상어에서 이 거리 범위 안에 떨어진다.
  minDist: 220,
  maxDist: 520,
  // 라이프가 가득 찼을 때 대신 받는 점수
  fullLifeScore: 50,
};

// 카페인 부스트: 어디야 바리스타가 가끔 아이스 아메리카노를 수면에 띄워 보낸다.
// 마시면 한동안 빨라지고, 물대포 배의 조준이 느려진다.
export const CAFFEINE = {
  // 던지는 물건이 커피일 확률
  chance: 0.4,
  duration: 10,
  speedMul: 1.45,
  turnMul: 1.3,
  // 부스트 중 물대포 목표가 상어를 따라붙는 속도의 배율(작을수록 느림)
  cannonSlow: 0.55,
};

// 그물 몰이: 북항에서 실제로 배 두 척과 작업자들이 그물(길이 50m, 높이 6.8m)을 끌며 부캉이를 외해 쪽으로 몰았다.
// 게임에서는 후반으로 갈수록 그물이 수로를 훑고 내려오고, 두 배 사이의 빈틈으로 빠져나가야 한다.
export const NET = {
  firstDelay: 40,
  intervalStart: 32,
  intervalMin: 14,
  // 그물이 수로를 따라 내려오는 속도(월드 단위/초): 처음 -> 최고 난이도
  speedStart: 80,
  speedMax: 150,
  // 그물 띠의 두께
  band: 40,
  // 두 배 사이 빈틈의 반폭: 처음 -> 최고 난이도
  gapStart: 112,
  gapMin: 72,
  // 동시에 내려오는 그물 수는 이 시간(초) 이후 2개까지
  secondNetAfter: 110,
};

// 만조: 물이 차오르면 그물이 가라앉아 넘을 수 있다. (실제로 부캉이도 만조 때 그물을 넘어 돌아왔다.)
export const TIDE = {
  first: 75,
  period: 60,
  duration: 9,
};

export const difficulty = (time: number) => Math.min(1, time / CANNON.rampSeconds);

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

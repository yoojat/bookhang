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
  secondsPerDay: 60,
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
  band: 52,
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

// 낮과 밤: 하루(secondsPerDay)가 낮 -> 해질녘 -> 밤 -> 새벽 순서로 흐른다.
// 실제로 북항에서 밤(오후 9시, 새벽 2시)에 사람들이 손전등과 대형 랜턴, 레이저로 부캉이를 비춰
// 눈부심과 생체리듬 교란 우려가 제기된 일에서 따왔다.
export const DAY = {
  // 하루 중 비율: 낮 [0, dayEnd), 해질녘 [dayEnd, duskEnd), 밤 [duskEnd, nightEnd), 새벽 [nightEnd, 1)
  dayEnd: 0.58,
  duskEnd: 0.7,
  nightEnd: 0.93,
};

export type DayPhase = 'day' | 'dusk' | 'night' | 'dawn';

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// 플레이 시간으로 지금이 하루 중 어느 때인지, 얼마나 어두운지(0~1)를 구한다.
export function dayInfo(playTime: number): { phase: DayPhase; dark: number } {
  const t = (playTime / GAME.secondsPerDay) % 1;
  if (t < DAY.dayEnd) return { phase: 'day', dark: 0 };
  if (t < DAY.duskEnd) return { phase: 'dusk', dark: smooth((t - DAY.dayEnd) / (DAY.duskEnd - DAY.dayEnd)) };
  if (t < DAY.nightEnd) return { phase: 'night', dark: 1 };
  return { phase: 'dawn', dark: 1 - smooth((t - DAY.nightEnd) / (1 - DAY.nightEnd)) };
}

// 밤에 기슭에서 불빛을 비추는 사람들
export const LAMP = {
  // 밤이 시작되고 첫 사람이 나타나기까지 / 이후 간격(초)
  firstDelay: 2.5,
  intervalMin: 5,
  intervalMax: 8,
  // 사람이 머무는 시간(초). 처음 arrive 초 동안은 올라와 자리를 잡는다.
  life: 5.5,
  arrive: 0.8,
  // 손전등: 좁고 빠르게 쫓아온다 / 대형 랜턴: 넓지만 느리다.
  // range: 불빛이 닿는 최대 거리(월드 단위). 기슭에서 수로 한가운데 근처까지만 비추고, 그보다 멀면 쫓아가지 않는다.
  flash: { half: 0.17, follow: 2.0, need: 1.1, range: 330 },
  lantern: { half: 0.36, follow: 1.0, need: 1.6, range: 290 },
  // 불빛에 이만큼(초) 계속 비치면 하트가 하나 깎인다. (위 need 참고) 비치지 않으면 이 배율로 빠르게 회복한다.
  recover: 1.6,
  // 두 번째 사람부터는 이 체류일(일) 이후에 함께 나타난다.
  secondAfterDays: 1,
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

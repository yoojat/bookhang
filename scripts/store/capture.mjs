// 앱스토어 스크린샷용 원본 화면을 웹 빌드에서 캡처한다.
// 준비: npx expo export -p web  →  (dist 를 http://localhost:8099 로 서빙)  →  node scripts/store/capture.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'store/raw');
fs.mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.URL ?? 'http://localhost:8099/?debug';
// iPhone 6.9인치(1320x2868)와 같은 비율: 440x956 화면을 3배로 캡처한다.
const VIEW = { width: 440, height: 956, deviceScaleFactor: 3 };

// ONLY=chicken 처럼 일부 장면만 다시 찍을 수 있다.
const want = (name) => !process.env.ONLY || process.env.ONLY === name;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function openGame() {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__bk && window.__bk.game, { timeout: 30000 });
  await sleep(1500);
  return page;
}

// 가까운 물고기를 쫓아 먹는 봇: 점수와 구경꾼을 자연스럽게 쌓는다.
const startBot = (page) =>
  page.evaluate(() => {
    const { game: g } = window.__bk;
    g.cannonTimer = 9999;
    g.netTimer = 9999;
    g.throwerTimer = 9999;
    window.__bot = setInterval(() => {
      if (g.paused || g.over || g.escaped || g.exitPrompt) return;
      let best = null;
      let bd = 1e9;
      for (const f of g.fish) {
        const d = Math.hypot(f.x - g.shark.x, f.y - g.shark.y);
        if (d < bd) {
          bd = d;
          best = f;
        }
      }
      if (best) {
        g.joystick.active = true;
        g.joystick.ox = 220;
        g.joystick.oy = 500;
        g.joystick.dx = best.x - g.shark.x;
        g.joystick.dy = best.y - g.shark.y;
      }
    }, 50);
  });

const stopBot = (page) =>
  page.evaluate(() => {
    clearInterval(window.__bot);
    const { game: g } = window.__bk;
    g.joystick.active = false;
  });

const pause = (page, on) => page.evaluate((v) => { window.__bk.game.paused = v; }, on);

async function snap(page, name, { freeze = true } = {}) {
  if (freeze) await pause(page, true);
  await sleep(250);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log('captured', name);
  if (freeze) await pause(page, false);
}

// 화면 아래에 잠깐 뜨는 안내 문구는 스크린샷을 가리므로 숨긴다.
const hideToasts = (page) =>
  page.evaluate(() => {
    const re = /날아온다|그물 몰이|어디야 배달|만조!/;
    for (const el of document.querySelectorAll('div')) {
      if (el.children.length === 0 && re.test(el.textContent || '') && el.parentElement) el.parentElement.style.display = 'none';
    }
  });

const waitFor = (page, fn, arg, timeout = 20000) => page.waitForFunction(fn, { timeout, polling: 50 }, arg);

// "바다로 나가기" 버튼을 실제로 눌러서 엔딩을 띄운다.
async function goToSea(page) {
  await page.evaluate(() => { window.__bk.game.exitAnswer = 'go'; });
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div,span')].find((e) => e.children.length === 0 && e.textContent === '바다로 나가기');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (box) await page.mouse.click(box.x, box.y);
  await waitFor(page, () => window.__bk.game.escaped, null, 8000);
  await sleep(2600);
}

// 어디야 카페 앞 수로 한가운데: 구경꾼, 카페, 대기줄이 한 화면에 들어온다.
const teleportToCafe = (page) =>
  page.evaluate(() => {
    const { game: g, pointAt, BRIDGE4_S } = window.__bk;
    const p = pointAt(BRIDGE4_S + 860);
    g.shark.x = p.x;
    g.shark.y = p.y;
    g.shark.speed = 0;
    g.camera.x = p.x + 120;
    g.camera.y = p.y;
  });

const teleportToExit = (page) =>
  page.evaluate(() => {
    const { game: g, pointAt, EXIT_S } = window.__bk;
    const p = pointAt(EXIT_S - 160);
    g.shark.x = p.x;
    g.shark.y = p.y;
    g.camera.x = p.x;
    g.camera.y = p.y;
  });

// ---------------------------------------------------------------------------
// 1) 플레이 화면 -> 출구 질문 -> 엔딩(당당한 퇴장)  (실제로 점수를 쌓은 판)
// ---------------------------------------------------------------------------
if (want('play')) {
  const page = await openGame();
  await startBot(page);
  await waitFor(page, () => window.__bk.game.score >= 150, null, 300000);
  await stopBot(page);
  await teleportToCafe(page);
  await sleep(2200);
  await snap(page, '1-play');
  await page.evaluate(() => { window.__bk.game.playTime = 62; });
  await teleportToExit(page);
  await waitFor(page, () => window.__bk.game.exitPrompt, null, 8000);
  await sleep(600);
  await page.screenshot({ path: path.join(outDir, '6-exit.png') });
  console.log('captured 6-exit');
  await goToSea(page);
  await page.screenshot({ path: path.join(outDir, '8-ending-proud.png') });
  console.log('captured 8-ending-proud');
  await page.close();
}

// ---------------------------------------------------------------------------
// 2) 물대포 배, 3) 그물 몰이, 4) 카페인 부스트
// ---------------------------------------------------------------------------
if (want('items')) {
  const page = await openGame();
  await startBot(page);
  await waitFor(page, () => window.__bk.game.score >= 100, null, 300000);
  await stopBot(page);
  await teleportToCafe(page);
  await sleep(1800);

  // 물대포: 조준이 빨갛게 고정된 순간 (상어가 원 안에 보인다)
  await page.evaluate(() => { window.__bk.game.cannonTimer = 0; });
  await waitFor(page, () => {
    const sh = window.__bk.game.shots[0];
    return sh && sh.t > sh.aim - 0.25;
  }, null, 30000);
  await snap(page, '2-cannon');
  await page.evaluate(() => { window.__bk.game.shots.length = 0; window.__bk.game.cannonTimer = 9999; });

  // 그물 몰이: 그물이 상어 바로 위까지 내려왔을 때
  await page.evaluate(() => {
    const g = window.__bk.game;
    g.time = Math.max(g.time, 80);
    g.netTimer = 0;
  });
  await waitFor(page, () => window.__bk.game.nets.length > 0, null, 15000);
  await page.evaluate(() => {
    const { game: g, nearestPlay } = window.__bk;
    g.nets[0].s = nearestPlay(g.shark.x, g.shark.y).s - 330;
  });
  await waitFor(page, () => {
    const { game: g, nearestPlay } = window.__bk;
    return g.nets.length > 0 && nearestPlay(g.shark.x, g.shark.y).s - g.nets[0].s < 120;
  }, null, 15000);
  await hideToasts(page);
  await snap(page, '3-net');
  await page.evaluate(() => { window.__bk.game.nets.length = 0; window.__bk.game.netTimer = 9999; });

  // 카페인 부스트: 커피를 던지게 하고 마신다
  await page.evaluate(() => { window.__bk.game.throwerTimer = 0; });
  await waitFor(page, () => window.__bk.game.thrower, null, 20000);
  await page.evaluate(() => { window.__bk.game.thrower.kind = 'coffee'; });
  await waitFor(page, () => window.__bk.game.chickens.some((c) => c.kind === 'coffee' && c.t > 1.4), null, 20000);
  await page.evaluate(() => {
    const g = window.__bk.game;
    const c = g.chickens.find((x) => x.kind === 'coffee');
    g.shark.x = c.x - 12;
    g.shark.y = c.y;
    g.throwerTimer = 9999;
  });
  await waitFor(page, () => window.__bk.game.time < window.__bk.game.boostUntil, null, 8000);
  await page.evaluate(() => {
    const g = window.__bk.game;
    g.joystick.active = true; g.joystick.ox = 220; g.joystick.oy = 500; g.joystick.dx = 60; g.joystick.dy = 20;
  });
  await sleep(900);
  await page.evaluate(() => { window.__bk.game.joystick.active = false; });
  await snap(page, '4-boost');
  await page.close();
}

// ---------------------------------------------------------------------------
// 5) 생닭 던지는 사람
// ---------------------------------------------------------------------------
if (want('chicken')) {
  const page = await openGame();
  await startBot(page);
  await waitFor(page, () => window.__bk.game.score >= 40, null, 120000);
  await stopBot(page);
  await teleportToCafe(page);
  await sleep(1800);
  await page.evaluate(() => { window.__bk.game.throwerTimer = 0; });
  await waitFor(page, () => window.__bk.game.thrower, null, 20000);
  await page.evaluate(() => { window.__bk.game.thrower.kind = 'chicken'; });
  await waitFor(page, () => {
    const g = window.__bk.game;
    return g.thrower && g.chickens.some((c) => c.kind === 'chicken' && c.t > 1.7);
  }, null, 20000);
  await hideToasts(page);
  await snap(page, '5-chicken');
  await page.close();
}

// ---------------------------------------------------------------------------
// 7) 엔딩(전설의 북항이): 점수를 높여서 가장 화려한 엔딩을 본다
// ---------------------------------------------------------------------------
if (want('legend')) {
  const page = await openGame();
  await startBot(page);
  await waitFor(page, () => window.__bk.game.score >= 40, null, 120000);
  await stopBot(page);
  await page.evaluate(() => {
    const g = window.__bk.game;
    g.score = 700;
    g.playTime = 95;
    for (let i = g.crowd.shown; i < 70; i++) g.crowd.appear[i] = -10;
    g.crowd.shown = 70;
  });
  await teleportToExit(page);
  await waitFor(page, () => window.__bk.game.exitPrompt, null, 8000);
  await goToSea(page);
  await page.screenshot({ path: path.join(outDir, '7-ending-legend.png') });
  console.log('captured 7-ending-legend');
  await page.close();
}

await browser.close();

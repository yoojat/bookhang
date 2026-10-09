// Google Play 스토어용 이미지: 앱 아이콘(512), 대표 이미지(1024x500), 휴대전화 스크린샷(2:1 이내)을 만든다.
// 실행: node scripts/store/play-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const raw = path.join(root, 'store/raw');
const out = path.join(root, 'store/play');
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
const FONT = "Apple SD Gothic Neo, AppleGothic, Noto Sans KR, sans-serif";

// 1) 앱 아이콘 512x512
await sharp(path.join(root, 'assets/icon.png')).resize(512, 512).png().toFile(path.join(out, 'app-icon-512.png'));

// 2) 대표 이미지 1024x500: 해돋이 일러스트 위에 제목
const hero = await sharp(path.join(root, 'assets/endings/brave.png')).resize(1024, 640, { fit: 'cover' }).extract({ left: 0, top: 70, width: 1024, height: 500 }).toBuffer();
const title = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1d3a" stop-opacity="0.55"/><stop offset="0.6" stop-color="#0b1d3a" stop-opacity="0"/></linearGradient></defs>
<rect width="1024" height="500" fill="url(#s)"/>
<text x="56" y="190" font-family="${FONT}" font-size="124" font-weight="900" fill="#12263a" opacity="0.35" transform="translate(0 6)">북항이</text>
<text x="56" y="190" font-family="${FONT}" font-size="124" font-weight="900" fill="#ffffff">북항이</text>
<text x="60" y="252" font-family="${FONT}" font-size="38" font-weight="800" fill="#ffe27a">바다로 돌아가는 상어의 모험</text>
</svg>`;
await sharp(hero).composite([{ input: Buffer.from(title) }]).flatten({ background: '#ffffff' }).removeAlpha().png().toFile(path.join(out, 'feature-graphic-1024x500.png'));

// 3) 휴대전화 스크린샷: 한 변이 다른 변의 2배를 넘으면 안 되므로 2:1 비율(1080x2160)로 만든다.
const slides = [
  { raw: '1-play', lines: ['북항 수로에 나타난 상어', '북항이를 도와주세요!'], colors: ['#3db5f0', '#1f78c8'] },
  { raw: '2-cannon', lines: ['물대포 배의 조준을', '피해 도망쳐요'], colors: ['#ff9a5a', '#e0563f'] },
  { raw: '3-net', lines: ['그물 사이 빈틈으로', '빠져나가요'], colors: ['#44c6b8', '#1d8aa8'] },
  { raw: '4-boost', lines: ['카페인 부스트로', '쌩쌩 헤엄쳐요'], colors: ['#5a7bd8', '#2b3f9e'] },
  { raw: '5-chicken', lines: ['생닭을 먹으면', '하트가 하나 늘어요'], colors: ['#f7a8c4', '#d9568a'] },
  { raw: '7-ending-legend', lines: ['바다로 돌아가는', '감동의 엔딩'], colors: ['#7a5ad8', '#2b2f6b'] },
  { raw: '8-ending-proud', lines: ['구경꾼이 늘어날수록', '엔딩도 달라져요'], colors: ['#ffb347', '#e0703a'] },
];
const W = 1080;
const H = 2160;
const PW = 900;
const PH = Math.round((PW * 2868) / 1320);
const PX = (W - PW) / 2;
const PY = 430;
const R = 90;
const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${R}" fill="#fff"/></svg>`;
const bezel = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW + 40}" height="${PH + 40}"><rect x="10" y="10" width="${PW + 20}" height="${PH + 20}" rx="${R + 10}" fill="none" stroke="#0d1a24" stroke-width="20"/></svg>`;
for (const [i, s] of slides.entries()) {
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
  <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${s.colors[0]}"/><stop offset="1" stop-color="${s.colors[1]}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="${W / 2}" y="190" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="800" fill="#12263a" opacity="0.28" transform="translate(0 5)">${s.lines[0]}</text>
  <text x="${W / 2}" y="190" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="800" fill="#fff">${s.lines[0]}</text>
  <text x="${W / 2}" y="300" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="800" fill="#12263a" opacity="0.28" transform="translate(0 5)">${s.lines[1]}</text>
  <text x="${W / 2}" y="300" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="800" fill="#ffe27a">${s.lines[1]}</text></svg>`;
  const shot = await sharp(path.join(raw, `${s.raw}.png`)).resize(PW, PH).composite([{ input: Buffer.from(mask), blend: 'dest-in' }]).png().toBuffer();
  const composed = await sharp(Buffer.from(bg)).composite([{ input: shot, left: PX, top: PY }, { input: Buffer.from(bezel), left: PX - 20, top: PY - 20 }]).png().toBuffer();
  await sharp(composed).flatten({ background: '#ffffff' }).removeAlpha().png().toFile(path.join(out, 'screenshots', `${String(i + 1).padStart(2, '0')}-${s.raw}.png`));
}
console.log('done');

// 캡처한 원본(store/raw)에 제목 문구와 배경을 입혀 앱스토어용 스크린샷(1320x2868)을 만든다.
// 실행: node scripts/store/compose.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rawDir = path.join(root, 'store/raw');
// App Store Connect 의 화면 크기별 칸에 맞춰 여러 크기로 내보낸다.
//  - medium: Dynamic Island 지원 iPhone (중형 디스플레이) -> 필수. 1206x2622
//  - large : Dynamic Island 지원 iPhone (대형 디스플레이) -> 선택. 1320x2868
const sizes = [
  { name: 'medium-1206x2622', width: 1206, height: 2622 },
  { name: 'large-1320x2868', width: 1320, height: 2868 },
];
const baseDir = path.join(root, 'store/screenshots');
for (const size of sizes) fs.mkdirSync(path.join(baseDir, size.name), { recursive: true });

const W = 1320;
const H = 2868;
const FONT = "Apple SD Gothic Neo, AppleGothic, Noto Sans KR, sans-serif";

const slides = [
  { raw: '1-play', lines: ['북항 수로에 나타난 상어', '북항이를 도와주세요!'], colors: ['#3db5f0', '#1f78c8'] },
  { raw: '2-cannon', lines: ['물대포 배의 조준을', '피해 도망쳐요'], colors: ['#ff9a5a', '#e0563f'] },
  { raw: '3-net', lines: ['그물 사이 빈틈으로', '빠져나가요'], colors: ['#44c6b8', '#1d8aa8'] },
  { raw: '4-boost', lines: ['카페인 부스트로', '쌩쌩 헤엄쳐요'], colors: ['#5a7bd8', '#2b3f9e'] },
  { raw: '5-chicken', lines: ['생닭을 먹으면', '하트가 하나 늘어요'], colors: ['#f7a8c4', '#d9568a'] },
  { raw: '7-ending-legend', lines: ['바다로 돌아가는', '감동의 엔딩'], colors: ['#7a5ad8', '#2b2f6b'] },
  { raw: '8-ending-proud', lines: ['구경꾼이 늘어날수록', '엔딩도 달라져요'], colors: ['#ffb347', '#e0703a'] },
];

const bg = ({ lines, colors }, i) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.1" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<g fill="#fff" opacity="0.12">
  <circle cx="${i % 2 ? 1180 : 140}" cy="120" r="180"/><circle cx="${i % 2 ? 120 : 1200}" cy="560" r="90"/>
</g>
<text x="${W / 2}" y="250" text-anchor="middle" font-family="${FONT}" font-size="104" font-weight="800" fill="#12263a" opacity="0.28" transform="translate(0 6)">${lines[0]}</text>
<text x="${W / 2}" y="250" text-anchor="middle" font-family="${FONT}" font-size="104" font-weight="800" fill="#fff">${lines[0]}</text>
<text x="${W / 2}" y="378" text-anchor="middle" font-family="${FONT}" font-size="104" font-weight="800" fill="#12263a" opacity="0.28" transform="translate(0 6)">${lines[1]}</text>
<text x="${W / 2}" y="378" text-anchor="middle" font-family="${FONT}" font-size="104" font-weight="800" fill="#ffe27a">${lines[1]}</text>
</svg>`;

const PHONE_W = 1100;
const PHONE_H = Math.round((PHONE_W * 2868) / 1320);
const PX = (W - PHONE_W) / 2;
const PY = 520;
const R = 110;

const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W}" height="${PHONE_H}"><rect width="${PHONE_W}" height="${PHONE_H}" rx="${R}" fill="#fff"/></svg>`;
const bezel = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W + 40}" height="${PHONE_H + 40}"><rect x="10" y="10" width="${PHONE_W + 20}" height="${PHONE_H + 20}" rx="${R + 10}" fill="none" stroke="#0d1a24" stroke-width="20"/></svg>`;
const shadow = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W + 200}" height="${PHONE_H + 200}"><rect x="100" y="120" width="${PHONE_W}" height="${PHONE_H}" rx="${R}" fill="#000" opacity="0.4"/></svg>`;

for (const [i, slide] of slides.entries()) {
  const shot = await sharp(path.join(rawDir, `${slide.raw}.png`))
    .resize(PHONE_W, PHONE_H)
    .composite([{ input: Buffer.from(mask), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const blurredShadow = await sharp(Buffer.from(shadow)).blur(24).png().toBuffer();
  const composed = await sharp(Buffer.from(bg(slide, i)))
    .composite([
      { input: blurredShadow, left: PX - 100, top: PY - 100 },
      { input: shot, left: PX, top: PY },
      { input: Buffer.from(bezel), left: PX - 20, top: PY - 20 },
    ])
    .png()
    .toBuffer();
  // 앱스토어 스크린샷은 투명도(알파 채널)가 없어야 한다.
  const flat = await sharp(composed).flatten({ background: '#ffffff' }).removeAlpha().png().toBuffer();
  for (const size of sizes) {
    const out = path.join(baseDir, size.name, `${String(i + 1).padStart(2, '0')}-${slide.raw}.png`);
    await sharp(flat).resize(size.width, size.height, { fit: 'fill' }).removeAlpha().png().toFile(out);
    console.log('wrote', path.relative(root, out), (fs.statSync(out).size / 1024 / 1024).toFixed(1) + 'MB');
  }
}

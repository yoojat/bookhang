// 엔딩 일러스트(SVG)를 만들고 PNG 로 변환한다. 실행: node scripts/endings/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import {
  W, H, OUT, svgDoc, vgrad, rgrad, shark, person, cloud, waveFill, waveLine, confetti, heartShape, stars, gull, firework, netBoat,
} from './lib.mjs';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/endings');
fs.mkdirSync(outDir, { recursive: true });

// 상어 몸 중심 y 에서 아래로 일정 거리에 수면을 두면 몸의 아래쪽이 물에 잠긴 모습이 된다.
const sub = (y, s, wl = 10) => y + wl * s;

// ---------------------------------------------------------------------------
// 1. 번개 탈출
// ---------------------------------------------------------------------------
function lightning() {
  const hy = 440;
  const defs =
    vgrad('sky', [[0, '#2fa8ee'], [0.6, '#86d8ff'], [1, '#d9f6ff']]) +
    vgrad('sea', [[0, '#2aa3da'], [1, '#0d5a98']]) +
    vgrad('seaFront', [[0, '#3bb4e8', 0.7], [1, '#0d5a98', 0.85]]) +
    vgrad('bolt', [[0, '#fff7b0'], [1, '#ffb800']]) +
    rgrad('burst', [[0, '#fff', 0.9], [1, '#fff', 0]]);
  const sx = 780, sy = 470, ss = 3.6;
  const wl = sub(sy, ss, 24);
  let rays = '';
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const w = 0.03 + (i % 3) * 0.015;
    rays += `<path d="M${sx} ${sy - 40} L${sx + Math.cos(a - w) * 1400} ${sy - 40 + Math.sin(a - w) * 1400} L${sx + Math.cos(a + w) * 1400} ${sy - 40 + Math.sin(a + w) * 1400} Z" fill="#fff" opacity="${i % 2 ? 0.1 : 0.18}"/>`;
  }
  const speedLines = [90, 150, 215, 300, 360, 410]
    .map((y, i) => `<line x1="${60 + (i % 3) * 90}" y1="${y}" x2="${400 + (i % 4) * 90}" y2="${y}" stroke="#fff" stroke-width="${6 - (i % 3)}" stroke-linecap="round" opacity="0.8"/>`)
    .join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${rays}
<circle cx="${sx}" cy="${sy - 40}" r="360" fill="url(#burst)" opacity="0.7"/>
${cloud(180, 120, 1.7, '#fff', 0.95)}${cloud(1010, 100, 1.3, '#fff', 0.9)}${cloud(520, 210, 1.1, '#fff', 0.8)}
<g filter="url(#blur6)" opacity="0.9"><path d="M300 30 L210 220 L275 220 L222 400 L395 170 L322 170 L372 30 Z" fill="#fff"/></g>
<path d="M300 30 L210 220 L275 220 L222 400 L395 170 L322 170 L372 30 Z" fill="url(#bolt)" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
${speedLines}
<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#sea)"/>
<!-- 멀리 수로 입구의 다리(제6보도교) -->
<g opacity="0.9">
<path d="M20 ${hy - 14} Q130 ${hy - 120} 250 ${hy - 14}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
<path d="M20 ${hy - 14} Q130 ${hy - 120} 250 ${hy - 14}" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 0"/>
${[50, 80, 110, 140, 170, 200, 228].map((x) => `<line x1="${x}" y1="${hy - 14}" x2="${x}" y2="${hy - 14 - Math.sin(((x - 20) / 230) * Math.PI) * 86}" stroke="#fff" stroke-width="2.4"/>`).join('')}
<rect x="0" y="${hy - 16}" width="290" height="14" fill="#dfe6eb" stroke="${OUT}" stroke-width="3"/></g>
${waveFill(hy + 20, 5, 220, 0.5, '#3bb4e8', 0.5)}
${waveLine(hy + 40, 5, 160, 1, '#fff', 3, 0.6, 0, 700)}
${waveLine(hy + 90, 6, 200, 2, '#fff', 4, 0.5, 100, 800)}
<!-- 항적: 상어가 지나온 하얀 물길과 물보라 -->
<path d="M${sx - 230} ${wl - 4} Q${sx - 520} ${wl - 30} ${sx - 700} ${wl - 6} Q${sx - 520} ${wl + 16} ${sx - 220} ${wl + 22} Z" fill="#fff" opacity="0.95"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<circle cx="${sx - 250 - i * 44}" cy="${wl - 14 - (i % 3) * 8 - i * 1.5}" r="${14 - i * 0.6}" fill="#fff" opacity="${0.95 - i * 0.04}"/>`).join('')}
<path d="M${sx - 200} ${wl - 10} Q${sx - 330} ${wl - 150} ${sx - 520} ${wl - 130} Q${sx - 380} ${wl - 90} ${sx - 250} ${wl + 10} Z" fill="#fff" opacity="0.8" filter="url(#blur3)"/>
<path d="M${sx - 300} ${wl + 38} Q${sx - 560} ${wl + 20} ${sx - 860} ${wl + 62} Q${sx - 560} ${wl + 70} ${sx - 280} ${wl + 56} Z" fill="#fff" opacity="0.5" filter="url(#blur3)"/>
${shark({ x: sx, y: sy, s: ss, tilt: -7, mood: 'open', wag: 14, pec: -30 })}
<path d="M0 ${wl} Q300 ${wl - 14} 600 ${wl + 4} T${W} ${wl - 4} L${W} ${H} L0 ${H} Z" fill="url(#seaFront)"/>
${waveLine(wl, 6, 120, 0, '#fff', 6, 0.95, 380, 1120)}
${waveLine(wl + 24, 7, 140, 2, '#fff', 4, 0.55, 300, 1100)}
<!-- 물보라 -->
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  .map((i) => `<circle cx="${sx + 220 + i * 26 - (i % 3) * 20}" cy="${wl - 40 - Math.sin(i * 1.3) * 34 - i * 6}" r="${6 + (i % 4) * 3}" fill="#fff" opacity="0.9"/>`)
  .join('')}
${confetti(11, 40, ['#fff', '#ffe066', '#9fe3ff'], [60, 60, 1100, 300])}
`;
  return svgDoc(defs, body);
}

// ---------------------------------------------------------------------------
// 2. 용기 낸 탈출 (해돋이를 향해)
// ---------------------------------------------------------------------------
function brave() {
  const hy = 430;
  const sx = 880;
  const defs =
    vgrad('sky', [[0, '#3b2f6b'], [0.35, '#a24d7a'], [0.62, '#ff8f6b'], [0.85, '#ffc77d'], [1, '#ffe9a8']]) +
    vgrad('sea', [[0, '#e8a06a'], [0.25, '#6a7fb0'], [1, '#1c3563']]) +
    vgrad('seaFront', [[0, '#7a8fc0', 0.55], [1, '#16305c', 0.9]]) +
    rgrad('sun', [[0, '#fffbe0'], [0.35, '#ffe08a'], [1, '#ff9f4a', 0]]) +
    vgrad('path', [[0, '#fff1b0', 0.9], [1, '#ffb347', 0.1]]);
  let rays = '';
  for (let i = 0; i < 22; i++) {
    const a = Math.PI + 0.1 + (i / 21) * (Math.PI - 0.2);
    rays += `<path d="M${sx} ${hy} L${sx + Math.cos(a - 0.025) * 1300} ${hy + Math.sin(a - 0.025) * 1300} L${sx + Math.cos(a + 0.025) * 1300} ${hy + Math.sin(a + 0.025) * 1300} Z" fill="#fff1b0" opacity="${i % 2 ? 0.1 : 0.17}"/>`;
  }
  // 북항의 컨테이너 크레인 실루엣
  const crane = (x, h, boom) =>
    `<g fill="#2a2450" opacity="0.85"><rect x="${x}" y="${hy - h}" width="9" height="${h}"/><rect x="${x + 44}" y="${hy - h}" width="9" height="${h}"/>
    <rect x="${x - 6}" y="${hy - h * 0.55}" width="64" height="7"/>
    <rect x="${x - 10}" y="${hy - h - 8}" width="${boom + 80}" height="9"/>
    <path d="M${x + 20} ${hy - h - 8} L${x + 20 + boom * 0.9} ${hy - h - 70} L${x + 22 + boom} ${hy - h - 8} Z" opacity="0.9"/>
    <rect x="${x + 50 + boom * 0.55}" y="${hy - h + 2}" width="22" height="16"/></g>
    <g stroke="#2a2450" stroke-width="2" opacity="0.7"><line x1="${x + 20}" y1="${hy - h - 8}" x2="${x + 4}" y2="${hy - 18}"/><line x1="${x + 40}" y1="${hy - h - 8}" x2="${x + 56}" y2="${hy - 18}"/></g>`;
  const boxes = (x, y) => [0, 1, 2].map((i) => `<rect x="${x + i * 30}" y="${y}" width="28" height="16" fill="${['#8a4a6a', '#4a5a8a', '#8a6a4a'][i]}" opacity="0.8"/>`).join('');
  const sy = 520, ss = 3.1;
  const wl = sub(sy, ss);
  let shimmer = '';
  for (let i = 0; i < 16; i++) {
    const y = hy + 10 + i * 20;
    const w = 40 + i * 24;
    shimmer += `<line x1="${sx - w / 2 + (i % 2) * 14}" y1="${y}" x2="${sx + w / 2 - (i % 3) * 10}" y2="${y}" stroke="#fff3b8" stroke-width="${3 + i * 0.35}" stroke-linecap="round" opacity="${0.85 - i * 0.03}"/>`;
  }
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(5, 28, [0, 0, W, 190])}
${rays}
<circle cx="${sx}" cy="${hy}" r="330" fill="url(#sun)" opacity="0.9"/>
<circle cx="${sx}" cy="${hy}" r="82" fill="#fffbe0"/>
${cloud(250, 190, 1.8, '#ffb48a', 0.85)}${cloud(620, 150, 1.2, '#ffd0a0', 0.8)}${cloud(1040, 230, 1.5, '#ff9f7a', 0.8)}
${gull(300, 120, 1.3, '#fff')}${gull(380, 160, 1)}${gull(240, 170, 0.9)}${gull(1000, 110, 1.1)}
<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#sea)"/>
${crane(30, 120, 150)}${crane(250, 92, 110)}
<rect x="0" y="${hy - 14}" width="520" height="14" fill="#2a2450" opacity="0.8"/>${boxes(60, hy - 30)}${boxes(330, hy - 30)}${boxes(364, hy - 46)}
<path d="M${sx - 70} ${hy} L${sx + 70} ${hy} L${sx + 330} ${H} L${sx - 330} ${H} Z" fill="url(#path)" opacity="0.7"/>
${shimmer}
${waveLine(hy + 30, 4, 140, 0.4, '#ffd9a0', 3, 0.55, 0, 700)}
${waveLine(hy + 70, 5, 160, 1.3, '#9fb2e0', 3, 0.5, 0, 800)}
${shark({ x: 470, y: sy, s: ss, tilt: -3, mood: 'determined', wag: 8, pec: -12, glow: 'rgba(255,170,80,0.55)' })}
<path d="M0 ${wl} Q300 ${wl - 10} 600 ${wl + 4} T${W} ${wl - 2} L${W} ${H} L0 ${H} Z" fill="url(#seaFront)"/>
${waveLine(wl, 5, 110, 0, '#ffe9c4', 5, 0.9, 200, 740)}
${waveLine(wl + 22, 6, 130, 2, '#ffd9a0', 3, 0.5, 160, 800)}
`;
  return svgDoc(defs, body);
}

// ---------------------------------------------------------------------------
// 3. 당당한 퇴장 (기슭의 배웅)
// ---------------------------------------------------------------------------
function proud() {
  const hy = 400;
  const defs =
    vgrad('sky', [[0, '#5dc2f4'], [0.6, '#a9e4ff'], [1, '#e4f8ff']]) +
    vgrad('sea', [[0, '#3cc4d8'], [1, '#1580b4']]) +
    vgrad('seaFront', [[0, '#49cfe0', 0.65], [1, '#1580b4', 0.85]]) +
    vgrad('ground', [[0, '#f6ead0'], [1, '#e2cfa3']]);
  const sx = 840, sy = 520, ss = 3;
  const wl = sub(sy, ss);
  const colors = ['#ff6b8b', '#ffd34a', '#5ac8ff', '#7be07b', '#c58bff', '#ff9a3c'];
  let bunting = '';
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const x = 20 + t * 520;
    const y = 90 + Math.sin(t * Math.PI) * 60;
    bunting += `<path d="M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 34} Z" fill="${colors[i % 6]}" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  const arc = (r, c, op) => `<path d="M${W - 120 - r} ${hy} A${r} ${r} 0 0 1 ${W - 120 + r} ${hy}" fill="none" stroke="${c}" stroke-width="16" opacity="${op}"/>`;
  const back = [
    { x: 70, y: 628, skin: 1, hair: 1, style: 1, shirt: '#8bd17c', arms: 'wave', dress: true },
    { x: 190, y: 640, skin: 0, hair: 3, style: 0, shirt: '#6ec6ff', arms: 'up', mouth: 'open', hat: 'cap' },
    { x: 305, y: 626, skin: 2, hair: 0, style: 2, shirt: '#ff8fc7', arms: 'wave', balloon: '#ff5a7a' },
    { x: 410, y: 642, skin: 1, hair: 4, style: 3, shirt: '#ffb347', arms: 'up', mouth: 'open' },
  ];
  const front = [
    { x: 40, y: 735, s: 1.15, skin: 0, hair: 2, style: 0, shirt: '#ff7a7a', arms: 'up', mouth: 'open', flag: '#ff5a7a' },
    { x: 170, y: 742, s: 1.2, skin: 2, hair: 5, style: 1, shirt: '#f2f2f2', arms: 'wave', dress: true, balloon: '#5ac8ff' },
    { x: 300, y: 738, s: 1.15, skin: 1, hair: 0, style: 0, shirt: '#c58bff', arms: 'up', mouth: 'open', hat: 'cap' },
    { x: 425, y: 744, s: 1.2, skin: 3, hair: 1, style: 2, shirt: '#4fb3a9', arms: 'hold', cup: true, dress: true },
  ];
  const hearts = [[560, 420, 1.3], [640, 360, 1.7], [700, 300, 1.2], [520, 330, 1], [610, 250, 1.4]]
    .map(([x, y, s], i) => heartShape(x, y, s * 1.2, ['#ff5a7a', '#ff8fb0', '#ff4f6d'][i % 3], 0.95))
    .join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="1000" cy="110" r="160" fill="url(#glowWhite)" opacity="0.9"/><circle cx="1000" cy="110" r="52" fill="#fff6c2"/>
${arc(330, '#ff6b6b', 0.55)}${arc(310, '#ffd34a', 0.55)}${arc(290, '#7be07b', 0.55)}${arc(270, '#5ac8ff', 0.55)}
${cloud(700, 130, 1.6, '#fff', 0.95)}${cloud(300, 260, 1.2, '#fff', 0.9)}${cloud(1090, 280, 1.1, '#fff', 0.85)}
${gull(620, 190, 1.1)}${gull(700, 230, 0.9)}
<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#sea)"/>
${waveLine(hy + 28, 4, 150, 0.2, '#fff', 3, 0.55, 480, 1200)}
${waveLine(hy + 70, 5, 180, 1.4, '#fff', 3, 0.5, 440, 1200)}
${waveLine(hy + 120, 6, 200, 2.2, '#fff', 4, 0.45, 400, 1200)}
<!-- 기슭의 산책로 -->
<path d="M0 ${hy + 54} L520 ${hy + 86} L440 ${H} L0 ${H} Z" fill="url(#ground)" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
<path d="M0 ${hy + 54} L520 ${hy + 86}" stroke="#b8bdc0" stroke-width="16"/>
<path d="M0 ${hy + 24} L520 ${hy + 56} M0 ${hy + 54} L520 ${hy + 86}" stroke="${OUT}" stroke-width="3"/>
${[40, 120, 200, 280, 360, 440].map((x) => `<line x1="${x}" y1="${hy + 24 + x * 0.0615}" x2="${x}" y2="${hy + 56 + x * 0.0615}" stroke="${OUT}" stroke-width="4"/>`).join('')}
${bunting}<path d="M20 90 Q280 190 540 90" fill="none" stroke="${OUT}" stroke-width="3"/>
${back.map((p) => person({ ...p, s: 1.0, look: 1 })).join('')}
${shark({ x: sx, y: sy, s: ss, flip: true, tilt: 2, mood: 'smile', wag: 8, pec: 6 })}
<path d="M520 ${wl} Q760 ${wl - 10} 960 ${wl + 4} T${W} ${wl - 2} L${W} ${H} L450 ${H} Z" fill="url(#seaFront)"/>
${waveLine(wl, 5, 110, 0, '#fff', 6, 0.95, 560, 1130)}
${waveLine(wl + 22, 6, 130, 2, '#fff', 4, 0.5, 520, 1160)}
${hearts}
${front.map((p) => person({ ...p, look: 1 })).join('')}
${confetti(21, 70, colors, [0, 0, W, 560])}
`;
  return svgDoc(defs, body);
}

// ---------------------------------------------------------------------------
// 4. 전설의 북항이 (불꽃놀이 밤하늘 점프)
// ---------------------------------------------------------------------------
function legend() {
  const hy = 470;
  const defs =
    vgrad('sky', [[0, '#12163f'], [0.5, '#3c2a7a'], [0.8, '#b8467a'], [1, '#ff8f6b']]) +
    vgrad('sea', [[0, '#2b4f9c'], [1, '#0a1c4a']]) +
    vgrad('seaFront', [[0, '#3a62b8', 0.65], [1, '#0a1c4a', 0.9]]) +
    rgrad('moon', [[0, '#fff8d6', 0.9], [1, '#fff8d6', 0]]) +
    rgrad('warm', [[0, '#ffd27a', 0.9], [1, '#ffd27a', 0]]) +
    '<filter id="dusk"><feColorMatrix type="matrix" values="0.5 0 0 0 0.02  0 0.5 0 0 0.02  0 0 0.7 0 0.1  0 0 0 1 0"/></filter>';
  const fw = [
    firework(230, 190, 120, '#ffd34a'),
    firework(940, 170, 130, '#ff6b8b'),
    firework(600, 120, 95, '#5ac8ff'),
    firework(1100, 330, 80, '#7be07b'),
    firework(110, 380, 70, '#c58bff'),
  ].join('');
  let sparkles = '';
  const sp = [[430, 250, 18], [820, 290, 22], [700, 190, 14], [360, 400, 12], [900, 410, 16], [520, 330, 10], [980, 260, 12]];
  for (const [x, y, r] of sp) {
    sparkles += `<path d="M${x} ${y - r} Q${x + 2} ${y - 2} ${x + r} ${y} Q${x + 2} ${y + 2} ${x} ${y + r} Q${x - 2} ${y + 2} ${x - r} ${y} Q${x - 2} ${y - 2} ${x} ${y - r} Z" fill="#fff6b0" stroke="#fff" stroke-width="1.5"/>`;
  }
  const sx = 610, sy = 330, ss = 3.3;
  const crowd = [
    { x: 60, y: 742, s: 1.15, arms: 'up', cup: false, mouth: 'open', shirt: '#ff7a7a' },
    { x: 190, y: 748, s: 1.2, arms: 'wave', mouth: 'open', shirt: '#6ec6ff', dress: true },
    { x: 320, y: 744, s: 1.15, arms: 'up', mouth: 'open', shirt: '#ffb347', hat: 'cap' },
    { x: 880, y: 746, s: 1.2, arms: 'up', mouth: 'open', shirt: '#c58bff' },
    { x: 1010, y: 742, s: 1.15, arms: 'wave', mouth: 'open', shirt: '#8bd17c', dress: true },
    { x: 1140, y: 748, s: 1.2, arms: 'up', mouth: 'open', shirt: '#ff8fc7', balloon: '#ffd34a' },
  ].map((p, i) => person({ ...p, skin: i % 3, hair: i, style: i % 4, look: p.x < 600 ? 1 : -1 }))
    .join('');
  const wl = hy + 40;
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(9, 80, [0, 0, W, 330])}
<circle cx="170" cy="110" r="190" fill="url(#moon)"/><circle cx="170" cy="110" r="58" fill="#fff8d6"/><circle cx="150" cy="96" r="10" fill="#eadfae"/><circle cx="188" cy="128" r="14" fill="#eadfae"/>
${fw}${sparkles}
<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#sea)"/>
<rect y="${hy - 16}" width="${W}" height="22" fill="#ffb27a" opacity="0.55" filter="url(#blur6)"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  .map((i) => `<line x1="${180 + (i % 5) * 190}" y1="${hy + 20 + i * 22}" x2="${230 + (i % 5) * 190 + (i % 3) * 40}" y2="${hy + 20 + i * 22}" stroke="#ffd34a" stroke-width="4" stroke-linecap="round" opacity="0.5"/>`)
  .join('')}
${waveLine(hy + 40, 5, 160, 0.4, '#8fb2ff', 3, 0.5)}
${waveLine(hy + 100, 6, 190, 1.4, '#8fb2ff', 3, 0.4)}
<!-- 점프한 자리의 물보라 -->
<g fill="#fff" opacity="0.92">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<ellipse cx="${250 + i * 22}" cy="${hy + 14 - Math.sin((i / 6) * Math.PI) * 46}" rx="${11 - Math.abs(i - 3) * 1.4}" ry="${18 + Math.sin((i / 6) * Math.PI) * 30}"/>`).join('')}</g>
${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${210 + i * 34}" cy="${hy - 70 - Math.sin((i / 7) * Math.PI) * 80 - (i % 3) * 14}" r="${5 + (i % 3) * 2}" fill="#fff" opacity="0.9"/>`).join('')}
${shark({ x: sx, y: sy, s: ss, tilt: -22, mood: 'open', wag: 16, pec: -35, crown: true, glow: 'rgba(255,214,120,0.28)' })}
<path d="M0 ${wl} Q300 ${wl - 10} 600 ${wl + 4} T${W} ${wl - 2} L${W} ${H} L0 ${H} Z" fill="url(#seaFront)"/>
${waveLine(wl, 5, 120, 0, '#d9e6ff', 5, 0.85, 240, 520)}
<g filter="url(#dusk)">${crowd}</g>
${[[120, 650], [250, 610], [960, 630], [1090, 600], [400, 670]].map(([x, y], i) => heartShape(x, y, 1.3, ['#ff5a7a', '#ff8fb0', '#ffd34a'][i % 3], 0.95)).join('')}
${confetti(31, 80, ['#ffd34a', '#ff5a7a', '#5ac8ff', '#7be07b', '#fff'], [0, 0, W, 520])}
`;
  return svgDoc(defs, body);
}

// ---------------------------------------------------------------------------
// 5. 그물에 몰려 바다로… (아쉬운 작별)
// ---------------------------------------------------------------------------
function netted() {
  const hy = 430;
  const defs =
    vgrad('sky', [[0, '#474568'], [0.4, '#a2607a'], [0.7, '#e98e72'], [1, '#f6c68a']]) +
    vgrad('sea', [[0, '#d9916e'], [0.2, '#5a739e'], [1, '#1b3358']]) +
    vgrad('seaFront', [[0, '#6a82ae', 0.55], [1, '#18305a', 0.9]]) +
    rgrad('sun', [[0, '#fff1c0'], [0.4, '#ffc27a', 0.9], [1, '#ff9a5a', 0]]) +
    vgrad('path', [[0, '#ffe0a0', 0.8], [1, '#ff9a5a', 0.05]]);
  const sx = 1010;
  const sharkX = 880, sharkY = 540, ss = 2.9;
  const wl = sub(sharkY, ss);
  let shimmer = '';
  for (let i = 0; i < 12; i++) {
    const y = hy + 12 + i * 22;
    const w = 40 + i * 20;
    shimmer += `<line x1="${sx - w / 2}" y1="${y}" x2="${sx + w / 2 - (i % 3) * 12}" y2="${y}" stroke="#ffe3a8" stroke-width="${3 + i * 0.3}" stroke-linecap="round" opacity="${0.8 - i * 0.04}"/>`;
  }
  const shore = [
    { x: 40, y: 470, s: 0.42, shirt: '#2a2a44', arms: 'wave' },
    { x: 84, y: 474, s: 0.4, shirt: '#3a2a44', arms: 'up' },
    { x: 128, y: 470, s: 0.38, shirt: '#2a3a44', arms: 'wave', dress: true },
    { x: 170, y: 476, s: 0.36, shirt: '#44302a', arms: 'wave' },
  ]
    .map((p, i) => person({ ...p, skin: i % 3, hair: i, style: i % 4, look: 1, silhouette: '#2d2748' }))
    .join('');
  // 그물: 두 척의 배 사이에 늘어진 그물
  const netPath = 'M260 478 Q400 566 540 484';
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(4, 22, [0, 0, W, 150])}
<circle cx="${sx}" cy="${hy}" r="300" fill="url(#sun)" opacity="0.9"/><circle cx="${sx}" cy="${hy}" r="70" fill="#fff1c0"/>
${cloud(200, 180, 1.8, '#f0a68c', 0.7)}${cloud(620, 130, 1.3, '#ffb89a', 0.7)}${cloud(1000, 240, 1.4, '#e9937c', 0.7)}
${gull(520, 170, 1)}${gull(580, 210, 0.8)}
<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#sea)"/>
<path d="M0 ${hy} L0 ${hy - 20} L240 ${hy - 20} L240 ${hy} Z" fill="#2d2748" opacity="0.85"/>
<path d="M${sx - 60} ${hy} L${sx + 60} ${hy} L${sx + 300} ${H} L${sx - 300} ${H} Z" fill="url(#path)" opacity="0.6"/>
${shimmer}
${waveLine(hy + 40, 4, 150, 0.4, '#e8b090', 3, 0.5, 0, 800)}
${waveLine(hy + 90, 5, 170, 1.3, '#8aa2d0', 3, 0.5, 0, 900)}
${shore}
<!-- 작업선과 그물 -->
${netBoat({ x: 220, y: 524, s: 0.78 })}
${person({ x: 190, y: 504, s: 0.5, shirt: '#2a2a44', hat: 'helmet', arms: 'hold', silhouette: '#2d2748' })}
${netBoat({ x: 580, y: 530, s: 0.78, flip: true })}
${person({ x: 610, y: 510, s: 0.5, shirt: '#2a2a44', hat: 'helmet', arms: 'hold', flip: true, silhouette: '#2d2748' })}
<path d="${netPath} L540 612 Q400 652 260 614 Z" fill="#fff" opacity="0.22"/>
${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${280 + i * 34}" y1="${492 + Math.sin((i / 7) * Math.PI) * 48}" x2="${272 + i * 34}" y2="${616 + Math.sin((i / 7) * Math.PI) * 18}" stroke="#fff" stroke-width="2.4" opacity="0.6"/>`).join('')}
<path d="${netPath}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${290 + i * 40}" cy="${484 + Math.sin(((i + 0.5) / 7) * Math.PI) * 48}" r="8" fill="#ff8a3d" stroke="${OUT}" stroke-width="2.4"/>`).join('')}
${shark({ x: sharkX, y: sharkY, s: ss, flip: true, tilt: 3, mood: 'sad', tears: true, wag: 6, pec: 14, glow: 'rgba(255,160,90,0.35)' })}
<path d="M0 ${wl} Q300 ${wl - 10} 600 ${wl + 4} T${W} ${wl - 2} L${W} ${H} L0 ${H} Z" fill="url(#seaFront)"/>
${waveLine(wl, 5, 110, 0, '#ffe9c4', 5, 0.85, 640, 1120)}
${waveLine(wl + 22, 6, 130, 2, '#ffd9a0', 3, 0.5, 600, 1140)}
`;
  return svgDoc(defs, body);
}

const scenes = { lightning, brave, proud, legend, netted };
const only = process.argv[2];
for (const [name, fn] of Object.entries(scenes)) {
  if (only && only !== name) continue;
  const svg = fn();
  const png = path.join(outDir, `${name}.png`);
  await sharp(Buffer.from(svg)).resize(1200, 750).png({ compressionLevel: 9 }).toFile(png);
  console.log('wrote', name, (fs.statSync(png).size / 1024).toFixed(0) + 'KB');
}

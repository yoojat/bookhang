// 엔딩 일러스트용 SVG 부품들. 상어(북항이)와 구경꾼을 같은 스타일로 그려서 장면에 배치한다.
export const W = 1200;
export const H = 750;
export const OUT = '#2a3342';

// 같은 그림이 항상 똑같이 나오도록 시드가 있는 난수를 쓴다.
export function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const svgDoc = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${SHARED_DEFS}${defs}</defs>
${body}
</svg>`;

export const SHARED_DEFS = `
<linearGradient id="skBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93bfe6"/><stop offset="1" stop-color="#6d9cc8"/></linearGradient>
<linearGradient id="skFin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9ac4"/><stop offset="1" stop-color="#52809f"/></linearGradient>
<linearGradient id="skBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3eef6"/></linearGradient>
<radialGradient id="glowWhite"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
`;

const ln = (w = 3.2) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// ---------------------------------------------------------------------------
// 상어 북항이 (오른쪽을 보는 도안, 길이 약 150). s: 크기, flip: 좌우 반전
// mood: smile | open | determined | sad
// ---------------------------------------------------------------------------
export function shark({ x, y, s = 3, flip = false, tilt = 0, mood = 'smile', crown = false, tears = false, wag = 0, pec = 0, glow = null }) {
  const eyeBig = mood === 'sad' || mood === 'open';
  const brow =
    mood === 'sad'
      ? `<path d="M31 -21 Q41 -19 50 -13" fill="none" ${ln(2.8)}/>`
      : mood === 'determined'
        ? `<path d="M32 -16 Q43 -20 52 -14" fill="none" ${ln(3)}/>`
        : '';
  const mouth =
    mood === 'open'
      ? `<path d="M64 4 L26 12 L34 36 Q50 40 60 28 Z" fill="#7a1f2b" ${ln(3)}/>
         <ellipse cx="46" cy="30" rx="9" ry="5" fill="#ff8a9a"/>
         <path d="M56 7 l-4 8 l-4 -7 M46 9 l-4 8 l-4 -6 M36 10 l-3 7" fill="#fff" stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"/>`
      : mood === 'sad'
        ? `<path d="M30 20 Q46 8 63 14" fill="none" ${ln(3.4)}/>`
        : mood === 'determined'
          ? `<path d="M64 6 Q50 20 28 14" fill="none" ${ln(3.4)}/>
             <path d="M52 11.5 l-4 7 l-4 -7 M42 13 l-4 6.5 l-3.4 -6" fill="#fff" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`
          : `<path d="M64 5 Q48 22 26 14" fill="none" ${ln(3.2)}/>
             <path d="M56 8 l-5 8 l-3.5 -7.5 M45 12 l-4.5 8 l-3.5 -7 M35 13.5 l-4 7 l-3 -6" fill="#fff" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const iris = eyeBig ? 7 : 6;
  const cheerTear = tears
    ? `<path d="M44 4 Q40 14 44 18 Q48 14 44 4 Z" fill="#a8e6ff" ${ln(1.8)}/>
       <path d="M36 9 Q32 18 36 22 Q40 18 36 9 Z" fill="#a8e6ff" ${ln(1.6)}/>`
    : '';
  const crownSvg = crown
    ? `<g transform="translate(26 -32) rotate(-8)">
        <path d="M-15 0 L-15 -16 L-7 -8 L0 -20 L7 -8 L15 -16 L15 0 Z" fill="#ffd34a" ${ln(2.6)}/>
        <rect x="-15" y="-3" width="30" height="5" fill="#f2b52e" ${ln(2)}/>
        <circle cx="0" cy="-20" r="3" fill="#ff5a7a" ${ln(1.6)}/>
        <circle cx="-15" cy="-16" r="2.3" fill="#5ac8ff"/><circle cx="15" cy="-16" r="2.3" fill="#7be07b"/>
      </g>`
    : '';
  const glowSvg = glow ? `<ellipse cx="0" cy="0" rx="150" ry="90" fill="${glow}" filter="url(#blur14)"/>` : '';
  return `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${flip ? -s : s} ${s})">
  ${glowSvg}
  <g transform="translate(-54 0) rotate(${wag})"><path d="M2 0 Q-14 -10 -32 -36 Q-26 -14 -20 -2 Q-26 8 -30 26 Q-14 8 2 3 Z" fill="url(#skFin)" ${ln()}/></g>
  <g transform="translate(0 -25)"><path d="M14 2 Q4 -22 -12 -36 Q-12 -16 -28 2 Z" fill="url(#skFin)" ${ln()}/></g>
  <path d="M-34 -14 Q-40 -24 -48 -22 Q-46 -15 -50 -9 Z" fill="url(#skFin)" ${ln(2.6)}/>
  <path d="M66 2 C54 -16 26 -28 -8 -26 C-30 -24 -46 -12 -58 -4 L-58 5 C-46 12 -28 24 -4 26 C24 28 54 18 66 2 Z" fill="url(#skBack)"/>
  <path d="M64 5 C52 20 26 25 -4 24 C-28 22 -44 12 -55 5 C-38 9 -8 9 20 9 C42 9 56 7 64 5 Z" fill="url(#skBelly)"/>
  <path d="M46 -14 C34 -22 14 -25 -4 -23" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M66 2 C54 -16 26 -28 -8 -26 C-30 -24 -46 -12 -58 -4 L-58 5 C-46 12 -28 24 -4 26 C24 28 54 18 66 2 Z" fill="none" ${ln(3.4)}/>
  <g transform="translate(18 18) rotate(${pec})"><path d="M0 -2 Q-10 16 -32 20 Q-16 8 -16 -4 Z" fill="url(#skFin)" ${ln(3)}/></g>
  <path d="M-26 21 Q-34 30 -44 31 Q-36 24 -36 16 Z" fill="url(#skFin)" ${ln(2.4)}/>
  <path d="M20 -7 l-3 13 M13.5 -7 l-3 13 M7 -7 l-3 13" fill="none" ${ln(2.2)}/>
  <ellipse cx="37" cy="7" rx="8" ry="5" fill="#ff7a95" fill-opacity="0.62"/>
  <circle cx="41" cy="-7" r="${eyeBig ? 10.5 : 9.5}" fill="#fff" ${ln(2.8)}/>
  <circle cx="43" cy="-6.5" r="${iris}" fill="#1b2a3a"/>
  <circle cx="40.2" cy="-9.8" r="2.8" fill="#fff"/><circle cx="45.4" cy="-3.6" r="1.4" fill="#fff"/>
  ${eyeBig ? '<circle cx="41" cy="-2" r="1.2" fill="#9fe3ff"/>' : ''}
  <circle cx="59" cy="-4" r="1.3" fill="${OUT}"/>
  ${brow}
  ${mouth}
  ${cheerTear}
  ${crownSvg}
</g>`;
}

// ---------------------------------------------------------------------------
// 구경꾼 (발 위치 x,y 기준 키 약 135). arms: down | up | wave | hold
// ---------------------------------------------------------------------------
const SKINS = ['#ffe0c4', '#f7cba5', '#e8b58d', '#d9a07a'];
const HAIRS = ['#2b2118', '#5a3a22', '#8a5a2b', '#d8b45a', '#3a3a4a', '#a8442a'];

export function person({
  x, y, s = 1, skin = 0, hair = 0, style = 0, shirt = '#ff7a7a', pants = '#4a5a7a', arms = 'down', look = 1,
  hat = null, balloon = null, flag = null, cup = false, mouth = 'smile', dress = false, flip = false, tear = false, silhouette = null, phone = false,
}) {
  const sk = SKINS[skin % SKINS.length];
  const hr = HAIRS[hair % HAIRS.length];
  const sil = silhouette;
  const fillC = (c) => (sil ? sil : c);
  const body = dress
    ? `<path d="M-18 -66 L18 -66 L30 -22 L-30 -22 Z" fill="${fillC(shirt)}" ${ln(3)}/>`
    : `<ellipse cx="0" cy="-48" rx="24" ry="26" fill="${fillC(shirt)}" ${ln(3)}/>
       <ellipse cx="-11" cy="-16" rx="9" ry="14" fill="${fillC(pants)}" ${ln(2.6)}/><ellipse cx="11" cy="-16" rx="9" ry="14" fill="${fillC(pants)}" ${ln(2.6)}/>`;
  const feet = `<ellipse cx="-12" cy="-2" rx="11" ry="6" fill="${sil || '#3a3a46'}" ${ln(2.4)}/><ellipse cx="12" cy="-2" rx="11" ry="6" fill="${sil || '#3a3a46'}" ${ln(2.4)}/>`;
  const handC = fillC(sk);
  const armsSvg =
    arms === 'up'
      ? `<ellipse cx="-34" cy="-80" rx="8" ry="20" transform="rotate(-24 -34 -80)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="-43" cy="-102" r="8" fill="${handC}" ${ln(2.4)}/>
         <ellipse cx="34" cy="-80" rx="8" ry="20" transform="rotate(24 34 -80)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="43" cy="-102" r="8" fill="${handC}" ${ln(2.4)}/>`
      : arms === 'wave'
        ? `<ellipse cx="-30" cy="-44" rx="8" ry="18" transform="rotate(8 -30 -44)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="-33" cy="-27" r="8" fill="${handC}" ${ln(2.4)}/>
           <ellipse cx="38" cy="-78" rx="8" ry="20" transform="rotate(34 38 -78)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="50" cy="-100" r="8.5" fill="${handC}" ${ln(2.4)}/>`
        : arms === 'hold'
          ? `<ellipse cx="-30" cy="-46" rx="8" ry="17" transform="rotate(10 -30 -46)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="-33" cy="-30" r="8" fill="${handC}" ${ln(2.4)}/>
             <ellipse cx="28" cy="-52" rx="8" ry="16" transform="rotate(-30 28 -52)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="38" cy="-64" r="8" fill="${handC}" ${ln(2.4)}/>`
          : `<ellipse cx="-30" cy="-46" rx="8" ry="18" transform="rotate(8 -30 -46)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="-33" cy="-29" r="8" fill="${handC}" ${ln(2.4)}/>
             <ellipse cx="30" cy="-46" rx="8" ry="18" transform="rotate(-8 30 -46)" fill="${fillC(shirt)}" ${ln(2.6)}/><circle cx="33" cy="-29" r="8" fill="${handC}" ${ln(2.4)}/>`;
  const handX = arms === 'wave' ? 50 : arms === 'up' ? 43 : 38;
  const handY = arms === 'wave' ? -100 : arms === 'up' ? -102 : -64;
  const prop = balloon
    ? `<path d="M${handX} ${handY - 6} Q${handX + 8} ${handY - 60} ${handX + 4} ${handY - 120}" fill="none" ${ln(1.6)}/>
       <ellipse cx="${handX + 4}" cy="${handY - 150}" rx="26" ry="32" fill="${balloon}" ${ln(3)}/><ellipse cx="${handX - 4}" cy="${handY - 160}" rx="7" ry="10" fill="#fff" fill-opacity="0.55"/>`
    : flag
      ? `<path d="M${handX} ${handY + 6} L${handX} ${handY - 70}" ${ln(3.2)}/><path d="M${handX} ${handY - 70} L${handX + 40} ${handY - 56} L${handX} ${handY - 42} Z" fill="${flag}" ${ln(2.4)}/>`
      : cup
        ? `<path d="M${handX - 9} ${handY - 4} L${handX + 9} ${handY - 4} L${handX + 6} ${handY - 28} L${handX - 6} ${handY - 28} Z" fill="#fff" ${ln(2.2)}/><rect x="${handX - 8}" y="${handY - 20}" width="16" height="7" fill="#2a4f8f"/>`
        : phone
          ? `<rect x="${handX - 8}" y="${handY - 26}" width="16" height="26" rx="3" fill="#3a4658" ${ln(2)}/><rect x="${handX - 5}" y="${handY - 22}" width="10" height="16" fill="#9fe3ff"/>`
          : '';
  const hairBack =
    style === 1
      ? `<ellipse cx="0" cy="-102" rx="36" ry="40" fill="${fillC(hr)}" ${ln(3)}/>`
      : style === 2
        ? `<ellipse cx="${-look * 36}" cy="-92" rx="12" ry="24" fill="${fillC(hr)}" ${ln(3)}/>`
        : style === 3
          ? `<circle cx="0" cy="-142" r="13" fill="${fillC(hr)}" ${ln(3)}/>`
          : '';
  const ex = look * 3;
  const mouthSvg =
    mouth === 'open'
      ? `<ellipse cx="${ex}" cy="-82" rx="7" ry="8" fill="#7a1f2b" ${ln(2)}/><ellipse cx="${ex}" cy="-79" rx="4" ry="3" fill="#ff8a9a"/>`
      : mouth === 'sad'
        ? `<path d="M${ex - 6} -80 Q${ex} -86 ${ex + 6} -80" fill="none" ${ln(2.4)}/>`
        : `<path d="M${ex - 7} -84 Q${ex} -77 ${ex + 7} -84" fill="none" ${ln(2.6)}/>`;
  const eyes =
    mouth === 'open'
      ? `<path d="M${ex - 19} -97 Q${ex - 12} -108 ${ex - 5} -97" fill="none" ${ln(3)}/><path d="M${ex + 5} -97 Q${ex + 12} -108 ${ex + 19} -97" fill="none" ${ln(3)}/>`
      : `<ellipse cx="${ex - 12}" cy="-96" rx="5.6" ry="8" fill="#222a38"/><ellipse cx="${ex + 12}" cy="-96" rx="5.6" ry="8" fill="#222a38"/>
         <circle cx="${ex - 10.5}" cy="-99" r="2.4" fill="#fff"/><circle cx="${ex + 13.5}" cy="-99" r="2.4" fill="#fff"/>`;
  const tearSvg = tear ? `<path d="M${ex - 14} -86 Q${ex - 18} -78 ${ex - 14} -73 Q${ex - 10} -78 ${ex - 14} -86 Z" fill="#a8e6ff" ${ln(1.4)}/>` : '';
  const fringe = `<path d="M-27 -122 L27 -122 Q36 -106 28 -98 Q20 -112 12 -110 Q6 -100 -2 -108 Q-10 -98 -16 -108 Q-30 -100 -32 -108 Z" fill="${fillC(hr)}"/>`;
  const hatSvg =
    hat === 'cap'
      ? `<path d="M-32 -118 Q0 -148 32 -118 Z" fill="#ff5a5a" ${ln(3)}/><path d="M${look > 0 ? 10 : -50} -118 h40 q0 10 -10 10 h-30 Z" fill="#e24b4b" ${ln(2.6)}/>`
      : hat === 'helmet'
        ? `<path d="M-34 -116 Q0 -158 34 -116 Z" fill="#ffd34a" ${ln(3)}/><rect x="-38" y="-118" width="76" height="9" rx="4" fill="#f2b52e" ${ln(2.6)}/>`
        : hat === 'sailor'
          ? `<path d="M-32 -118 Q0 -146 32 -118 Z" fill="#fff" ${ln(3)}/><rect x="-34" y="-120" width="68" height="9" rx="4" fill="#2a4f8f" ${ln(2.6)}/>`
          : '';
  const g = `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
  <ellipse cx="0" cy="2" rx="34" ry="8" fill="#000" fill-opacity="0.16"/>
  ${prop && (balloon || flag) ? prop : ''}
  ${hairBack}${feet}${body}${armsSvg}
  ${cup || phone ? prop : ''}
  <circle cx="0" cy="-102" r="35" fill="${fillC(hr)}" ${ln(3)}/>
  <circle cx="0" cy="-97" r="30" fill="${fillC(sk)}" ${ln(3)}/>
  ${sil ? '' : `${fringe}${eyes}${mouthSvg}${tearSvg}<ellipse cx="${ex - 20}" cy="-84" rx="7" ry="4.6" fill="#ff6e8c" fill-opacity="0.55"/><ellipse cx="${ex + 20}" cy="-84" rx="7" ry="4.6" fill="#ff6e8c" fill-opacity="0.55"/>`}
  ${hatSvg}
</g>`;
  return g;
}

// ---------------------------------------------------------------------------
// 배경 부품
// ---------------------------------------------------------------------------
export const vgrad = (id, stops) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</linearGradient>`;

export const rgrad = (id, stops) =>
  `<radialGradient id="${id}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;

export function cloud(x, y, s, color = '#fff', op = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}" fill="${color}">
  <ellipse cx="0" cy="0" rx="60" ry="26"/><ellipse cx="-34" cy="8" rx="40" ry="20"/><ellipse cx="38" cy="6" rx="46" ry="22"/><ellipse cx="6" cy="-18" rx="34" ry="24"/></g>`;
}

// 물결선: y 높이를 따라 사인 곡선으로 흐르는 면을 그린다. (아래쪽을 채운다)
export function waveFill(y, amp, len, phase, fill, opacity = 1) {
  let d = `M0 ${H} L0 ${y}`;
  for (let x = 0; x <= W + len; x += 20) d += ` L${x} ${(y + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1)}`;
  d += ` L${W} ${H} Z`;
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

export function waveLine(y, amp, len, phase, stroke, width = 3, opacity = 1, x0 = 0, x1 = W) {
  let d = '';
  for (let x = x0; x <= x1; x += 12) {
    const yy = (y + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1);
    d += `${d ? ' L' : 'M'}${x} ${yy}`;
  }
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
}

export function confetti(seed, n, colors, area = [0, 0, W, H]) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2];
    const y = area[1] + r() * area[3];
    const rot = r() * 360;
    out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(8 + r() * 8).toFixed(0)}" height="${(5 + r() * 5).toFixed(0)}" rx="1.5" fill="${colors[i % colors.length]}" transform="rotate(${rot.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }
  return out;
}

export function heartShape(x, y, s, color, op = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="M0 8 C-20 -6 -12 -22 0 -12 C12 -22 20 -6 0 8 Z" fill="${color}" ${ln(2.4)}/></g>`;
}

export function stars(seed, n, area = [0, 0, W, 360]) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2];
    const y = area[1] + r() * area[3];
    const rad = 1.2 + r() * 2.2;
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  }
  return out;
}

export function gull(x, y, s = 1, color = '#fff') {
  return `<path d="M${x - 22 * s} ${y + 4 * s} Q${x - 10 * s} ${y - 14 * s} ${x} ${y} Q${x + 10 * s} ${y - 14 * s} ${x + 22 * s} ${y + 4 * s}" fill="none" stroke="${color}" stroke-width="${3.4 * s}" stroke-linecap="round"/>`;
}

export function firework(x, y, r, color, n = 16) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x1 = x + Math.cos(a) * r * 0.45;
    const y1 = y + Math.sin(a) * r * 0.45;
    const x2 = x + Math.cos(a) * r;
    const y2 = y + Math.sin(a) * r;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    out += `<circle cx="${(x + Math.cos(a) * r * 1.12).toFixed(1)}" cy="${(y + Math.sin(a) * r * 1.12).toFixed(1)}" r="4" fill="${color}"/>`;
  }
  return `<g>${out}<circle cx="${x}" cy="${y}" r="${r * 0.9}" fill="${color}" opacity="0.16" filter="url(#blur14)"/></g>`;
}

// 작업선(그물을 끄는 주황색 배)
export function netBoat({ x, y, s = 1, flip = false }) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
  <ellipse cx="0" cy="22" rx="130" ry="14" fill="#000" fill-opacity="0.18"/>
  <path d="M-110 -12 L108 -12 L140 -28 L96 24 L-92 24 Z" fill="#ff9a3c" ${ln(4)}/>
  <path d="M-110 -12 L108 -12 L130 -22 L-108 -2 Z" fill="#fff"/>
  <path d="M-90 -76 L-24 -76 L-24 -12 L-90 -12 Z" fill="#fff" ${ln(4)}/>
  <circle cx="-57" cy="-46" r="12" fill="#bfe6f5" ${ln(3)}/>
  <circle cx="64" cy="-28" r="16" fill="#6c7480" ${ln(3.4)}/>
</g>`;
}

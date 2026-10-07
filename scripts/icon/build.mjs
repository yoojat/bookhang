// 앱 아이콘과 스플래시 이미지를 만든다. 실행: node scripts/icon/build.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { shark, svgDoc, vgrad, rgrad, waveFill, waveLine, cloud } from '../endings/lib.mjs';

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets');
const S = 1024;

// endings/lib.mjs 의 도안은 1200x750 기준이므로 1024 정사각형으로 감싸 쓴다.
const wrap = (defs, body) => svgDoc(defs, body).replace('width="1200" height="750" viewBox="0 0 1200 750"', `width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"`);

const sea = vgrad('iconSky', [[0, '#3db5f0'], [0.62, '#9fe0ff'], [1, '#e2f7ff']]) + vgrad('iconSea', [[0, '#3bb4e8'], [1, '#0d5a98']]);

// 정사각형 전체를 채우는 아이콘 (iOS 는 둥근 모서리를 직접 입힌다)
function iconSvg(withBg = true, scale = 6.6) {
  const wl = 770;
  const body = `
${withBg ? `<rect width="${S}" height="${S}" fill="url(#iconSky)"/>
<circle cx="800" cy="220" r="260" fill="url(#glowWhite)" opacity="0.8"/>
${cloud(220, 210, 1.5, '#fff', 0.95)}${cloud(820, 150, 1.1, '#fff', 0.9)}
<rect y="${wl - 24}" width="${S}" height="${S - wl + 24}" fill="url(#iconSea)"/>` : ''}
${shark({ x: 512 - 28 * scale, y: wl - 22 * scale, s: scale, mood: 'smile' })}
${withBg ? `<path d="M0 ${wl} Q256 ${wl - 18} 512 ${wl + 4} T${S} ${wl - 4} L${S} ${S} L0 ${S} Z" fill="#3bb4e8" opacity="0.72"/>
${waveLine(wl, 8, 150, 0, '#fff', 10, 0.95, 0, S)}` : ''}
`;
  return wrap(sea, body);
}

async function png(svg, file, size = S) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(assets, file));
  console.log('wrote', file);
}

// iOS 앱 아이콘: 투명 영역이 없어야 하므로 흰 바탕으로 합쳐서 알파를 없앤다.
await sharp(Buffer.from(iconSvg(true))).flatten({ background: '#9fe0ff' }).resize(S, S).png().toFile(path.join(assets, 'icon.png'));
console.log('wrote icon.png');

// 스플래시: 투명 배경의 상어 머리
await png(iconSvg(false, 6.2), 'splash-icon.png');
// 안드로이드 적응형 아이콘: 가운데 안전 영역에 맞춰 작게
await png(iconSvg(false, 4.6), 'android-icon-foreground.png');
await png(wrap(sea, `<rect width="${S}" height="${S}" fill="url(#iconSky)"/><rect y="640" width="${S}" height="${S - 640}" fill="url(#iconSea)"/>`), 'android-icon-background.png');
// 단색 아이콘: 전경의 모양만 하얗게
const fg = await sharp(path.join(assets, 'android-icon-foreground.png')).png().toBuffer();
await sharp({ create: { width: S, height: S, channels: 4, background: '#ffffff' } })
  .composite([{ input: fg, blend: 'dest-in' }])
  .png()
  .toFile(path.join(assets, 'android-icon-monochrome.png'));
console.log('wrote android-icon-monochrome.png');
await sharp(path.join(assets, 'icon.png')).resize(48, 48).png().toFile(path.join(assets, 'favicon.png'));
console.log('wrote favicon.png');

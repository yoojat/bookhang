import { PaintStyle, Skia, SkPaint, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';

const paintCache = new Map<string, SkPaint>();

export function fill(color: string): SkPaint {
  let p = paintCache.get(color);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    paintCache.set(color, p);
  }
  return p;
}

export function stroke(color: string, width: number, round = false): SkPaint {
  const key = `s:${color}:${width}:${round}`;
  let p = paintCache.get(key);
  if (!p) {
    p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    if (round) {
      p.setStrokeCap(StrokeCap.Round);
      p.setStrokeJoin(StrokeJoin.Round);
    }
    paintCache.set(key, p);
  }
  return p;
}

export function triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const path = Skia.Path.Make();
  path.moveTo(x1, y1);
  path.lineTo(x2, y2);
  path.lineTo(x3, y3);
  path.close();
  return path;
}

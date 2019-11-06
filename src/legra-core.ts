export type Point = [number, number];

export interface BrickStyle {
  brickSize?: number;
  color?: string;
  elevation?: number;
}

export interface BrickStyleResolved extends BrickStyle {
  brickSize: number;
  color: string;
  elevation: number;
}

const radiusCache = new Map<number, number>();
function calculateRadius(size: number): number {
  if (radiusCache.has(size)) {
    return radiusCache.get(size)!;
  }
  const r = Math.min(24, (size * 0.5) / 2);
  radiusCache.set(size, r);
  return r;
}

function _drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, style: BrickStyleResolved) {
  const { brickSize, color } = style;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.rect(x, y, brickSize, brickSize);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + brickSize / 2, y + brickSize / 2, calculateRadius(brickSize), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBrick(i: number, j: number, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  const size = style.brickSize;
  _drawBrick(ctx, i * size, j * size, style);
}

function drawBrickList(points: Point[], ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  const size = style.brickSize;
  points.forEach((p) => {
    _drawBrick(ctx, p[0] * size, p[1] * size, style);
  });
}

function _line(x1: number, y1: number, x2: number, y2: number, used = new Set<string>()): Point[] {
  const points: Point[] = [];

  const pushToPoints = (p: Point) => {
    const key = p.join(',');
    if (!used.has(key)) {
      used.add(key);
      points.push(p);
    }
  };

  if (x1 === x2) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    for (let j = min; j <= max; j++) {
      pushToPoints([x1, j]);
    }
  } else {
    const dy = y2 - y1;
    const dx = x2 - x1;
    const m = dy / dx;
    const c = y1 - (m * x1);
    if (Math.abs(dx) >= Math.abs(dy)) {
      const min = Math.min(x1, x2);
      const max = Math.max(x1, x2);
      for (let i = min; i <= max; i++) {
        const j = Math.round((m * i) + c);
        pushToPoints([i, j]);
      }
    } else {
      const min = Math.min(y1, y2);
      const max = Math.max(y1, y2);
      for (let j = min; j <= max; j++) {
        const i = Math.round((j - c) / m);
        pushToPoints([i, j]);
      }
    }
  }
  return points;
}

export function rectangle(x: number, y: number, width: number, height: number, filled: boolean, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  if (filled) {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        drawBrick(x + i, y + j, ctx, style);
      }
    }
  } else {
    const used = new Set<string>();
    if (width > 0 && height > 0) {
      let bricks = _line(x, y, x + width - 1, y, used);
      if (height > 2) {
        bricks = [
          ...bricks,
          ..._line(x, y + 1, x, y + height - 2, used),
          ..._line(x + width - 1, y + 1, x + width - 1, y + height - 2, used)
        ];
      }
      if (height > 1) {
        bricks = [...bricks, ..._line(x, y + height - 1, x + width - 1, y + height - 1, used)];
      }
      drawBrickList(bricks, ctx, style);
    }
  }
}

export function line(x1: number, y1: number, x2: number, y2: number, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  drawBrickList(_line(x1, y1, x2, y2), ctx, style);
}

export function linearPath(points: Point[], ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  const used = new Set<string>();
  let bricks: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const bp = _line(x1, y1, x2, y2, used);
    bricks = [...bricks, ...bp];
  }
  drawBrickList(bricks, ctx, style);
}
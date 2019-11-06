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

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, style: BrickStyleResolved) {
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

const radiusCache = new Map<number, number>();
function calculateRadius(size: number): number {
  if (radiusCache.has(size)) {
    return radiusCache.get(size)!;
  }
  const r = Math.min(24, (size * 0.5) / 2);
  radiusCache.set(size, r);
  return r;
}

export function rectangle(x: number, y: number, width: number, height: number, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  const size = style.brickSize;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      drawBrick(ctx, (x + i) * size, (y + j) * size, style);
    }
  }
}

export function line(x1: number, y1: number, x2: number, y2: number, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  const size = style.brickSize;
  if (x1 === x2) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    for (let j = min; j <= max; j++) {
      drawBrick(ctx, x1 * size, j * size, style);
    }
  } else {
    const dy = y2 - y1;
    const dx = x2 - x1;
    const m = dy / dx;
    const c = y1 - (m * x1);
    const used = new Set<string>();
    if (Math.abs(dx) >= Math.abs(dy)) {
      const min = Math.min(x1, x2);
      const max = Math.max(x1, x2);
      for (let i = min; i <= max; i++) {
        const j = Math.round((m * i) + c);
        const key = `${i},${j}`;
        if (!used.has(key)) {
          used.add(key);
          drawBrick(ctx, i * size, j * size, style);
        }
      }
    } else {
      const min = Math.min(y1, y2);
      const max = Math.max(y1, y2);
      for (let j = min; j <= max; j++) {
        const i = Math.round((j - c) / m);
        const key = `${i},${j}`;
        if (!used.has(key)) {
          used.add(key);
          drawBrick(ctx, i * size, j * size, style);
        }
      }
    }
  }
}
export type Point = [number, number];

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

function drawBrickList(points: Point[], ctx: CanvasRenderingContext2D, style: BrickStyleResolved, sort = false) {
  if (sort) {
    points.sort((a, b) => {
      if (a[0] === b[0]) {
        if (a[1] < b[1]) {
          return -1;
        } else if (a[1] > b[1]) {
          return 1;
        }
        return 0;
      }
      if (a[0] < b[0]) {
        return -1;
      } else if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    });
  }
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
    if (width > 0 && height > 0) {
      linearPath([
        [x, y],
        [x + width - 1, y],
        [x + width - 1, y + height - 1],
        [x, y + height - 1],
        [x, y]
      ], ctx, style);
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
  drawBrickList(bricks, ctx, style, true);
}

export function circle(xc: number, yc: number, radius: number, filled: boolean, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  ellipse(xc, yc, radius, radius, filled, ctx, style);
}

export function ellipse(xc: number, yc: number, a: number, b: number, filled: boolean, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {
  let x = 0;
  let y = b;

  const a2 = a * a;
  const b2 = b * b;
  const crit1 = -(a2 / 4 + a % 2 + b2);
  const crit2 = -(b2 / 4 + b % 2 + a2);
  const crit3 = -(b2 / 4 + b % 2);
  let t = -a2 * y;
  let dxt = 2 * b2 * x;
  let dyt = -2 * a2 * y;
  const d2xt = 2 * b2;
  const d2yt = 2 * a2;

  const incx = () => {
    x++;
    dxt += d2xt;
    t += dxt;
  };
  const incy = () => {
    y--;
    dyt += d2yt;
    t += dyt;
  };

  if (filled) {
    const rects: Rectangle[] = [];
    let rx = x;
    let ry = y;
    let width = 1;
    let height = 1;

    const rectPush = (x: number, y: number, width: number, height: number) => {
      if (height < 0) {
        y += height + 1;
        height = Math.abs(height);
      }
      rects.push({ x, y, width, height });
    };

    if (b === 0) {
      rectPush(xc - 1, yc, 2 * a + 1, 1);
    } else {
      while (y >= 0 && x <= a) {
        if ((t + b2 * x <= crit1) || (t + a2 * y <= crit3)) {
          if (height === 1) {
            // do nothing;
          } else if ((ry * 2 + 1) > ((height - 1) * 2)) {
            rectPush(xc - rx, yc - ry, width, height - 1);
            rectPush(xc - rx, yc + ry, width, 1 - height);
            ry -= height - 1;
            height = 1;
          } else {
            rectPush(xc - rx, yc - ry, width, ry * 2 + 1);
            ry -= ry;
            height = 1;
          }
          incx();
          rx++;
          width += 2;
        } else if ((t - a2 * y) > crit2) {
          incy();
          height++;
        } else {
          if ((ry * 2 + 1) > (height * 2)) {
            rectPush(xc - rx, yc - ry, width, height);
            rectPush(xc - rx, yc + ry, width, -height);
          } else {
            rectPush(xc - rx, yc - ry, width, ry * 2 + 1);
          }
          incx();
          incy();
          rx++;
          width += 2;
          ry -= height;
          height = 1;
        }
      }
      if (ry > height) {
        rectPush(xc - rx, yc - ry, width, height);
        rectPush(xc - rx, yc + ry + 1, width, -height);
      } else {
        rectPush(xc - rx, yc - ry, width, ry * 2 + 1);
      }
    }
    rects.forEach((rect) => {
      if (rect.height < 0) {
        rect.y += rect.height + 1;
        rect.height = Math.abs(rect.height);
      }
    });
    rects.sort((a, b) => {
      return a.y - b.y;
    });
    rects.forEach((rect) => rectangle(rect.x, rect.y, rect.width, rect.height, true, ctx, style));
  } else {
    const bricks: Point[] = [];
    while (y >= 0 && x <= a) {
      bricks.push([xc + x, yc + y]);
      if (x !== 0 || y !== 0) {
        bricks.push([xc - x, yc - y]);
      }
      if (x !== 0 && y !== 0) {
        bricks.push([xc + x, yc - y]);
        bricks.push([xc - x, yc + y]);
      }
      if ((t + b2 * x <= crit1) || (t + a2 * y <= crit3)) {
        incx();
      } else if (t - a2 * y > crit2) {
        incy();
      } else {
        incx();
        incy();
      }
    }
    drawBrickList(bricks, ctx, style, true);
  }
}
import { Point, Rectangle, EdgeEntry, ActiveEdgeEntry } from './geometry.js';
import { Bezier } from './bezier.js';

export interface ImageOrImageBitmap {
  width: number;
  height: number;
}

export interface BrickRenderOptions {
  color?: string;
  filled?: boolean;
}

export interface BrickRenderOptionsResolved extends BrickRenderOptions {
  brickSize: number;
  color: string;
  filled: boolean;
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

function _drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, style: BrickRenderOptionsResolved) {
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

function drawBrick(i: number, j: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  const size = style.brickSize;
  _drawBrick(ctx, i * size, j * size, style);
}

function drawBrickList(points: Point[], ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved, sort = false) {
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

function _linearPath(points: Point[], used = new Set<string>()): Point[] {
  let bricks: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const bp = _line(x1, y1, x2, y2, used);
    bricks = [...bricks, ...bp];
  }
  return bricks;
}

/**********************
 * EXPORTED FUNCTIONS
 **********************/

export function rectangle(x: number, y: number, width: number, height: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved, fill = false) {
  if (style.filled || fill) {
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

export function line(x1: number, y1: number, x2: number, y2: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  drawBrickList(_line(x1, y1, x2, y2), ctx, style);
}

export function linearPath(points: Point[], ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  drawBrickList(_linearPath(points), ctx, style, true);
}

export function circle(xc: number, yc: number, radius: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  ellipse(xc, yc, radius, radius, ctx, style);
}

export function ellipse(xc: number, yc: number, a: number, b: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
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

  if (style.filled) {
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
    rects.forEach((rect) => rectangle(rect.x, rect.y, rect.width, rect.height, ctx, style, true));
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

export function polygon(points: Point[], ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  if (points.length === 0) {
    return;
  }
  if (points.length === 1) {
    drawBrick(points[0][0], points[0][1], ctx, style);
    return;
  }
  if (points.length === 2) {
    const [[x1, y1], [x2, y2]] = points;
    line(x1, y1, x2, y2, ctx, style);
    return;
  }
  const vertices = [...points];
  if (vertices[0].join(',') !== vertices[vertices.length - 1].join(',')) {
    vertices.push([vertices[0][0], vertices[0][1]]);
  }

  if (!style.filled) {
    linearPath(vertices, ctx, style);
  } else {
    const used = new Set<string>();
    let bricks = _linearPath(vertices, used);

    // Create sorted edges table
    const edges: EdgeEntry[] = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      const p1 = vertices[i];
      const p2 = vertices[i + 1];
      if (p1[1] !== p2[1]) {
        const ymin = Math.min(p1[1], p2[1]);
        edges.push({
          ymin,
          ymax: Math.max(p1[1], p2[1]),
          x: ymin === p1[1] ? p1[0] : p2[0],
          islope: (p2[0] - p1[0]) / (p2[1] - p1[1])
        });
      }
    }
    edges.sort((e1, e2) => {
      if (e1.ymin < e2.ymin) {
        return -1;
      }
      if (e1.ymin > e2.ymin) {
        return 1;
      }
      if (e1.x < e2.x) {
        return -1;
      }
      if (e1.x > e2.x) {
        return 1;
      }
      if (e1.ymax === e2.ymax) {
        return 0;
      }
      return (e1.ymax - e2.ymax) / Math.abs((e1.ymax - e2.ymax));
    });

    let activeEdges: ActiveEdgeEntry[] = [];
    let y = edges[0].ymin;
    while (activeEdges.length || edges.length) {
      if (edges.length) {
        let ix = -1;
        for (let i = 0; i < edges.length; i++) {
          if (edges[i].ymin > y) {
            break;
          }
          ix = i;
        }
        const removed = edges.splice(0, ix + 1);
        removed.forEach((edge) => {
          activeEdges.push({ s: y, edge });
        });
      }
      activeEdges = activeEdges.filter((ae) => {
        if (ae.edge.ymax === y) {
          return false;
        }
        return true;
      });
      activeEdges.sort((ae1, ae2) => {
        if (ae1.edge.x === ae2.edge.x) {
          return 0;
        }
        return (ae1.edge.x - ae2.edge.x) / Math.abs((ae1.edge.x - ae2.edge.x));
      });

      // fill between the edges
      if (activeEdges.length > 1) {
        for (let i = 0; i < activeEdges.length; i = i + 2) {
          const nexti = i + 1;
          if (nexti >= activeEdges.length) {
            break;
          }
          const ce = activeEdges[i].edge;
          const ne = activeEdges[nexti].edge;
          bricks = bricks.concat(_line(Math.round(ce.x), y, Math.round(ne.x), y, used));
        }
      }

      y++;
      activeEdges.forEach((ae) => {
        ae.edge.x = ae.edge.x + ae.edge.islope;
      });
    }
    drawBrickList(bricks, ctx, style, true);
  }
}

export function arc(xc: number, yc: number, a: number, b: number, start: number, stop: number, closed: boolean, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  let angle1 = Math.min(start, stop);
  let angle2 = Math.max(start, stop);
  if (angle1 === angle2) {
    return;
  }
  if (a <= 0 || b <= 0) {
    return;
  }
  if (angle2 - angle1 > Math.PI * 2) {
    angle1 = 0;
    angle2 = Math.PI * 2;
  }
  const p = Math.round(2 * Math.sqrt((a * a + b * b) / 2) * (angle2 - angle1));
  const da = (angle2 - angle1) / p;
  const used = new Set<string>();
  const points: Point[] = [];
  for (let i = 0; i <= p; i++) {
    const theta = angle1 + (i * da);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const r = (a * b) / Math.sqrt(b * b * cos * cos + a * a * sin * sin);
    const point: Point = [xc + Math.round(r * cos), yc + Math.round(r * sin)];
    const key = point.join(',');
    if (!used.has(key)) {
      used.add(key);
      points.push(point);
    }
  }
  if (closed) {
    const point: Point = [xc, yc];
    const key = point.join(',');
    if (!used.has(key)) {
      used.add(key);
      points.push(point);
    }
    polygon(points, ctx, style);
  } else {
    linearPath(points, ctx, style);
  }
}

export function bezierCurve(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  const bezier = new Bezier([x1, y1], [cp1x, cp1y], [cp2x, cp2y], [x2, y2]);
  const luts = bezier.getLUT(bezier.length()).map<Point>((p) => [Math.round(p[0]), Math.round(p[1])]);
  if (style.filled) {
    polygon(luts, ctx, style);
  } else {
    linearPath(luts, ctx, style);
  }
}

export function quadraticCurve(x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number, ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved) {
  const bezier = new Bezier([x1, y1], [cpx, cpy], [x2, y2]);
  const luts = bezier.getLUT(bezier.length()).map<Point>((p) => [Math.round(p[0]), Math.round(p[1])]);
  if (style.filled) {
    polygon(luts, ctx, style);
  } else {
    linearPath(luts, ctx, style);
  }
}

export function drawImage(ctx: CanvasRenderingContext2D, style: BrickRenderOptionsResolved, image: ImageOrImageBitmap, dst: Point, dstSize?: Point, src?: Point, srcSize?: Point) {
  const brickSize = style.brickSize;
  if (!src) {
    src = [0, 0];
  }
  if (!srcSize) {
    srcSize = [image.width, image.height];
  }
  if (!dstSize) {
    dstSize = [Math.round(srcSize[0] / brickSize), Math.round(srcSize[1] / brickSize)];
  }
  const [refW, refH] = dstSize;
  const refCanvas = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(refW, refH) : new HTMLCanvasElement();
  refCanvas.width = refW;
  refCanvas.height = refH;
  const refCtx = refCanvas.getContext('2d')!;
  refCtx.drawImage(image as any, src[0], src[1], srcSize[0], srcSize[1], 0, 0, dstSize[0], dstSize[1]);
  const imageData = refCtx.getImageData(0, 0, refW, refH);
  for (let j = 0; j < refH; j++) {
    for (let i = 0; i < refW; i++) {
      const r = imageData.data[(j * refW * 4) + (i * 4)];
      const g = imageData.data[(j * refW * 4) + (i * 4) + 1];
      const b = imageData.data[(j * refW * 4) + (i * 4) + 2];
      const pixelStyle: BrickRenderOptionsResolved = {
        brickSize,
        color: `rgb(${r}, ${g}, ${b})`,
        filled: false
      };
      drawBrick(dst[0] + i, dst[1] + j, ctx, pixelStyle);
    }
  }
}
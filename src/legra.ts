import { BrickRenderOptions, BrickRenderOptionsResolved, line, linearPath, rectangle, circle, ellipse, polygon, arc, bezierCurve, quadraticCurve } from './legra-core.js';
import { Point } from './geometry.js';

export class Legra {
  private ctx: CanvasRenderingContext2D;
  private defaultOptions: BrickRenderOptionsResolved = {
    brickSize: 24,
    color: '#2196F3',
    filled: false
  };

  constructor(ctx: CanvasRenderingContext2D, brickSize = 24, options?: BrickRenderOptions) {
    this.ctx = ctx;
    this.defaultOptions.brickSize = brickSize;
    if (options) {
      if (options.color) {
        this.defaultOptions.color = options.color;
      }
      if (typeof options.filled === 'boolean') {
        this.defaultOptions.filled = options.filled;
      }
    }
  }

  private opt(options?: BrickRenderOptions): BrickRenderOptionsResolved {
    if (options) {
      return Object.assign({}, this.defaultOptions, options);
    }
    return this.defaultOptions;
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: BrickRenderOptions) {
    line(x1, y1, x2, y2, this.ctx, this.opt(options));
  }

  linearPath(points: Point[], options?: BrickRenderOptions) {
    linearPath(points, this.ctx, this.opt(options));
  }

  rectangle(x: number, y: number, width: number, height: number, options?: BrickRenderOptions) {
    rectangle(x, y, width, height, this.ctx, this.opt(options));
  }

  circle(xc: number, yc: number, radius: number, options?: BrickRenderOptions) {
    circle(xc, yc, radius, this.ctx, this.opt(options));
  }

  ellipse(xc: number, yc: number, a: number, b: number, options?: BrickRenderOptions) {
    ellipse(xc, yc, a, b, this.ctx, this.opt(options));
  }

  polygon(points: Point[], options?: BrickRenderOptions) {
    polygon(points, this.ctx, this.opt(options));
  }

  arc(xc: number, yc: number, a: number, b: number, start: number, stop: number, closed: boolean, options?: BrickRenderOptions) {
    arc(xc, yc, a, b, start, stop, closed, this.ctx, this.opt(options));
  }

  bezierCurve(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number, options?: BrickRenderOptions) {
    bezierCurve(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, this.ctx, this.opt(options));
  }

  quadraticCurve(x1: number, y1: number, cpx: number, cpy: number, x2: number, y2: number, options?: BrickRenderOptions) {
    quadraticCurve(x1, y1, cpx, cpy, x2, y2, this.ctx, this.opt(options));
  }
}
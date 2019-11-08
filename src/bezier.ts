/**
 * This is based on https://github.com/Pomax/bezierjs
 * under MIT Licensse
 **/

import { Point, derive, length, computeBezierPoint } from './geometry.js';

export class Bezier {
  private points: Point[] = [];
  private dpoints: Point[][] = [];
  private _lut: Point[] = [];

  constructor(p1: Point, p2: Point, p3: Point, p4: Point) {
    this.points.push(p1, p2, p3, p4);
    this.update();
  }

  private update() {
    this._lut = [];
    this.dpoints = derive(this.points);
  }

  length(): number {
    return length(this.derivative.bind(this));
  }

  private derivative(t: number): Point {
    const mt = 1 - t;
    const p = this.dpoints[0];
    const a = mt * mt;
    const b = mt * t * 2;
    const c = t * t;
    const ret: Point = [
      a * p[0][0] + b * p[1][0] + c * p[2][0],
      a * p[0][1] + b * p[1][1] + c * p[2][1]
    ];
    return ret;
  }

  getLUT(steps = 100): Point[] {
    if (!steps) return [];
    if (this._lut.length === steps) {
      return this._lut;
    }
    this._lut = [];
    steps--;
    for (let t = 0; t <= steps; t++) {
      this._lut.push(this.compute(t / steps));
    }
    return this._lut;
  }

  private compute(t: number): Point {
    return computeBezierPoint(t, this.points);
  }
}
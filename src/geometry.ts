const TVALUES = [
  -0.0640568928626056260850430826247450385909,
  0.0640568928626056260850430826247450385909,
  -0.1911188674736163091586398207570696318404,
  0.1911188674736163091586398207570696318404,
  -0.3150426796961633743867932913198102407864,
  0.3150426796961633743867932913198102407864,
  -0.4337935076260451384870842319133497124524,
  0.4337935076260451384870842319133497124524,
  -0.5454214713888395356583756172183723700107,
  0.5454214713888395356583756172183723700107,
  -0.6480936519369755692524957869107476266696,
  0.6480936519369755692524957869107476266696,
  -0.7401241915785543642438281030999784255232,
  0.7401241915785543642438281030999784255232,
  -0.8200019859739029219539498726697452080761,
  0.8200019859739029219539498726697452080761,
  -0.8864155270044010342131543419821967550873,
  0.8864155270044010342131543419821967550873,
  -0.9382745520027327585236490017087214496548,
  0.9382745520027327585236490017087214496548,
  -0.9747285559713094981983919930081690617411,
  0.9747285559713094981983919930081690617411,
  -0.9951872199970213601799974097007368118745,
  0.9951872199970213601799974097007368118745
];

const CVALUES = [
  0.1279381953467521569740561652246953718517,
  0.1279381953467521569740561652246953718517,
  0.1258374563468282961213753825111836887264,
  0.1258374563468282961213753825111836887264,
  0.121670472927803391204463153476262425607,
  0.121670472927803391204463153476262425607,
  0.1155056680537256013533444839067835598622,
  0.1155056680537256013533444839067835598622,
  0.1074442701159656347825773424466062227946,
  0.1074442701159656347825773424466062227946,
  0.0976186521041138882698806644642471544279,
  0.0976186521041138882698806644642471544279,
  0.086190161531953275917185202983742667185,
  0.086190161531953275917185202983742667185,
  0.0733464814110803057340336152531165181193,
  0.0733464814110803057340336152531165181193,
  0.0592985849154367807463677585001085845412,
  0.0592985849154367807463677585001085845412,
  0.0442774388174198061686027482113382288593,
  0.0442774388174198061686027482113382288593,
  0.0285313886289336631813078159518782864491,
  0.0285313886289336631813078159518782864491,
  0.0123412297999871995468056670700372915759,
  0.0123412297999871995468056670700372915759
];

export type Point = [number, number];

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeEntry {
  ymin: number;
  ymax: number;
  x: number;
  islope: number;
}

export interface ActiveEdgeEntry {
  s: number;
  edge: EdgeEntry;
}

export function angle(o: Point, v1: Point, v2: Point): number {
  const dx1 = v1[0] - o[0];
  const dy1 = v1[1] - o[1];
  const dx2 = v2[0] - o[0];
  const dy2 = v2[1] - o[1];
  const cross = dx1 * dy2 - dy1 * dx2;
  const dot = dx1 * dx2 + dy1 * dy2;
  return Math.atan2(cross, dot);
}

export function derive(points: Point[]): Point[][] {
  const dpoints: Point[][] = [];
  for (let p = points, d = p.length, c = d - 1; d > 1; d-- , c--) {
    const list: Point[] = [];
    let dpt: Point = [0, 0];
    for (let j = 0; j < c; j++) {
      dpt = [
        c * (p[j + 1][0] - p[j][0]),
        c * (p[j + 1][1] - p[j][1])
      ];
      list.push(dpt);
    }
    dpoints.push(list);
    p = list;
  }
  return dpoints;
}

export type DerivativeFn = (t: number) => Point;

function arcfn(t: number, derivativeFn: DerivativeFn): number {
  const d = derivativeFn(t);
  const l = d[0] * d[0] + d[1] * d[1];
  return Math.sqrt(l);
}

export function length(derivativeFn: DerivativeFn): number {
  const z = 0.5;
  let sum = 0;
  const len = TVALUES.length;
  for (let i = 0; i < len; i++) {
    const t = z * TVALUES[i] + z;
    sum += CVALUES[i] * arcfn(t, derivativeFn);
  }
  return z * sum;
}

export function computeBezierPoint(t: number, points: Point[]) {
  if (t === 0) {
    return points[0];
  }
  const order = points.length - 1;
  if (t === 1) {
    return points[order];
  }
  let p = points;
  const mt = 1 - t;

  // constant?
  if (order === 0) {
    return points[0];
  }

  // linear?
  if (order === 1) {
    const ret: Point = [
      mt * p[0][0] + t * p[1][0],
      mt * p[0][1] + t * p[1][1]
    ];
    return ret;
  }

  // quadratic/cubic curve?
  if (order < 4) {
    const mt2 = mt * mt;
    const t2 = t * t;
    let d = 0;
    let a = 0;
    let b = 0;
    let c = 0;
    if (order === 2) {
      p = [p[0], p[1], p[2], [0, 0]];
      a = mt2;
      b = mt * t * 2;
      c = t2;
    } else if (order === 3) {
      a = mt2 * mt;
      b = mt2 * t * 3;
      c = mt * t2 * 3;
      d = t * t2;
    }
    const ret: Point = [
      a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
      a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]
    ];
    return ret;
  }

  // higher order curves: use de Casteljau's computation
  const dCpts: Point[] = JSON.parse(JSON.stringify(points));
  while (dCpts.length > 1) {
    for (let i = 0; i < dCpts.length - 1; i++) {
      dCpts[i] = [
        dCpts[i][0] + (dCpts[i + 1][0] - dCpts[i][0]) * t,
        dCpts[i][1] + (dCpts[i + 1][1] - dCpts[i][1]) * t
      ];
    }
    dCpts.splice(dCpts.length - 1, 1);
  }
  return dCpts[0];
}
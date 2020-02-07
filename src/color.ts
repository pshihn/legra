export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

const labMap = new Map<string, LabColor>();

function toLab(c: Color): LabColor {
  const rgb = `${c.r}, ${c.g}, ${c.b}`;
  if (labMap.has(rgb)) {
    return labMap.get(rgb)!;
  }
  let [r, g, b] = [c.r / 255, c.g / 255, c.b / 255];
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;
  const lab: LabColor = {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
  labMap.set(rgb, lab);
  return lab;
}

function colorDifference(a: Color, b: Color) {
  const labA = toLab(a);
  const labB = toLab(b);
  return Math.sqrt(
    Math.pow(labB.l - labA.l, 2) +
    Math.pow(labB.a - labA.a, 2) +
    Math.pow(labB.b - labA.b, 2)
  );
}

// function colorDifference2(a: Color, b: Color) {
//   const rbar = (a.r + b.r) / 2;
//   return Math.sqrt(
//     ((2 + (rbar / 256)) * Math.pow(b.r - a.r, 2)) +
//     (4 * Math.pow(b.g - a.g, 2)) +
//     ((2 + ((255 - rbar) / 256)) * Math.pow(b.b - a.b, 2))
//   );
// }

interface ColorDiffItem {
  diff: number;
  color: Color;
}

export function closestColor(color: Color, palette: Color[]): Color {
  if (palette.length) {
    const diffItems = palette.map<ColorDiffItem>((p) => {
      const diff = colorDifference(color, p);
      return {
        diff,
        color: p
      };
    });
    diffItems.sort((a, b) => {
      return a.diff - b.diff;
    });
    console.log(color, diffItems[0]);
    return diffItems[0].color;
  } else {
    return color;
  }
}
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

export function rectangle(x: number, y: number, width: number, height: number, ctx: CanvasRenderingContext2D, style: BrickStyleResolved) {

  const size = style.brickSize;
  const dotRadius = Math.min(24, (size * 0.5) / 2);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      ctx.save();
      ctx.fillStyle = style.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.1;
      ctx.rect((x + i) * size, (y + j) * size, size, size);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = style.color;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.arc((x + i + 0.5) * size, (y + j + 0.5) * size, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }


}
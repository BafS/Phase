/**
 * Plotter.
 * @param {Float32Array} points
 * @param {HTMLCanvasElement} canvas
 */
function plot(points: Float32Array, canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#5a83b2';
  ctx.fillStyle = 'rgba(0, 0, 0, .1)';
  ctx.fillRect(0, canvas.height / 2, canvas.width, 1); // x line
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  const ratioX = (canvas.width + 1) / points.length;
  const ratioY = -canvas.height / 2;
  let previous = null;
  const extrema = [Infinity, -Infinity];
  points.forEach((y: number, x: number): void => {
    y -= 1;

    // Get extrema
    if (y > extrema[1]) {
      extrema[1] = y;
    } else if (y < extrema[0]) {
      extrema[0] = y;
    }

    x *= ratioX;

    // Draw potential overflows
    if (previous && y > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, .8)';
      ctx.fillRect(x - 1, 0, 1, 3);
    } else if (previous && y < -2) {
      ctx.fillStyle = 'rgba(255, 0, 0, .8)';
      ctx.fillRect(x - 1, canvas.height, 1, -3);
    }

    y *= ratioY;

    // Interpolate each point
    if (previous) {
      ctx.moveTo(previous[0], previous[1]);
      ctx.lineTo(x, y);
    }
    previous = [x, y];
  });
  ctx.stroke();

  // Extrema
  ctx.fillStyle = 'rgba(100, 0, 0, .2)';
  ctx.fillRect(0, extrema[0] * ratioY, canvas.width, 1); // max
  ctx.fillStyle = 'rgba(0, 100, 0, .2)';
  ctx.fillRect(0, extrema[1] * ratioY, canvas.width, 1); // min

  return canvas;
}

export {
  plot,
};

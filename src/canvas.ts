const colors = {
  background: '#000',
  function: 'rgba(60, 169, 248, .8)',
  overflow: 'rgba(255, 0, 0, .75)',
  strokeStyle: 'rgba(200, 200, 200, .25)',
  text: 'rgba(200, 200, 200, .9)',
  peaks: {
    top: 'rgba(255, 50, 50, .2)',
    bottom: 'rgba(50, 255, 50, .2)',
  },
};

const options = {
  lineDash: [3, 6],
  lineWidth: 1,
  font: '12px monospace',
};

/**
 * Plotter.
 */
function plot(points: Float32Array, canvas: HTMLCanvasElement, clear: boolean = false): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is not available');
  }

  if (clear) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const canvasWidth = canvas.width - 1;
  const canvasHeight = canvas.height - 1;

  ctx.lineWidth = options.lineWidth;
  ctx.strokeStyle = colors.strokeStyle;
  // x axis
  const halfHeight = canvasHeight / 2;
  const xAxisNum = 10;
  ctx.setLineDash(options.lineDash);
  for (let i = 1; i < xAxisNum; ++i) {
    ctx.beginPath();
    const y = Math.round(i * (halfHeight / xAxisNum * 2));
    ctx.moveTo(0, 0.5 + y);
    ctx.lineTo(canvasWidth, 0.5 + y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(50, 50, 50, .9)';
  ctx.fillRect(0, halfHeight + 0.5, canvasWidth, 1); // 0 x axis

  ctx.strokeStyle = colors.function;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.lineWidth = options.lineWidth * 1.5;
  const ratioX = (canvasWidth + 1) / points.length;
  const ratioY = -canvasHeight / 2;

  let previous: number[]|null = null;
  const peaks = [Infinity, -Infinity];
  points.forEach((y: number, x: number): void => {
    y -= 1;

    // Get amplitude peaks
    if (y > peaks[1]) {
      peaks[1] = y;
    } else if (y < peaks[0]) {
      peaks[0] = y;
    }

    x *= ratioX;

    // Draw potential overflows
    if (previous && y > 0) {
      ctx.fillStyle = colors.overflow;
      ctx.fillRect(x - 1, 0, 1, 3);
    } else if (previous && y < -2) {
      ctx.fillStyle = colors.overflow;
      ctx.fillRect(x - 1, canvasHeight, 1, -3);
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

  // Amplitude peaks
  ctx.fillStyle = colors.text;
  const peakAmpTop = Math.floor(peaks[1] * ratioY);
  const peakAmpBottom = Math.ceil(peaks[0] * ratioY);
  ctx.fillText(' Û', canvasWidth - 20, Math.max(15, peakAmpTop - 6));
  ctx.fillText('-Û', canvasWidth - 20, Math.min(canvasHeight - 8, peakAmpBottom + 15));
  ctx.fillStyle = colors.peaks.bottom;
  ctx.fillRect(0, peakAmpTop, canvasWidth, 1); // max
  ctx.fillStyle = colors.peaks.top;
  ctx.fillRect(0, peakAmpBottom, canvasWidth, 1); // min

  return canvas;
}

function plotAudioBuffer(buffer: AudioBuffer, canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is not available');
  }

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const duration = buffer.duration * 1000; // ms
  const ratio = canvas.width / duration;

  ctx.font = options.font;

  // Increment in function of the duration (Math.log(ratio) * Math.LOG10E + 1 gives the "length" of a number)
  const inc = 1000 / (10 ** Math.floor(Math.log(ratio * 2) * Math.LOG10E + 1));
  const markerSize = 25;

  ctx.strokeStyle = colors.strokeStyle;
  ctx.lineWidth = options.lineWidth;
  ctx.setLineDash(options.lineDash);

  for (let i = 0; i < duration; i += inc) {
    const x = Math.round(i * ratio);
    // console.log(buffer.duration, i, ratio);
    ctx.fillStyle = colors.text;
    ctx.fillText(`${i}ms`, (i * ratio) + 4, canvas.height - 5);
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();

      ctx.fillStyle = 'rgba(100, 100, 100)';
      ctx.fillRect(x, 0, 1, markerSize);
      ctx.fillRect(x, canvas.height - markerSize, 1, markerSize);
    }
  }

  return plot(buffer.getChannelData(0), canvas);
}

export {
  plotAudioBuffer,
  plot,
};

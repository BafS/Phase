const colors = {
  function: 'rgba(96, 148, 188, .9)',
  // function: '#5a83b2',
  overflow: 'rgba(255, 0, 0, .8)',
  strokeStyle: 'rgba(200, 200, 200, .2)',
  extrema: {
    top: 'rgba(255, 0, 0, .15)',
    bottom: 'rgba(0, 255, 0, .15)',
  },
};

const options = {
  lineDash: [5, 3],
  font: '11px monospace',
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

  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.strokeStyle;
  // x axis
  const halfHeight = canvas.height / 2;
  // TODO: Stroke width ?
  const xAxisNum = 10;
  ctx.setLineDash(options.lineDash);
  ctx.lineWidth = 0.5;
  for (let i = 1; i < xAxisNum; ++i) {
    ctx.beginPath();
    ctx.moveTo(0, Math.round(i * (halfHeight / xAxisNum * 2)));
    ctx.lineTo(canvas.width, 0.5 + Math.round(i * (halfHeight / xAxisNum * 2)));
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(200, 200, 200, .1)';
  ctx.fillRect(0, halfHeight, canvas.width, 1); // 0 x axis

  ctx.strokeStyle = colors.function;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  const ratioX = (canvas.width + 1) / points.length;
  const ratioY = -canvas.height / 2;

  let previous: number[]|null = null;
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
      ctx.fillStyle = colors.overflow;
      ctx.fillRect(x - 1, 0, 1, 3);
    } else if (previous && y < -2) {
      ctx.fillStyle = colors.overflow;
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
  ctx.fillStyle = colors.extrema.bottom;
  ctx.fillRect(0, Math.round(extrema[0] * ratioY), canvas.width, 1); // max
  ctx.fillStyle = colors.extrema.top;
  ctx.fillRect(0, Math.round(extrema[1] * ratioY), canvas.width, 1); // min

  return canvas;
}

function plotAudioBuffer(buffer: AudioBuffer, canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is not available');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const duration = buffer.duration * 1000; // ms
  const ratio = canvas.width / duration;

  ctx.font = options.font;

  // Increment in function of the duration (Math.log(ratio) * Math.LOG10E + 1 gives the "length" of a number)
  const inc = 1000 / (10 ** Math.floor(Math.log(ratio * 2) * Math.LOG10E + 1));
  const markerSize = 25;

  ctx.strokeStyle = options.strokeStyle;
  ctx.lineWidth = 1;
  ctx.setLineDash(options.lineDash);

  for (let i = 0; i < duration; i += inc) {
    const x = Math.round(i * ratio);
    // console.log(buffer.duration, i, ratio);
    ctx.fillStyle = 'rgba(200, 200, 200, .6)';
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

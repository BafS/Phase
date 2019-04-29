const canvas = document.getElementById('graph');
// ctx.imageSmoothingEnabled = false;

/**
 * @param {Float32Array} points
 */
const plot = (points, canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#5a83b2";
  ctx.fillStyle = "rgba(0, 0, 0, .1)";
  ctx.fillRect(0, canvas.height / 2, canvas.width, 1); // x line
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  const ratioX = (canvas.width + 1) / points.length;
  const ratioY = -canvas.height / 2;
  let previous = null;
  const extrema = [Infinity, -Infinity];
  points.forEach((y, x) => {
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
};

(() => {
  const resizeCanvas = () => {
    canvas.width = document.querySelector('body').clientWidth;
  };

  // resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
})();

/**
 * @param {string} input
 * @param {number} period
 * @param {number} duration
 * @return {AudioBuffer}
 */
function run(input, period = 100, duration = 1000) {
  console.time('s');

  const audioCtx = new AudioContext();

  const len = period / 1000 * audioCtx.sampleRate; // secs
  const buffer = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
  // console.log(audioCtx.sampleRate);
  // console.log(buffer.duration);

  const lines = input.trim().split("\n");
  const last = `return ${lines.pop()}`; // Last line
  const final = lines.concat(last).join("\n");

  // Function constructor, to evaluate a function
  const fun = new Function('t', final);

  let max = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
    const nowBuffering = buffer.getChannelData(channel);
    for (let x = 0; x < buffer.length; ++x) {
      // const y = Math.random() * 2 - 1;
      const y = fun(x / audioCtx.sampleRate);
      if (Math.abs(y) > max) {
        max = Math.abs(y);
      }
      nowBuffering[x] = y;
    }

    // console.log(nowBuffering);
    if (channel === 1) {
      // ctx.strokeStyle = "#b2835a";
      plot(nowBuffering, canvas);
    }
  }
  if (max > 1) {
    console.warn('Max: ', max);
  }

  playBuffer(buffer, duration);

  // osc.start();
  // osc.stop(1);

  console.log(console.timeEnd('s'));

  return buffer;
}

/**
 * @param {AudioBuffer} buffer
 * @param {number} duration in ms
 */
function playBuffer(buffer, duration = 1000) {
  const audioCtx = new AudioContext();
  // Get an AudioBufferSourceNode.
  // This is the AudioNode to use when we want to play an AudioBuffer
  const source = audioCtx.createBufferSource(); // audioSourceNode

  // set the buffer in the AudioBufferSourceNode
  source.buffer = buffer;

  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(audioCtx.destination);

  // lance la lecture du so
  source.loop = true;
  source.start();
  source.stop(duration / 1000);
}

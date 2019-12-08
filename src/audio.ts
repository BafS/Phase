/**
 * Process javascript code to audio buffer
 */
function process(input: string, period: number = 100, duration: number = 1000): AudioBuffer {
  console.time('s');

  const audioCtx = new AudioContext();

  const len = period / 1000 * audioCtx.sampleRate; // secs
  const buffer = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
  // console.log('sampleRate: ' + audioCtx.sampleRate);
  // console.log(buffer.duration);

  // Function constructor, to evaluate a function
  const fun = new Function('t', input);

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
  }
  if (max > 1) {
    console.warn('Max: ', max);
  }

  // playBuffer(buffer, duration);

  console.log(console.timeEnd('s'));

  return buffer;
}

export {
  process,
};

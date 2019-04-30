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

  source.loop = true;
  source.start();
  source.stop(duration / 1000);
}

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

  playBuffer(buffer, duration);

  console.log(console.timeEnd('s'));

  return buffer;
}

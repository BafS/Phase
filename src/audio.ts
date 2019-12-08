import WaveWorker from './waveWorker.js';

/**
 * Process javascript code to audio buffer
 */
function process(input: string, period: number = 100): AudioBuffer {
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

  console.log(console.timeEnd('s'));

  return buffer;
}

async function audioBufferToWaveBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  return new Promise<Blob>((resolve: (blob: Blob) => void): void => {
    const worker: any = new WaveWorker();

    worker.onmessage = (e: any): void => {
      const blob = new Blob([e.data.buffer], { type: 'audio/wav' });
      resolve(blob);
    };

    const pcmArrays = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; ++i) {
      pcmArrays.push(audioBuffer.getChannelData(i));
    }

    worker.postMessage({
      pcmArrays,
      config: { sampleRate: audioBuffer.sampleRate },
    });
  });
}

export {
  process,
  audioBufferToWaveBlob,
};

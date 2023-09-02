// Adapted from https://stackoverflow.com/a/42632646

/* eslint-disable no-restricted-globals */
/* eslint-disable no-bitwise */

const WavePCM = function (config = {}) {
  this.sampleRate = config.sampleRate || 48000;
  this.bitDepth = config.bitDepth || 16;
  this.recordedBuffers = [];
  this.bytesPerSample = this.bitDepth / 8;
};

self.onmessage = function (e) {
  const wavPCM = new WavePCM(e.data.config);
  wavPCM.record(e.data.pcmArrays);
  wavPCM.requestData();
};

WavePCM.prototype.record = function (buffers = [[]]) {
  this.numberOfChannels = this.numberOfChannels || buffers.length;
  const bufferLength = buffers[0].length;
  const reducedData = new Uint8Array(bufferLength * this.numberOfChannels * this.bytesPerSample);

  // Interleave
  for (let i = 0; i < bufferLength; i++) {
    for (let channel = 0; channel < this.numberOfChannels; channel++) {
      const outputIndex = (i * this.numberOfChannels + channel) * this.bytesPerSample;
      let sample = buffers[channel][i];

      // Check for clipping
      if (sample > 1) {
        sample = 1;
      } else if (sample < -1) {
        sample = -1;
      }

      // bit reduce and convert to uInt
      switch (this.bytesPerSample) {
        case 4:
          sample *= 2147483648;
          reducedData[outputIndex] = sample;
          reducedData[outputIndex + 1] = sample >> 8;
          reducedData[outputIndex + 2] = sample >> 16;
          reducedData[outputIndex + 3] = sample >> 24;
          break;

        case 3:
          sample *= 8388608;
          reducedData[outputIndex] = sample;
          reducedData[outputIndex + 1] = sample >> 8;
          reducedData[outputIndex + 2] = sample >> 16;
          break;

        case 2:
          sample *= 32768;
          reducedData[outputIndex] = sample;
          reducedData[outputIndex + 1] = sample >> 8;
          break;

        case 1:
          reducedData[outputIndex] = (sample + 1) * 128;
          break;

        default:
          throw Error('Only 8, 16, 24 and 32 bits per sample are supported');
      }
    }
  }

  this.recordedBuffers.push(reducedData);
};

WavePCM.prototype.requestData = function () {
  const bufferLength = this.recordedBuffers[0].length;
  const dataLength = this.recordedBuffers.length * bufferLength;
  const headerLength = 44;
  const wav = new Uint8Array(headerLength + dataLength);
  const view = new DataView(wav.buffer);

  view.setUint32(0, 1380533830, false); // RIFF identifier 'RIFF'
  view.setUint32(4, 36 + dataLength, true); // file length minus RIFF identifier length and file description length
  view.setUint32(8, 1463899717, false); // RIFF type 'WAVE'
  view.setUint32(12, 1718449184, false); // format chunk identifier 'fmt '
  view.setUint32(16, 16, true); // format chunk length
  view.setUint16(20, 1, true); // sample format (raw)
  view.setUint16(22, this.numberOfChannels, true); // channel count
  view.setUint32(24, this.sampleRate, true); // sample rate
  view.setUint32(28, this.sampleRate * this.bytesPerSample * this.numberOfChannels, true); // byte rate (sample rate * block align)
  view.setUint16(32, this.bytesPerSample * this.numberOfChannels, true); // block align (channel count * bytes per sample)
  view.setUint16(34, this.bitDepth, true); // bits per sample
  view.setUint32(36, 1684108385, false); // data chunk identifier 'data'
  view.setUint32(40, dataLength, true); // data chunk length

  for (let i = 0; i < this.recordedBuffers.length; i++) {
    wav.set(this.recordedBuffers[i], i * bufferLength + headerLength);
  }

  self.postMessage(wav, [wav.buffer]);
  self.close();
};

export default WavePCM;

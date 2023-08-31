import React, { useState, useEffect, useCallback } from 'react';
import { useKeyboardShortcut } from '../hooks';
import Plot from './Plot';
import Button from './Button';
import { Size } from '../types';
import { audioBufferToWaveBlob } from '../audio';

const saveFile = (blob: Blob, filename: string): void => {
  const navigator = (window.navigator as any);
  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout((): void => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  }
};

const Player: React.FC<{
  buffer: AudioBuffer;
  options: Size;
}> = ({ buffer, options: { width, height } = { width: 800, height: 350 } }): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);

  useEffect((): () => void => {
    const audioCtx = new AudioContext();
    let source: AudioBufferSourceNode | undefined;

    if (isPlaying) {
      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      source = audioCtx.createBufferSource();

      // set the buffer in the AudioBufferSourceNode
      source.buffer = buffer;

      // connect the AudioBufferSourceNode to the destination to hear the sound
      source.connect(audioCtx.destination);

      source.loop = isLoop;
      source.onended = (): void => setIsPlaying(false);
      source.start();
    } else if (source) {
      source.stop();
    }

    return (): void => source?.stop();
  }, [isPlaying, buffer, isLoop]);

  useKeyboardShortcut(['Control', 'L'], useCallback((): void => {
    setIsPlaying((prevPlaying): boolean => !prevPlaying);
  }, [setIsPlaying]));

  return (
    <div className="player">
      <Plot buffer={buffer} options={{ width, height }} />
      <div className="panel">
        <span className="text-dark text-sm">Length: {buffer.duration}s | </span>
        <span className="text-dark text-sm">Frequency: {buffer.sampleRate}hz | </span>
        <Button className="btn btn-sm" handleClick={(): void => {
          setIsLoop(false);
          setIsPlaying((p): boolean => !p);
        }}>{isPlaying ? 'stop' : 'play'}</Button>
        <span> </span>
        <Button className="btn btn-sm" handleClick={(): void => {
          setIsLoop(true);
          setIsPlaying((p): boolean => !p);
        }}>{isPlaying ? 'stop' : 'loop'}</Button>
        <span className="text-dark text-sm"> (Ctrl+L) | </span>
        <Button className="btn btn-sm" handleClick={(): void => {
          audioBufferToWaveBlob(buffer).then((a): void => saveFile(a, 'phase-generated.wav'));
        }}>download</Button>
      </div>
    </div>
  );
};

export default Player;

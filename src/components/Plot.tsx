import React, { useEffect, useRef } from 'react';
import { plotAudioBuffer } from '../canvas';
import { Size } from '../types';

const Plot: React.FC<{
  buffer: AudioBuffer;
  options: Size;
}> = ({ buffer, options: { width, height } = { width: 800, height: 350 } }): JSX.Element => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect((): void => {
    if (ref.current) {
      plotAudioBuffer(buffer, ref.current);
    }
  }, [buffer, width]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
    />
  );
};

export default Plot;

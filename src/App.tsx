import React, {
  useState,
  useRef,
  useEffect,
  BaseSyntheticEvent,
  useLayoutEffect,
} from 'react';
import MonacoEditor from 'react-monaco-editor';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import './App.css';
import Button from './components/Button';
import InputNumber from './components/InputNumber';
import { process } from './audio';
import { plotAudioBuffer } from './canvas';
import { useDebounce } from './hooks';

interface PlotState {
  code: string;
  buffer: AudioBuffer;
}

interface PlotThumb extends PlotState {
  stateCallback: ({}) => void;
}

interface Size {
  width: number;
  height: number;
}

const Player: React.FC<{
  buffer: AudioBuffer;
  options: Size;
}> = ({ buffer, options: { width, height } = { width: 800, height: 350 } }): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  let source: AudioBufferSourceNode;

  useEffect((): (() => void) => {
    const audioCtx = new AudioContext();

    if (isPlaying) {
      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      source = audioCtx.createBufferSource();

      // set the buffer in the AudioBufferSourceNode
      source.buffer = buffer;

      // connect the AudioBufferSourceNode to the destination to hear the sound
      source.connect(audioCtx.destination);

      source.loop = true;
      source.start();
    } else if (source) {
      source.stop();
    }

    return (): void => source && source.stop();
  }, [isPlaying]);

  return (
    <>
      <Plot buffer={buffer} options={{ width, height }} />
      <Button handleClick={(): void => {
        if (isPlaying) {
          setIsPlaying(false);
          return;
        }

        setIsPlaying(true);
      }}>{isPlaying ? 'stop' : 'play'}</Button>
    </>
  );
};

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

const PlotThumb: React.FC<PlotThumb> = ({ buffer, code, stateCallback }): JSX.Element => (
  <div style={{ background: '#eee' }}>
    <Plot buffer={buffer} options={{ width: 400, height: 200 }} />
    <Button handleClick={(): void => stateCallback({ buffer, code })}>edit</Button>
  </div>
);

const App: React.FC = (): JSX.Element => {
  const [codeState, setCode] = useState<string>([
    'const a = 440',
    'const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);',
    '',
    '// return (-1) ** Math.floor(2*440*t) // square',
    // '// return 2 * (2*Math.floor(440*t) - Math.floor(2*440*t)) + 1 // square',
    // return Math.abs(t * 440 % 4 - 2) - 1 // triangle
    '// return 4 * Math.abs(t*440 - Math.round(t*440)) - 1 // triangle',
    '// return (t*440 - Math.round(t*440)) * 2 // sawtooth',
    // '// return (t*440 - Math.floor(.5 + t*440)) * 2 // sawtooth',
    // '// Math.sin(440 * Math.log10(t) * Math.PI * 2)',
    'return Math.sin(440 * t * Math.PI * 2) * 1',
    '// return sum(s => Math.sin(440 * t * Math.PI * 2 * s) / 2, [1, 3])',
  ].join('\n'));
  const [bufferState, setBuffer] = useState<AudioBuffer|null>(null);
  // const [plotStateList, setPlotStateList] = useState<PlotState[]>([]);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [duration, setDuration] = useState<number>(1000);
  const [period, setPeriod] = useState<number>(100);
  const [errorCode, setErrorCode] = useState<string>('');

  const options: editor.IEditorOptions = {
    selectOnLineNumbers: true,
    minimap: {
      enabled: false,
    },
    lineDecorationsWidth: '.2ch',
    lineNumbersMinChars: 3,
    fontSize: 13,
    scrollBeyondLastLine: false,
    hideCursorInOverviewRuler: true,
  };

  const handleDurationChange = (event: BaseSyntheticEvent): void => setDuration(+event.target.value);

  const handlePeriodChange = (event: BaseSyntheticEvent): void => setPeriod(+event.target.value);

  const editorDidMount = (monaco: editor.IEditor): void => monaco.focus();

  const debounce = useDebounce((): void => setWidth(window.innerWidth), 500);

  useLayoutEffect((): () => void => {
    window.addEventListener('resize', debounce);
    return (): void => window.removeEventListener('resize', debounce);
  });

  return (
    <div className="App">
      <div>
        <div className="text-title">PHASE</div>
        <div className="main-plot">
          {bufferState
            ? <Player buffer={bufferState} options={{ width, height: 350 }}/>
            // ? <Plot buffer={bufferState.getChannelData(0)} options={{width, height: 350}}/>
            : ''}
        </div>

        <div className="main-panel">
          {/* <Button handleClick={(): void => {
            if (bufferState) {
              setPlotStateList([...plotStateList, { code: codeState, buffer: bufferState }]);
            }
          }}>Save</Button>
          <Button handleClick={(): void => {
          }}>Play loop</Button> */}

          <Button handleClick={(): void => {
            // if (bufferState === null) {
            try {
              const audioBuffer = process(codeState, period, duration);
              setBuffer(audioBuffer);
              setErrorCode('');
            } catch (e) {
              setErrorCode(e.toString());
            }
          }}>render</Button>

          <span>
            <em>t<sub>max</sub></em>:
            <InputNumber min={0} max={100000} defaultValue={period} handleChange={handlePeriodChange} />ms
          </span><br/>
          {/* <span>loop:</span> */}
        </div>
        {/*
        {plotStateList !== []
          ? plotStateList.map((b): JSX.Element => <PlotThumb buffer={b.buffer} code={b.code} stateCallback={(info: PlotState) => console.log(info)}/>)
          : ''} */}
        {/* <span className="darker">A = F(t), {`{ t | 0 ≤ t ≤ ${period}}`}</span> */}
      </div>

      <div className="editor-panel">
        <span><em>F(t)</em> = </span>
        {errorCode ? <div className="text-error">{errorCode}</div> : ''}
        <MonacoEditor
          width={width}
          height="270"
          language="javascript"
          theme="vs-dark"
          value={codeState}
          options={options}
          onChange={setCode}
          editorDidMount={editorDidMount}
        />
      </div>
    </div>
  );
};

export default App;

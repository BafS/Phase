import React, {
  useState,
  useRef,
  useEffect,
  BaseSyntheticEvent,
  useLayoutEffect,
} from 'react';
// import Plot from './components/Plot';
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
  const audioCtx = new AudioContext();
  let isPlaying = false;
  let source: AudioBufferSourceNode;

  return (
    <>
      <Plot buffer={buffer} options={{ width, height }} />
      <Button handleClick={(): void => {
        if (isPlaying) {
          source.stop();
          isPlaying = false;
          return;
        }

        // Get an AudioBufferSourceNode.
        // This is the AudioNode to use when we want to play an AudioBuffer
        source = audioCtx.createBufferSource();

        // set the buffer in the AudioBufferSourceNode
        source.buffer = buffer;

        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(audioCtx.destination);

        isPlaying = true;
        source.loop = true;
        source.start();
      }}>Play/Stop</Button>
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
    <Button label="edit" handleClick={(): void => stateCallback({ buffer, code })} />
  </div>
);

const App: React.FC = (): JSX.Element => {
  const [codeState, setCode] = useState<string>([
    'const a = 440',
    'const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);',
    '',
    // '// (t*440 - Math.floor(.5 + t*440)) * 2 // sawtooth',
    // '// Math.sin(440 * Math.log10(t) * Math.PI * 2)',
    'return Math.sin(440 * t * Math.PI * 2) * .8',
    // '// return sum(s => Math.sin(440 * t * Math.PI * 2 * s) / 2, [1, 3])',
  ].join('\n'));
  const [bufferState, setBuffer] = useState<AudioBuffer|null>(null);
  const [plotStateList, setPlotStateList] = useState<PlotState[]>([]);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [duration, setDuration] = useState<number>(1000);
  const [period, setPeriod] = useState<number>(100);

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
      {/* <PlotPanel code={codeState}/> */}
      {/* <Plot buffer={buffer}/> */}

      <div>
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
            const audioBuffer = process(codeState, period, duration);
            setBuffer(audioBuffer);
          }}>Render</Button>

          <span>period: <InputNumber min={0} max={100000} defaultValue={period} handleChange={handlePeriodChange} />ms</span><br/>
          <span>duration (audio generation): <InputNumber min={0} defaultValue={duration} handleChange={handleDurationChange} />ms</span>
          {/* <span>loop:</span> */}
        </div>

        {plotStateList !== []
          ? plotStateList.map((b): JSX.Element => <PlotThumb buffer={b.buffer} code={b.code} stateCallback={(info: PlotState) => console.log(info)}/>)
          : ''}
      </div>

      <MonacoEditor
        width={width}
        height="260"
        language="javascript"
        theme="vs-dark"
        value={codeState}
        options={options}
        onChange={setCode}
        editorDidMount={editorDidMount}
      />
    </div>
  );
};

export default App;

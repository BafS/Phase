import React, {
  useState,
  useRef,
  useEffect,
  BaseSyntheticEvent,
  useLayoutEffect,
  useCallback,
} from 'react';
import MonacoEditor from 'react-monaco-editor';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import './App.css';
import Button from './components/Button';
import InputNumber from './components/InputNumber';
import { process } from './audio';
import { plotAudioBuffer } from './canvas';
import { useDebounce, useKeyboardShortcut } from './hooks';

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
    } else {
      source?.stop();
    }

    return (): void => source?.stop();
  }, [isPlaying]);

  useKeyboardShortcut(['Control', 'S'], useCallback((): void => {
    setIsPlaying((prevPlaying): boolean => !prevPlaying);
  }, [setIsPlaying]));

  return (
    <div className="player">
      <Plot buffer={buffer} options={{ width, height }} />
      <div className="panel">
        <span className="text-dark text-sm">Length: {buffer.duration}s | </span>
        <span className="text-dark text-sm">Frequency: {buffer.sampleRate}hz | </span>
        <Button className="btn btn-sm" handleClick={(): void => {
          setIsPlaying((p): boolean => !p);
        }}>{isPlaying ? 'stop' : 'play'}</Button>
        <span className="text-dark text-sm"> (Ctrl+S)</span>
      </div>
    </div>
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
  let monaco: editor.IStandaloneCodeEditor;

  const [codeState, setCode] = useState<string>([
    'const a = 440;',
    'const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);',
    '',
    '// Main waveforms',
    'Math.sin(440 * t * Math.PI * 2); // sine',
    '(-1) ** Math.floor(2 * 440 * t); // square',
    // '// return 2 * (2*Math.floor(440*t) - Math.floor(2*440*t)) + 1 // square',
    // return Math.abs(t * 440 % 4 - 2) - 1 // triangle
    '(440 * t - Math.round(440 * t)) * 2; // sawtooth',
    '4 * Math.abs(440 * t - Math.round(t*440)) - 1; // triangle',
    // '// return (t*440 - Math.floor(.5 + t*440)) * 2 // sawtooth',
    // '// Math.sin(440 * Math.log10(t) * Math.PI * 2)',
    // '// Other',
    // 'Math.sin(440 * t * Math.PI * 2) * .2; // reduce amplitude',
    // 'sum(s => Math.sin(440 * t * Math.PI * 2 * s) / 2, [1, 3]);',
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

  const editorDidMount = (monacoMount: editor.IStandaloneCodeEditor): void => {
    monaco = monacoMount;
    monaco.focus();
  };

  const debounce = useDebounce((): void => setWidth(window.innerWidth), 500);

  const doProcess = (code: string): void => {
    const lines = code.trim().split('\n');
    let last = lines.pop();
    if (!last) {
      return;
    }

    if (!last.trimStart().startsWith('return') && !last.trimStart().startsWith('//')) {
      last = `return ${last}`; // Last line
    }

    const finalCode = lines.concat(last).join('\n');

    try {
      const audioBuffer = process(finalCode, period, duration);
      setBuffer(audioBuffer);
      setErrorCode('');
    } catch (e) {
      setErrorCode(e.toString());
      console.error(e);
    }
  };

  const handleProcess = (): void => doProcess(codeState);

  const handleProcessLine = (): void => {
    const position = monaco?.getPosition();
    if (!position) {
      return;
    }

    const { lineNumber } = position;

    const lines = monaco.getValue().trim().split('\n').slice(0, lineNumber);

    doProcess(lines.join('\n'));
  };

  useLayoutEffect((): () => void => {
    window.addEventListener('resize', debounce);
    return (): void => window.removeEventListener('resize', debounce);
  });

  useKeyboardShortcut(['Control', '1'], useCallback((): void => handleProcess(), [codeState]));

  useKeyboardShortcut(['Control', '2'], useCallback((): void => handleProcessLine(), []));

  return (
    <div className="App">
      <div>
        <div className="text-title">PHASE</div>
        <div className="main-plot">
          {bufferState
            ? <Player buffer={bufferState} options={{ width, height: 350 }}/>
            // ? <Plot buffer={bufferState.getChannelData(0)} options={{width, height: 350}}/>
            : <span className="text-dark text-sm">(click on "process" to generate and plot the audio)</span>}
        </div>

        <div className="main-panel">
          {/* <Button handleClick={(): void => {
            if (bufferState) {
              setPlotStateList([...plotStateList, { code: codeState, buffer: bufferState }]);
            }
          }}>Save</Button>
          <Button handleClick={(): void => {
          }}>Play loop</Button> */}

          <div className="right">
            <Button handleClick={handleProcess}>process code</Button>
            <span className="text-dark text-sm"> (Ctrl+1)</span><br/>
            <span className="text-dark text-sm">process line: (Ctrl+2)</span>
          </div>

          <span>
            <em>t<sub>max</sub></em>:
            <InputNumber min={0} max={100000} defaultValue={period} handleChange={handlePeriodChange} />ms
          </span><br/>
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

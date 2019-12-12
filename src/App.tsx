import React, {
  useState,
  BaseSyntheticEvent,
  useLayoutEffect,
  useCallback,
} from 'react';
import MonacoEditor, { EditorDidMount } from 'react-monaco-editor';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import './App.css';
import Button from './components/Button';
import Player from './components/Player';
import InputNumber from './components/InputNumber';
import { process } from './audio';
import { useDebounce, useKeyboardShortcut } from './hooks';

const Placeholder: React.FC = (): JSX.Element => (
  <div className="text-dark placeholder">
    Generates a sound whose amplitude is given by <em>F(t)</em> with time <em>t</em> (in ms) from
    <em> 0</em> to <em>t<sub>max</sub></em>
    <span className="text-sm">(click on "process" to generate and plot the audio)</span>
  </div>
);

const App: React.FC = (): JSX.Element => {
  let monaco: editor.IStandaloneCodeEditor;

  const [codeState, setCode] = useState<string>([
    '// Javascript code to evaluate your function F(t)',
    '',
    '// Main waveforms (https://en.wikipedia.org/wiki/Waveform)',
    '(-1) ** Math.floor(2 * 440 * t); // square',
    '(440 * t - Math.round(440 * t)) * 2; // sawtooth',
    '4 * Math.abs(440 * t - Math.round(t*440)) - 1; // triangle',
    'Math.sin(440 * t * Math.PI * 2); // sine',
  ].join('\n'));
  const [bufferState, setBuffer] = useState<AudioBuffer|null>(null);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [period, setPeriod] = useState<number>(100);
  const [errorCode, setErrorCode] = useState<string>('');

  const options: Readonly<editor.IEditorConstructionOptions> = {
    selectOnLineNumbers: true,
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    lineDecorationsWidth: '.2ch',
    lineNumbersMinChars: 3,
    fontSize: 13,
    scrollBeyondLastLine: false,
    hideCursorInOverviewRuler: true,
  };

  const handlePeriodChange = (event: BaseSyntheticEvent): void => setPeriod(+event.target.value);

  const editorDidMount: EditorDidMount = (monacoMount: editor.IStandaloneCodeEditor): void => {
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
      const audioBuffer = process(finalCode, period);
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
      <div className="text-title">PHASE</div>
      <div className="main-plot">
        {bufferState
          ? <Player buffer={bufferState} options={{ width, height: 350 }}/>
          : <Placeholder/>}
      </div>

      <div className="main-panel">
        <div className="left">
          <em>t<sub>max</sub></em>:
          <InputNumber min={0} max={100000} defaultValue={period} handleChange={handlePeriodChange} />ms
        </div>
        <div className="right">
          <Button handleClick={handleProcess}>process code</Button>
          <span className="text-dark text-sm"> (Ctrl+1)</span><br/>
          <span className="text-dark text-sm">process line: (Ctrl+2)</span>
        </div>
      </div>

      <div className="editor-panel">
        <span><em>F(t)</em> = </span>
        {errorCode ? <div className="text-error">{errorCode}</div> : ''}
        <MonacoEditor
          language="javascript"
          theme="vs-dark"
          value={codeState}
          options={options}
          onChange={setCode}
          editorDidMount={editorDidMount}
        />
      </div>

      <div className="footer-panel">
        Fork me on <a href="https://github.com/BafS/Phase">github</a>
      </div>
    </div>
  );
};

export default App;

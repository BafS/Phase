// import * as monaco from 'monaco-editor/esm/vs/editor/editor.main';
import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import React from 'react';
import ReactDOM from 'react-dom';

import { playBuffer, run } from './audio';
import * as canvas from './canvas';

const buffers: AudioBuffer[] = [];
const mainCanvas = document.getElementById('graph');

const miniPlot = (buffer: AudioBuffer): HTMLCanvasElement => {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 270;
  canvasEl.height = 100;
  // const ctx = canvasEl.getContext('2d');

  return canvas.plot(buffer.getChannelData(0), canvasEl);
};

const playBufferN = (n: number): void => {
  const duration = document.querySelector('[name="duration"]').value;
  const target = document.querySelector(`[data-number="${n}"] .loader .bar`);
  const player = target.animate([
    {
      opacity: '.7',
      width: '0',
    },
    {
      opacity: '1',
      width: '100%',
    },
  ], +duration);
  player.addEventListener('finish', (): void => {
    target.style.width = '0';
  });

  playBuffer(buffers[n].buffer, +duration);
};

const onResizeCanvas = (canvas: HTMLElement): void => {
  const resizeCanvas = (): void => {
    canvas.width = document.querySelector('body').clientWidth;
  };

  // resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
};

/**
 * @param {AudioBuffer} Buffer
 * @param {string} input
 */
const addBuffer = (buffer: AudioBuffer, input: string): void => {
  buffers.push({ buffer, input });

  const lines = input.trim().split('\n');
  const last = lines.pop();

  const el = document.createElement('div');
  const n = buffers.length - 1;
  el.addEventListener('click', (): void => {
    playBufferN(n);
  });
  el.classList.add('buffer-play-btn');
  el.setAttribute('data-number', `${n}`);
  el.innerHTML = `
    <span>Buffer #${buffers.length}</span><br>
    <span class="loader"><div class="bar"></div></span>
    Length: <input name="length" type="number" min="0" max="32" value="1">
    <code>${last}</code>`;

  const canvasEl = miniPlot(buffer);
  el.append(canvasEl);

  document.querySelector('#buffers').append(el);
};


onResizeCanvas(mainCanvas);

const render = (editor: monaco.editor.IStandaloneCodeEditor): void => {
  const ms = document.querySelector('[name="period"]').value;
  const duration = document.querySelector('[name="duration"]').value;
  const { lineNumber } = editor.getPosition();

  const lines = editor.getValue().trim().split('\n').slice(0, lineNumber);
  const last = `return ${lines.pop()}`; // Last line
  const final = lines.concat(last).join('\n');

  const buffer = run(final, ms, duration);

  canvas.plot(buffer.getChannelData(0), mainCanvas);

  addBuffer(buffer, final);
};

self.MonacoEnvironment = {
  getWorkerUrl(moduleId, label): string {
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  },
};

const editor = monaco.editor.create(document.getElementById('container'), {
  value: [
    // 'function sum(fn, [min, max]) {',
    // '    let sum = 0;',
    // '    for (let i = min; i <= max; ++i) {',
    // '        sum += fn(i);',
    // '    }',
    // '    return sum;',
    // '}',
    'const a = 440',
    'const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);',
    '',
    '(t*440 - Math.floor(.5 + t*440)) * 2 // sawtooth',
    'Math.sin(440 * Math.log10(t) * Math.PI * 2)',
    'Math.sin(440 * t * Math.PI * 2)',
    'sum(s => Math.sin(440 * t * Math.PI * 2 * s) / 2, [1, 3])',
  ].join('\n'),
  language: 'javascript',
  // lineNumbers: 'off',
  minimap: {
    enabled: false,
  },
  // roundedSelection: false,
  scrollBeyondLastLine: false,
  // theme: "vs-dark",
});

// require(['vs/editor/editor.main'], function() {
// const editor = monaco.editor.create(document.getElementById('container'), {
//     value: [
//         // 'function sum(fn, [min, max]) {',
//         // '    let sum = 0;',
//         // '    for (let i = min; i <= max; ++i) {',
//         // '        sum += fn(i);',
//         // '    }',
//         // '    return sum;',
//         // '}',
//         'const a = 440',
//         'const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);',
//         '',
//         '(t*440 - Math.floor(.5 + t*440)) * 2 // sawtooth',
//         'Math.sin(440 * Math.log10(t) * Math.PI * 2)',
//         'Math.sin(440 * t * Math.PI * 2)',
//         'sum(s => Math.sin(440 * t * Math.PI * 2 * s) / 2, [1, 3])',
//     ].join('\n'),
//     language: 'javascript',
//     // lineNumbers: 'off',
//     minimap: {
//         enabled: false
//     },
//     // roundedSelection: false,
//     scrollBeyondLastLine: false,
//     // theme: "vs-dark",
// });
document.getElementById('load').addEventListener('click', (): void => {
  render(editor);
});
// render(editor);
// run(editor.getValue(), 1000);

let isShiftPressed = false;
let isCtrlPressed = false;
document.addEventListener('keydown', ({ keyCode }): void => {
  keyCode === 16 && (isShiftPressed = true);
  keyCode === 17 && (isCtrlPressed = true);
  if (isShiftPressed && keyCode === 13 || isCtrlPressed && keyCode === 69) { // e
    render(editor);
  }
  const n = keyCode - 48;
  if (!editor.hasTextFocus() && n > 0 && n < 10 && buffers[n - 1]) {
    playBufferN(n - 1);
  }
});

document.addEventListener('keyup', ({ keyCode }): void => {
  keyCode === 16 && (isShiftPressed = false);
  keyCode === 17 && (isCtrlPressed = false);
});
// });

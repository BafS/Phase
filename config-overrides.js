const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config) {
  if (!config.plugins) {
    config.plugins = [];
  }
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript'],
      features: [
        'accessibilityHelp', 'bracketMatching', 'caretOperations', 'codeAction', 'comment', 'contextmenu',
        'coreCommands', 'cursorUndo', 'dnd', 'folding', 'fontZoom', 'format', 'goToDefinitionCommands',
        'goToDefinitionMouse', 'gotoError', 'hover', 'inPlaceReplace', 'inspectTokens', 'iPadShowKeyboard',
        'linesOperations', 'links', 'multicursor', 'parameterHints', 'quickCommand', 'quickOutline',
        'smartSelect', 'snippets', 'suggest', 'transpose',
        'wordHighlighter', 'wordOperations', 'wordPartOperations'],
    }),
  );

  config.module.rules.push({
    test: /waveWorker\.[jt]s$/,
    use: { loader: 'worker-loader' },
  });

  return config;
};

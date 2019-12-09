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
        'cursorUndo', 'fontZoom', 'goToDefinitionMouse', 'hover', 'inPlaceReplace', 'inspectTokens',
        'iPadShowKeyboard', 'linesOperations', 'links', 'multicursor', 'parameterHints',
        'smartSelect', 'suggest', 'transpose', 'wordHighlighter', 'wordOperations', 'wordPartOperations'],
    }),
  );

  config.module.rules.push({
    test: /waveWorker\.js$/,
    use: { loader: 'worker-loader' },
  });

  return config;
};

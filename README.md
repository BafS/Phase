# Phase

> Work in progress

Evaluate, play and repeat given javascript functions using web audio api.

## Example

```js
const a = 440;
const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);

// 3 harmonics to have a more realistic sound
sum(n => Math.sin(2 * a * n * PI * t) * .7 / n, [1, 3])
```

### Dev

`npm i` to install the dependencies

 - `npm start` to dev and run a local server
 - `npm run build` to build in `build/`

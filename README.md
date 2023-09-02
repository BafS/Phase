# Phase

Evaluate, plot and listen given javascript functions using web audio api.

<center>
<img src="https://i.imgur.com/RaU2et7.png" width="1133px" />
</center>

## Example

```js
const a = 440;
const sum = (fn, [min, max]) => Array(max - min + 1).fill().reduce((sum, _, i) => sum + fn(i + min), 0);

// 3 harmonics to have a more realistic sound
sum(n => Math.sin(2 * a * n * Math.PI * t) * .7 / n, [1, 3])
```

### Dev

`npm i` to install the dependencies

 - `npm run dev` to dev and run a local server
 - `npm run build` to build for production

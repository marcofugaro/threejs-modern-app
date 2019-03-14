# threejs-modern-app

> Boilerplate and utils for a fullscreen Three.js app

![demo]()
(assets thanks to poliigon & blender)

Example of a production scale project: [shrimpc.at]()


It is inspired from [mattdesl](https://twitter.com/mattdesl)'s [threejs-app](https://github.com/mattdesl/threejs-app), but it was rewritten and simplified using **ES6** syntax rather than node, making it easier to read and well commented, so it can be easily customized to fit your needs.

## Features
- All the **Three.js boilerplate code is tucked away** in a file, the exported `WebGLApp` is easily configurable from the outside, for example you can enable postprocessing, [orbit controls](https://github.com/Jam3/orbit-controls), [FPS stats](https://github.com/mrdoob/stats.js/), a [control-panel](https://github.com/freeman-lab/control-panel) and use the save screenshot functionality. It also has built-in support for [Cannon.js](https://github.com/schteppe/cannon.js) and [Tween.js](https://github.com/tweenjs/tween.js/). [[Read more](#webglapp)]
- A **scalable Three.js component structure** where each component is a class which extends `THREE.Group`, so you can add any object to it. The class also has update, resize, and touch hooks. [[Read more](#)]
- An **asset manager** which handles the preloading of `.gltf` models, images, audios, videos and can be easily extended to support other files. It also automatically uploads a texture to the GPU, loads cube env maps or parses equirectangular projection images. [[Read more](#)]
- global `window.DEBUG` flag which is true when the url contains `?debug` as a query parameter. So you can enable **debug mode** both locally and in production. [[Read more](#)]
- [glslify](https://github.com/glslify/glslify) to import shaders from `node_modules`. [[Read more](#)]
- Hot reload not enabled by default. [[Read more](#)]
- Modern and customizable development tools such as webpack, babel, eslint, prettier and browserslist.

## User Guide

#### WebGLApp

```js
const webgl = new WebGLApp({ ...options })
```

The WebGLApp class contains all the code needed for Three.js to run a scene, it is always the same so it makes sense to hide it in a standalone file and don't think about it.

You can see an example configuration here.

You can pass the class the options you would pass to the [THREE.WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer), and also some more options:

| Option | Default | Description |
| --- | --- | --- |
| `background` | '#000' | The background of the scene |
| `backgroundAlpha` | 1 | The transparency of the background |
| `maxPixelRatio` | 2 | The clamped pixelRatio, for performance reasons |
| `maxDeltaTime` | 1 / 30 | The |
| `postprocessing` | false | Enable Three.js postprocessing. The composer gets exposed as `webgl.composer`. |
| `showFps` | false | Show the [stats.js](https://github.com/mrdoob/stats.js/) fps counter |
| `orbitControls` | false | Accepts an object with the [orbit-controls](https://github.com/Jam3/orbit-controls) options. Exposed as `webgl.orbitControls`. |
| `panelInputs` | false | Accepts an array with the [control-panel](https://github.com/freeman-lab/control-panel) inputs. Exposed ad `webgl.panel`. |
| `world` | false | Accepts an instance of the [cannon.js](https://github.com/schteppe/cannon.js) world (`new CANNON.World()`). Exposed as `webgl.world`. |
| `tween` | false | Accepts the [TWEEN.js](https://github.com/tweenjs/tween.js/) library (`TWEEN`). Exposed as `webgl.tween`. |

The `webgl` instance will contain all the Three.js elements such as `three.scene`, `three.renderer`...

## console screenshots

## detailed secrtion explainations
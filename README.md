# threejs-modern-app

> Boilerplate and utils for a fullscreen Three.js app

![demo]()
(assets thanks to poliigon & blender)

Example of a production scale project: [shrimpc.at]()


It is inspired from [mattdesl](https://twitter.com/mattdesl)'s [threejs-app](https://github.com/mattdesl/threejs-app), but it was rewritten and simplified using **ES6** syntax rather than node, making it easier to read and well commented, so it can be easily customized to fit your needs.

## Features
- All the **Three.js boilerplate code is tucked away** in a file, the exported `WebGLApp` is easily configurable from the outside, for example you can enable postprocessing, [orbit controls](https://github.com/Jam3/orbit-controls), [FPS stats](https://github.com/mrdoob/stats.js/), a [control-panel](https://github.com/freeman-lab/control-panel) and use the save screenshot functionality. It also has built-in support for [Cannon.js](https://github.com/schteppe/cannon.js) and [Tween.js](https://github.com/tweenjs/tween.js/). [[Read more](#)]
- A **scalable Three.js component structure** where each component is a class which extends `THREE.Group`, so you can add any object to it. The class also has update, resize, and touch hooks. [[Read more](#)]
- An **asset manager** which handles the preloading of `.gltf` models, images, audios, videos and can be easily extended to support other files. It also automatically uploads a texture to the GPU, loads cube env maps or parses equirectangular projection images. [[Read more](#)]
- global `window.DEBUG` flag which is true when the url contains `?debug` as a query parameter. So you can enable **debug mode** both locally and in production. [[Read more](#)]
- [glslify](https://github.com/glslify/glslify) to import shaders from `node_modules`. [[Read more](#)]
- Hot reload not enabled by default. [[Read more](#)]
- Modern and customizable development tools such as webpack, babel, eslint, prettier and browserslist.

## User Guide

#### WebGLApp class
This class contains all the code needed for Three.js to run a scene, it is always the same so it makes sense to hide it in a standalone file and don't think about it. Here is an example configuration of the class:

```js
const webgl = new WebGLApp({
  // the canvas dom element
  canvas,
  // enable transparency
  alpha: true,
  // set the scene background color
  background = '#000',
  backgroundAlpha: 1,
  // enable postprocessing
  // ⚠️ Warning! This disables antialiasing for the scene,
  // at least until WebGL2 comes along in Three.js
  postprocessing: true,
  // show the fps counter from stats.js
  showFps: window.DEBUG,
  // enable orbit-controls with a z-distance of 5,
  // it is recommended to keep the distance the same as
  // the camera distance:
  // webgl.camera.position.set(0, 0, 5)
  orbitControls: { distance: 5 },
  // Add the control-panel inputs
  panelInputs: [
    {
      type: 'range',
      label: 'Angular Velocity',
      min: 0.1,
      max: 30,
      initial: DEFAULT_ANGULAR_VELOCITY,
      scale: 'log',
    },
  ],
  // enable Cannon.js
  world: new CANNON.World(),
  // enable Tween.js
  tween: TWEEN,
})
```

Now the `webgl` instance contains all

## console screenshots

## detailed secrtion explainations
# threejs-modern-app

> Boilerplate and utils for a fullscreen three.js app

[![demo](.github/screenshots/demo.png)](https://marcofugaro.github.io/threejs-modern-app/?debug)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _assets thanks to [Poliigon](https://www.poliigon.com/) and [Blender](https://www.blender.org/)_

It is inspired from [mattdesl](https://twitter.com/mattdesl)'s [threejs-app](https://github.com/mattdesl/threejs-app), but it was rewritten and simplified using **ES6** syntax rather than node, making it easier to read and well commented, so it can be easily customized to fit your needs.

### [DEMO](https://marcofugaro.github.io/threejs-modern-app/?debug)

### [Example of production scale project](https://github.com/marcofugaro/shrimpcat/)

### [Yeoman Generator (CLI that generates a blank project without the example code)](https://github.com/marcofugaro/generator-treejs-modern-app)

## Features

- All the **three.js boilerplate code is tucked away** in a file, the exported `WebGLApp` is easily configurable from the outside, for example you can enable postprocessing, [orbit controls](https://github.com/Jam3/orbit-controls), [FPS stats](https://github.com/mrdoob/stats.js/), a [controls-gui](https://github.com/rreusser/controls-gui) and use the save screenshot functionality. It also has built-in support for [Cannon.js](https://github.com/schteppe/cannon.js). [[Read more](#webglapp)]
- A **scalable three.js component structure** where each component is a class which extends `THREE.Group`, so you can add any object to it. The class also has update, resize, and touch hooks. [[Read more](#component-structure)]
- An **asset manager** which handles the preloading of `.gltf` models, images, audios, videos and can be easily extended to support other files. It also automatically uploads a texture to the GPU, loads cube env maps or parses equirectangular projection images. [[Read more](#asset-manager)]
- global `window.DEBUG` flag which is true when the url contains `?debug` as a query parameter. So you can enable **debug mode** both locally and in production. [[Read more](#debug-mode)]
- [glslify](https://github.com/glslify/glslify) to import shaders from `node_modules`. [[Read more](#glslify)]
- GPU tiering info using [detect-gpu](https://github.com/TimvanScherpenzeel/detect-gpu) [[Read more](#gpu-info)]
- A lot of useful creative coding util functions from [canvas-sketch-util](https://github.com/mattdesl/canvas-sketch-util) [[Read more](#util-functions)]
  <!-- - **Hot reload**. [[Read more](#hot-reload)] -->
- Modern and customizable development tools such as webpack, babel, eslint, prettier and browserslist.
- Beautiful console output:

![console screenshots](.github/screenshots/console.png)

> **NOTE**: [brew](https://brew.sh/) is required for the build command output

## Usage

Once you installed the dependencies running `yarn`, these are the available commands:

- `yarn start` starts a server locally
- `yarn build` builds the project for production, ready to be deployed from the `build/` folder

All the build tools logic is in the `package.json` and `webpack.config.js`.

## WebGLApp

```js
import WebGLApp from './lib/WebGLApp'

const webgl = new WebGLApp({ ...options })
```

The WebGLApp class contains all the code needed for three.js to run a scene, it is always the same so it makes sense to hide it in a standalone file and don't think about it.

You can see an example configuration here:

https://github.com/marcofugaro/threejs-modern-app/blob/5f93ae32c378d9ea25a16f3fd813d04681c84815/src/index.js#L15-L48

You can pass the class the options you would pass to the [THREE.WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer), and also some more options:

| Option                | Default                      | Description                                                                                                                                                                                     |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background`          | `'#111'`                     | The background of the scene.                                                                                                                                                                    |
| `backgroundAlpha`     | 1                            | The transparency of the background.                                                                                                                                                             |
| `maxPixelRatio`       | 2                            | The clamped pixelRatio, for performance reasons.                                                                                                                                                |
| `maxDeltaTime`        | 1 / 30                       | Clamp the `dt` to prevent stepping anything too far forward. 1 / 30 means 30fps.                                                                                                                |
| `width`               | `window.innerWidth`          | The canvas width.                                                                                                                                                                               |
| `height`              | `window.innerHeight`         | The canvas height                                                                                                                                                                               |
| `orthographic`        | false                        | Use an [OrthographicCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera) instead of the default [PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera). |
| `cameraPosition`      | `new THREE.Vector3(0, 0, 4)` | Set the initial camera position. The camera will always look at [0, 0, 0].                                                                                                                      |
| `fov`                 | 45                           | The field of view of the PerspectiveCamera. It is ignored if the option `orthographic` is true.                                                                                                 |
| `frustumSize`         | 3                            | Defines the size of the OrthographicCamera frustum. It is ignored if the option `orthographic` is false.                                                                                        |
| `near`                | 0.01                         | The camera near plane.                                                                                                                                                                          |
| `far`                 | 100                          | The camera far plane.                                                                                                                                                                           |
| `postprocessing`      | false                        | Enable three.js postprocessing. The composer gets exposed as `webgl.composer`.                                                                                                                  |
| `xr`                  | false                        | Enable three.js WebXR mode. The update function now will have a `xrframe` object passed as a third parameter.                                                                                   |
| `gamma`               | false                        | Turn on gamma correction. Remember to turn on gamma corrections also for textures and colors as stated in [this guide](https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/).     |
| `showFps`             | false                        | Show the [stats.js](https://github.com/mrdoob/stats.js/) fps counter                                                                                                                            |
| `orbitControls`       | undefined                    | Accepts an object with the [orbit-controls](https://github.com/Jam3/orbit-controls) options. Exposed as `webgl.orbitControls`.                                                                  |
| `controls`            | undefined                    | Accepts an object with the [controls-gui](https://github.com/rreusser/controls-gui) configuration. Exposed ad `webgl.controls`.                                                                 |
| `hideControls`        | false                        | Set this to `true` to hide the controls-gui panel.                                                                                                                                              |
| `closeControls`       | false                        | Set this to `true` to initialize the controls-gui panel closed.                                                                                                                                 |
| `world`               | undefined                    | Accepts an instance of the [cannon.js](https://github.com/schteppe/cannon.js) world (`new CANNON.World()`). Exposed as `webgl.world`.                                                           |
| `showWorldWireframes` | false                        | Set this to `true` to show the wireframes of every body in the world. Uses [CannonDebugRenderer](http://schteppe.github.io/cannon.js/tools/threejs/example.html)                                |

The `webgl` instance will contain all the three.js elements such as `webgl.scene`, `webgl.renderer`, `webgl.camera` or `webgl.canvas`. It also exposes some useful properties and methods:

### webgl.isDragging

Wether or not the user is currently dragging. It is `true` between the `onPointerDown` and `onPointerUp` events.

### webgl.cursor

Set this property to change the cursor style of the canvas. For example you can use it to display the pointer cursor on some objects:

```js
onPointerMove(event, [x, y]) {
  // raycast and get the intersecting mesh
  const intersectingMesh = getIntersectingMesh([x, y], this, this.webgl)

  if (intersectingMesh) {
    this.webgl.cursor = 'pointer'
  } else {
    this.webgl.cursor = null
  }
}
```

### webgl.saveScreenshot({ ...options })

Save a screenshot of the application as a png.

| Option     | Default       | Description                    |
| ---------- | ------------- | ------------------------------ |
| `width`    | 2560          | The width of the screenshot    |
| `height`   | 1440          | The height of the screenshot   |
| `fileName` | `'image.png'` | The filename, can be only .png |

### webgl.onUpdate((dt, time) => {})

Subscribe to the update `requestAnimationFrame` without having to create a component. If needed you can later unsubscribe the function with `webgl.offUpdate(function)`.

| Parameter | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `dt`      | The seconds elapsed from the latest frame, in a 60fps application it's `0.016s` (aka `16ms`) |
| `time`    | The time in seconds elapsed from when the animation loop starts                              |

## Component structure

Rather than writing all of your three.js app in one file instruction after instruction, you can split your app into thhree.js components". This makes it easier to manage the app as it grows. Here is a basic component:

https://github.com/marcofugaro/threejs-modern-app/blob/master/src/scene/Box.js

A three.js component is a class which extends [`THREE.Group`](https://threejs.org/docs/#api/en/objects/Group) (an alias for [`THREE.Object3D`](https://threejs.org/docs/#api/en/core/Object3D)) and subsequently inherits its properties and methods, such as `this.add(someMesh)` or `this.position` or `this.rotation`. [Here is a full list](https://threejs.org/docs/#api/en/core/Object3D).

After having instantiated the class, you can add it directly to the scene.

```js
// attach it to the scene so you can access it in other components
webgl.scene.birds = new Birds(webgl, { count: 1000 })
webgl.scene.add(webgl.scene.birds)
```

And in the component, you can use the options like this.

```js
export default class Birds extends THREE.Group {
  constructor(webgl, options) {
    super(options)
    // these can be used also in other methods
    this.webgl = webgl
    this.options = options

    // destructure and default values like you do in React
    const { count = 10 } = this.options

    // ...
```

The class supports some hooks, which get called once the element is in the scene:

### update(dt, time) {}

Called each frame of the animation loop of the application. Gets called by the main `requestAnimationFrame`.

| Parameter | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| `dt`      | The seconds elapsed from the latest frame, in a 60fps application it's `0.016s` (aka `16ms`). |
| `time`    | The time in seconds elapsed from when the animation loop starts.                              |

### resize({ width, height, pixelRatio }) {}

Called each time the window has been resized.

| Parameter    | Description                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `width`      | The window width.                                                                                          |
| `height`     | The window height.                                                                                         |
| `pixelRatio` | The application pixelRatio, it's usually `window.devicePixelRatio` but clamped with `webgl.maxPixelRatio`. |

### onPointerDown(event, [x, y]) {}

Called on the `mousedown`/`touchstart` (aka the newer `pointerdown`) event on the canvas. It uses [touches.js](https://github.com/Jam3/touches) behind the scenes.

| Parameter  | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `event`    | The native event.                                                                 |
| `position` | An array containing the `x` and the `y` position from the top left of the window. |

### onPointerMove(event, [x, y]) {}

Called on the `mousemove`/`touchmove` (aka the newer `pointermove`) event on the canvas. It uses [touches.js](https://github.com/Jam3/touches) behind the scenes.

| Parameter  | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `event`    | The native event.                                                                 |
| `position` | An array containing the `x` and the `y` position from the top left of the window. |

### onPointerUp(event, [x, y]) {}

Called on the `mouseup`/`touchend` (aka the newer `pointerup`) event on the canvas. It uses [touches.js](https://github.com/Jam3/touches) behind the scenes.

| Parameter  | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `event`    | The native event.                                                                 |
| `position` | An array containing the `x` and the `y` position from the top left of the window. |

### Functional Components

If you don't need any of the previous methods, you can use functional components, which are just plain functions with the objective of making code easier to navigate in.

```js
export function addLights(webgl) {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.copy(position)
  webgl.scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  webgl.scene.add(ambientLight)
}

// ...

addLights(webgl)
```

## Asset Manager

The Asseet Manager handles the preloading of all the assets needed to run the scene, you use it like this:

https://github.com/marcofugaro/threejs-modern-app/blob/5f93ae32c378d9ea25a16f3fd813d04681c84815/src/scene/Suzanne.js#L12-L42

https://github.com/marcofugaro/threejs-modern-app/blob/5f93ae32c378d9ea25a16f3fd813d04681c84815/src/index.js#L59

https://github.com/marcofugaro/threejs-modern-app/blob/5f93ae32c378d9ea25a16f3fd813d04681c84815/src/scene/Suzanne.js#L49

In detail, first you queue the asset you want to preload in the component where you will use it

```js
import assets from '../lib/AssetManager'

const key = assets.queue({
  url: 'assets/model.gltf',
  type: 'gltf',
})
```

Then you import the component in the `index.js` so that code gets executed

```js
import Component from './scene/Component'
```

And then you start the queue assets loading promise, always in the `index.js`

```js
assets.load({ renderer: webgl.renderer }).then(() => {
  // assets loaded! we can show the canvas
})
```

After that, you init the component and use the asset in the component like this

```js
const modelGltf = assets.get(key)
```

These are all the exposed methods:

### assets.queue({ url, type, ...others })

Queue an asset to be downloaded later with `assets.load()`.

| Option            | Default      | Description                                                                                                                                                                                                                                                                               |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`             |              | The url of the asset relative to the `public/` folder.                                                                                                                                                                                                                                    |
| `type`            | autodetected | The type of the asset, can be either `gltf`, `image`, `svg`, `texture`, `env-map`, `json`, `audio` or `video`. If omitted it will be discerned from the asset extension.                                                                                                                  |
| `equirectangular` | false        | Only if you set `type: 'env-map'`, you can pass `equirectangular: true` if you have a single [equirectangular image](https://www.google.com/search?q=equirectangular+image&tbm=isch) rather than the six squared subimages.                                                               |
| `pmrem`           | false        | Only if you set `type: 'env-map'`, you can pass `pmrem: true` to use the [PMREMGenerator](https://threejs.org/docs/#api/en/extras/PMREMGenerator) and prefilter for irradiance. This is often used when applying an envMap to an object rather than a scene background.                   |
| ...others         |              | Other options that get passed to [loadEnvMap](https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/loadEnvMap.js) or [loadTexture](https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/loadTexture.js) when the type is either `env-map` or `texture`. |

Returns a `key` that later you can use with `assets.get()`.

### assets.load({ renderer })

Load all the assets previously queued.

| Option     | Default | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| `renderer` |         | The WebGLRenderer of your application, exposed as `webgl.renderer`. |

### assets.loadSingle({ url, type, renderer, ...others })

Load a single asset without having to pass through the queue. Useful if you want to lazy-load some assets after the application has started. Usually the assets that are not needed immediately.

| Option            | Default      | Description                                                                                                                                                                                                                                                             |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderer`        |              | The WebGLRenderer of your application, exposed as `webgl.renderer`.                                                                                                                                                                                                     |
| `url`             |              | The url of the asset relative to the `public/` folder.                                                                                                                                                                                                                  |
| `type`            | autodetected | The type of the asset, can be either `gltf`, `image`, `svg`, `texture`, `env-map`, `json`, `audio` or `video`. If omitted it will be discerned from the asset extension.                                                                                                |
| `equirectangular` | false        | Only if you set `type: 'env-map'`, you can pass `equirectangular: true` if you have a single [equirectangular image](https://www.google.com/search?q=equirectangular+image&tbm=isch) rather than the six squared subimages.                                             |
| `pmrem`           | false        | Only if you set `type: 'env-map'`, you can pass `pmrem: true` to use the [PMREMGenerator](https://threejs.org/docs/#api/en/extras/PMREMGenerator) and prefilter for irradiance. This is often used when applying an envMap to an object rather than a scene background. |

| ...others | | Other options that get passed to [loadEnvMap](https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/loadEnvMap.js) or [loadTexture](https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/loadTexture.js) when the type is either `env-map` or `texture`. |

Returns a `key` that later you can use with `assets.get()`.

### assets.addProgressListener((progress) => {})

Pass a function that gets called each time an assets finishes downloading. The argument `progress` goes from 0 to 1, with 1 being every asset queued has been downloaded.

### assets.get(key)

Retrieve an asset previously loaded with `assets.load()` or `assets.loadSingle()`.

| Option | Default | Description                                                                                              |
| ------ | ------- | -------------------------------------------------------------------------------------------------------- |
| `key`  |         | The key returned from `assets.queue()` or `assets.loadSingle()`. It corresponds to the url of the asset. |

## Debug mode

Often you want to show the fps count or debug helpers such as the [SpotLightHelper](https://threejs.org/docs/#api/en/helpers/SpotLightHelper) only when you're developing or debugging.

A really manageable way is to have a global `window.DEBUG` constant which is true only if you append `?debug` to your url, for example `http://localhost:8080/?debug` or even in production like `https://example.com/?debug`.

This is done [here](https://github.com/marcofugaro/threejs-modern-app/blob/5f93ae32c378d9ea25a16f3fd813d04681c84815/src/index.js#L10) in just one line:

```js
window.DEBUG = window.location.search.includes('debug')
```

You could also add more global constants by just using more query-string parameters, like this `?debug&fps`.

## glslify

You can import shaders from `node_modules` with glslify, here is an example that uses [glsl-vignette](https://github.com/TyLindberg/glsl-vignette):

https://github.com/marcofugaro/threejs-modern-app/blob/master/src/scene/shaders/vignette.frag

For a list of shaders you can import check out [stack.gl packages list](http://stack.gl/packages/), more info on [glslify's readme](https://github.com/glslify/glslify).

## GPU Info

Sometimes it might be useful to enable expensive application configurationw only on higher-end devices.

This can be done by detecting the user's GPU and checking in which tier it belongs to based on its benchmark score.

This is done thanks to [detect-gpu](https://github.com/TimvanScherpenzeel/detect-gpu), more detailed info about its mechanics in its README.

For example, here is how to enable shadows only on high-tier devices:

```js
if (webgl.gpu.tier > 0) {
  webgl.renderer.shadowMap.enabled = true

  // soft shadows
  webgl.renderer.shadowMap.type = THREE.PCFSoftShadowMap
}
```

Here is what the exposed `webgl.gpu` object contains:

| Key        | Example Value     | Description                                                                                                                   |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tier`     | `1`               | The tier the GPU belongs to. It is incremental, so the higher the better. It goes from 0 to 3. Most GPUs belong to the Tier 1 |
| `isMobile` | `false`           | Wheter it is a mobile/tablet GPU, or a desktop GPU                                                                            |
| `name`     | `'Apple A11 GPU'` | The string name of the GPU                                                                                                    |

More info on this approach also in [this great talk](http://www.youtube.com/watch?v=iNMD8Vr1tKg&t=32m4s) by [luruke](https://github.com/luruke)

## Util functions

Often you will find yourself using some really common and useful math functions, such as `mapRange`, `lerp` or `noise`.

[canvas-sketch-util](https://github.com/mattdesl/canvas-sketch-util) is a library that contains a lot of those functions. It is written by [mattdesl](https://github.com/mattdesl).

For instance, here is how to use the `mapRange` funcion (also known as `map` in processing or `fit` in other softwares).

```js
import { mapRange } from 'canvas-sketch-util/math'

// ...

document.body.addEventListener('mousemove', (event) => {
  const angle = mapRange(event.clientX, 0, window.innerWidth, -90, 90)

  // ...
})
```

This example above will transform the x value from a `mousemove` event, which can go from `0` to `window.innerWidth`, to to a -90 and 90 range. You can assign this value to the rotation of an object which will rotate as you move the mouse.

## Hot reload

TODO

(find some use cases, maybe only the hot shader reload?)

Take a look at:
https://github.com/mattdesl/canvas-sketch/blob/1cefbcdf2c5302e74a6a84ff803ddbb377e473f5/docs/hot-reloading.md
https://github.com/mattdesl/shader-reload

# three-js-modern-app


![demo](http://test-webgl.surge.sh/?gui)

For a fullscreen three js app

It is inspired from mattdesl's three-js-app, but it was rewritten and simplified using es6 syntax




# threejs-app


- ThreeJS App with setup with render loop, camera, resize events, controls, tap events, GLTF loader, etc. global access to canvas, dat.gui, camera, app width & height, controls, etc
  Babel
- glslify to require shaders from node_modules
- an AssetManager & preloader to keep texture/GLTF/etc code clean and avoid promise/async helld, and also to preload textures and parse env maps
- a simple way to organize complex ThreeJS scenes:
  - build them out of smaller "components", where each component extends `THREE.Group` (same as  `THREE.Object3D`) or `THREE.Mesh`
  - functions like `update(dt, time)`, `onTouchStart(ev, pos)`, etc propagate through entire scene graph

At some point many of these tools will be published on npm or as self-contained scripts, making this whole thing a bit more convenient. Until then... enjoy the mess! :)

You can launch [localhost:9966/?debug](http://localhost:9966/?gui) to open dat.gui.







// SHADER RELOAD

## Usage

Clone, `npm install`, then:

```sh
# start development server
npm run start
```

Now open [localhost:9966](http://localhost:9966/) and start editing your source code. Edit the `honey.frag` or `honey.vert` to see it reloaded without losing application state.

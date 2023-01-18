import { EffectPass, VignetteEffect } from 'postprocessing'
import WebGLApp from './utils/WebGLApp'
import assets from './utils/AssetManager'
import Suzanne from './scene/Suzanne'
import { addNaturalLight } from './scene/lights'
import { addScreenshotButton, addRecordButton } from './screenshot-record-buttons'

// true if the url has the `?debug` parameter, otherwise false
window.DEBUG = window.location.search.includes('debug')

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  // set the scene background color
  background: '#111',
  backgroundAlpha: 1,
  // enable postprocessing
  postprocessing: true,
  // show the fps counter from stats.js
  showFps: window.DEBUG,
  // enable OrbitControls
  orbitControls: window.DEBUG,
  // show the GUI
  gui: window.DEBUG,
  // enable cannon-es
  // world: new CANNON.World(),
})

// attach it to the window to inspect in the console
if (window.DEBUG) {
  window.webgl = webgl
}

// hide canvas
webgl.canvas.style.visibility = 'hidden'

// load any queued assets
await assets.load({ renderer: webgl.renderer })

// add any "WebGL components" here...
// append them to the scene so you can
// use them from other components easily
webgl.scene.suzanne = new Suzanne(webgl)
webgl.scene.add(webgl.scene.suzanne)

// lights and other scene related stuff
addNaturalLight(webgl)

// postprocessing
// add an existing effect from the postprocessing library
webgl.composer.addPass(new EffectPass(webgl.camera, new VignetteEffect()))

// add the save screenshot and save gif buttons
if (window.DEBUG) {
  addScreenshotButton(webgl)
  addRecordButton(webgl)
}

// show canvas
webgl.canvas.style.visibility = ''

// start animation loop
webgl.start()

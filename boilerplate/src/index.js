import WebGLApp from './lib/WebGLApp'
import assets from './lib/AssetManager'
import Suzanne, { addNaturalLight } from './scene/Suzanne'

window.DEBUG = window.location.search.includes('debug')

// Grab our canvas
const canvas = document.querySelector('#main')

// Setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  backgroundAlpha: 0,
  alpha: true,
  showFps: window.DEBUG,
  orbitControls: window.DEBUG && { distance: 5 },
  // panelInputs: window.DEBUG && [],
  // world: new CANNON.World(),
  // tween: TWEEN,
})

// Attach it to the window to inspect in the console
if (window.DEBUG) {
  window.webgl = webgl
}

// Hide canvas
webgl.canvas.style.visibility = 'hidden'

// Load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  // Show canvas
  webgl.canvas.style.visibility = ''

  // Move the camera behind
  webgl.camera.position.set(0, 0, 5)

  // Add any "WebGL components" here...
  // Append them to the scene so you can
  // use them from other components easily
  webgl.scene.suzanne = new Suzanne({ webgl })
  webgl.scene.add(webgl.scene.suzanne)

  // lights and other scene related stuff
  addNaturalLight(webgl)

  // start animation loop
  webgl.start()
  webgl.draw()
})

import * as THREE from 'three'
import State from 'controls-state'
import { ShaderPass } from 'postprocessing'
import WebGLApp from './lib/WebGLApp'
import assets from './lib/AssetManager'
import Suzanne, { addScreenshotButton } from './scene/Suzanne'
import { addNaturalLight } from './scene/lights'
import passVert from './scene/shaders/pass.vert'
import vignetteFrag from './scene/shaders/vignette.frag'

window.DEBUG = window.location.search.includes('debug')

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  // enable transparency
  alpha: true,
  // set the scene background color
  background: '#111',
  backgroundAlpha: 1,
  // enable postprocessing
  postprocessing: true,
  // show the fps counter from stats.js
  showFps: window.DEBUG,
  // enable OrbitControls
  orbitControls: window.DEBUG,
  // Add the controls-gui inputs
  controls: {
    angularVelocity: State.Slider(0.1, {
      label: 'Angular Velocity',
      min: 0.01,
      max: 50,
      step: 0.01,
      mapping: (x) => Math.pow(10, x),
      inverseMapping: Math.log10,
    }),
  },
  hideControls: !window.DEBUG,
  // enable Cannon.js
  // world: new CANNON.World(),
})

// attach it to the window to inspect in the console
if (window.DEBUG) {
  window.webgl = webgl
}

// hide canvas
webgl.canvas.style.visibility = 'hidden'

// load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  // show canvas
  webgl.canvas.style.visibility = ''

  // add any "WebGL components" here...
  // append them to the scene so you can
  // use them from other components easily
  webgl.scene.suzanne = new Suzanne(webgl)
  webgl.scene.add(webgl.scene.suzanne)

  // lights and other scene related stuff
  addNaturalLight(webgl)

  // postprocessing
  const vignette = new ShaderPass(
    new THREE.ShaderMaterial({
      vertexShader: passVert,
      fragmentShader: vignetteFrag,
      uniforms: {
        tDiffuse: { type: 't', value: null },
      },
    }),
    'tDiffuse'
  )
  webgl.composer.addPass(vignette)

  // add the save screenshot button
  if (window.DEBUG) {
    addScreenshotButton(webgl)
  }

  // start animation loop
  webgl.start()
})

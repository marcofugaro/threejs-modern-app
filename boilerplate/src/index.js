import * as THREE from 'three'
import WebGLApp from './lib/WebGLApp'
import assets from './lib/AssetManager'
import Suzanne, {
  addNaturalLight,
  addScreenshotButton,
  DEFAULT_ANGULAR_VELOCITY,
} from './scene/Suzanne'
import { ShaderPass } from './lib/three/ShaderPass'
import passVert from './scene/shaders/pass.vert'
import vignetteFrag from './scene/shaders/vignette.frag'

window.DEBUG = window.location.search.includes('debug')

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  backgroundAlpha: 0,
  alpha: true,
  postprocessing: true,
  showFps: window.DEBUG,
  orbitControls: window.DEBUG && { distance: 5 },
  panelInputs: window.DEBUG && [
    {
      type: 'range',
      label: 'Angular Velocity',
      min: 0.1,
      max: 30,
      initial: DEFAULT_ANGULAR_VELOCITY,
      scale: 'log',
    },
  ],
  // world: new CANNON.World(),
  // tween: TWEEN,
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

  // move the camera behind
  webgl.camera.position.set(0, 0, 5)

  // add any "WebGL components" here...
  // append them to the scene so you can
  // use them from other components easily
  webgl.scene.suzanne = new Suzanne({ webgl })
  webgl.scene.add(webgl.scene.suzanne)

  // lights and other scene related stuff
  addNaturalLight(webgl)

  // postprocessing
  const vignette = new ShaderPass({
    vertexShader: passVert,
    fragmentShader: vignetteFrag,
    uniforms: {
      tDiffuse: { type: 't', value: new THREE.Texture() },
    },
  })
  webgl.composer.addPass(vignette)

  // add the save screenshot button
  if (window.DEBUG) {
    addScreenshotButton(webgl)
  }

  // start animation loop
  webgl.start()
  webgl.draw()
})

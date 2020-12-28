import * as THREE from 'three'
import State from 'controls-state'
import { ShaderPass, EffectPass, VignetteEffect } from 'postprocessing'
import WebGLApp from './lib/WebGLApp'
import assets from './lib/AssetManager'
import Suzanne, { addScreenshotButton } from './scene/Suzanne'
import { addNaturalLight } from './scene/lights'
import passVert from './scene/shaders/pass.vert'
import vignetteFrag from './scene/shaders/vignette.frag'
import { MotionBlurPass } from './lib/MotionBlurPass/MotionBlurPass'

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
  // enable gamma correction, read more about it here:
  // https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
  gamma: true,
  // enable postprocessing
  postprocessing: true,
  // clamping the pixel ratio gives us better performance for
  // heavy postprocessing effects, such as motion blur
  maxPixelRatio: 1,
  // show the fps counter from stats.js
  showFps: window.DEBUG,
  // enable OrbitControls
  orbitControls: window.DEBUG,
  // Add the controls-gui inputs
  controls: {
    angularVelocity: State.Slider(0.1, {
      label: 'Angular Velocity',
      min: 0.01,
      max: 30,
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
  // add an existing pass
  const motionBlurPass = new MotionBlurPass(webgl.scene, webgl.camera, {
    expandGeometry: 0.1,
    smearIntensity: 0.8,
    samples: 50,
    jitterStrategy: MotionBlurPass.REGULAR_JITTER,
    jitter: 3,
  })
  webgl.composer.addPass(motionBlurPass)

  // add a custom pass with custom shaders.
  // VignetteEffect exists in postprocessing,
  // this is just to show a pass with custom shaders
  // TODO replace this with monkeypatch shader and distortion
  // effects based on noise
  // const vignette = new ShaderPass(
  //   new THREE.ShaderMaterial({
  //     vertexShader: passVert,
  //     fragmentShader: vignetteFrag,
  //     uniforms: {
  //       tDiffuse: { type: 't', value: null },
  //       radius: { type: 't', value: 0.6 },
  //       smoothness: { type: 't', value: 0.5 },
  //     },
  //   }),
  //   'tDiffuse' // the input texture name
  // )
  // webgl.composer.addPass(vignette)

  webgl.composer.addPass(new EffectPass(webgl.camera, new VignetteEffect()))

  // add the save screenshot button
  if (window.DEBUG) {
    addScreenshotButton(webgl)
  }

  // start animation loop
  webgl.start()
})

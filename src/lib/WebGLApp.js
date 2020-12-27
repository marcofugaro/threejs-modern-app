import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import dataURIToBlob from 'datauritoblob'
import Stats from 'stats.js'
import State from 'controls-state'
import wrapGUI from 'controls-gui'
import { getGPUTier } from 'detect-gpu'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import CannonDebugRenderer from './CannonDebugRenderer'

export default class WebGLApp {
  #width
  #height
  isRunning = false
  time = 0
  #lastTime = performance.now()
  #updateListeners = []

  constructor({
    background = '#111',
    backgroundAlpha = 1,
    fov = 45,
    frustumSize = 3,
    near = 0.01,
    far = 100,
    ...options
  } = {}) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      // enabled for saving screenshots of the canvas,
      // may wish to disable this for perf reasons
      preserveDrawingBuffer: true,
      failIfMajorPerformanceCaveat: true,
      ...options,
    })
    if (options.sortObjects !== undefined) {
      this.renderer.sortObjects = options.sortObjects
    }
    if (options.gamma) {
      this.renderer.outputEncoding = THREE.sRGBEncoding
    }
    if (options.xr) {
      this.renderer.xr.enabled = true
    }

    this.canvas = this.renderer.domElement

    this.renderer.setClearColor(background, backgroundAlpha)

    // save the fixed dimensions
    this.#width = options.width
    this.#height = options.height

    // clamp pixel ratio for performance
    this.maxPixelRatio = options.maxPixelRatio || 2
    // clamp delta to stepping anything too far forward
    this.maxDeltaTime = options.maxDeltaTime || 1 / 30

    // setup the camera
    const aspect = this.#width / this.#height
    if (!options.orthographic) {
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    } else {
      this.camera = new THREE.OrthographicCamera(
        -(frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        near,
        far
      )
      this.camera.frustumSize = frustumSize
    }
    this.camera.position.copy(options.cameraPosition || new THREE.Vector3(0, 0, 4))
    this.camera.lookAt(0, 0, 0)

    this.scene = new THREE.Scene()

    this.gl = this.renderer.getContext()

    // handle resize events
    window.addEventListener('resize', this.resize)
    window.addEventListener('orientationchange', this.resize)

    // force an initial resize event
    this.resize()

    // __________________________ADDONS__________________________

    // really basic pointer events handler, the second argument
    // contains the x and y relative to the top left corner
    // of the canvas.
    // In case of touches with multiple fingers, only the
    // first touch is registered.
    this.isDragging = false
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) return
      this.isDragging = true
      // call onPointerDown method
      this.scene.traverse((child) => {
        if (typeof child.onPointerDown === 'function') {
          child.onPointerDown(event, { x: event.offsetX, y: event.offsetY })
        }
      })
    })
    this.canvas.addEventListener('pointermove', (event) => {
      if (!event.isPrimary) return
      // call onPointerMove method
      this.scene.traverse((child) => {
        if (typeof child.onPointerMove === 'function') {
          child.onPointerMove(event, { x: event.offsetX, y: event.offsetY })
        }
      })
    })
    this.canvas.addEventListener('pointerup', (event) => {
      if (!event.isPrimary) return
      this.isDragging = false
      // call onPointerUp method
      this.scene.traverse((child) => {
        if (typeof child.onPointerUp === 'function') {
          child.onPointerUp(event, { x: event.offsetX, y: event.offsetY })
        }
      })
    })

    // expose a composer for postprocessing passes
    if (options.postprocessing) {
      this.composer = new EffectComposer(this.renderer)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
    }

    // set up OrbitControls
    if (options.orbitControls) {
      this.orbitControls = new OrbitControls(this.camera, this.canvas)

      this.orbitControls.enableDamping = true
      this.orbitControls.dampingFactor = 0.15
      this.orbitControls.enablePan = false

      if (options.orbitControls instanceof Object) {
        Object.keys(options.orbitControls).forEach((key) => {
          this.orbitControls[key] = options.orbitControls[key]
        })
      }
    }

    // Attach the Cannon physics engine
    if (options.world) {
      this.world = options.world
      if (options.showWorldWireframes) {
        this.cannonDebugRenderer = new CannonDebugRenderer(this.scene, this.world)
      }
    }

    // show the fps meter
    if (options.showFps) {
      this.stats = new Stats()
      this.stats.showPanel(0)
      document.body.appendChild(this.stats.dom)
    }

    // initialize the controls-state
    if (options.controls) {
      const controlsState = State(options.controls)
      this.controls = options.hideControls
        ? controlsState
        : wrapGUI(controlsState, { expanded: !options.closeControls })

      // add the custom controls-gui styles
      if (!options.hideControls) {
        const styles = `
          [class^="controlPanel-"] [class*="__field"]::before {
            content: initial !important;
          }
          [class^="controlPanel-"] [class*="__labelText"] {
            text-indent: 6px !important;
          }
          [class^="controlPanel-"] [class*="__field--button"] > button::before {
            content: initial !important;
          }
        `
        const style = document.createElement('style')
        style.type = 'text/css'
        style.innerHTML = styles
        document.head.appendChild(style)
      }
    }

    // detect the gpu info
    this.loadGPUTier = getGPUTier({ glContext: this.gl }).then((gpuTier) => {
      this.gpu = {
        name: gpuTier.gpu,
        tier: gpuTier.tier,
        isMobile: gpuTier.isMobile,
        fps: gpuTier.fps,
      }
    })
  }

  get width() {
    return this.#width || window.innerWidth
  }

  get height() {
    return this.#height || window.innerHeight
  }

  get pixelRatio() {
    return Math.min(this.maxPixelRatio, window.devicePixelRatio)
  }

  resize = ({ width = this.width, height = this.height, pixelRatio = this.pixelRatio } = {}) => {
    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio)
    }

    // setup new size & update camera aspect if necessary
    this.renderer.setSize(width, height)
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height
    } else {
      const aspect = width / height
      this.camera.left = -(this.camera.frustumSize * aspect) / 2
      this.camera.right = (this.camera.frustumSize * aspect) / 2
      this.camera.top = this.camera.frustumSize / 2
      this.camera.bottom = -this.camera.frustumSize / 2
    }
    this.camera.updateProjectionMatrix()

    // resize also the composer
    if (this.composer) {
      this.composer.setSize(pixelRatio * width, pixelRatio * height)
    }

    // recursively tell all child objects to resize
    this.scene.traverse((obj) => {
      if (typeof obj.resize === 'function') {
        obj.resize({
          width,
          height,
          pixelRatio,
        })
      }
    })

    // draw a frame to ensure the new size has been registered visually
    this.draw()
    return this
  }

  // convenience function to trigger a PNG download of the canvas
  saveScreenshot = ({ width = 2560, height = 1440, fileName = 'Screenshot.png' } = {}) => {
    // force a specific output size
    this.resize({ width, height, pixelRatio: 1 })
    this.draw()

    const dataURI = this.canvas.toDataURL('image/png')

    // reset to default size
    this.resize()
    this.draw()

    // save
    saveDataURI(fileName, dataURI)
  }

  update = (dt, time, xrframe) => {
    if (this.orbitControls) {
      this.orbitControls.update()
    }

    // recursively tell all child objects to update
    this.scene.traverse((obj) => {
      if (typeof obj.update === 'function' && !obj.isTransformControls) {
        obj.update(dt, time, xrframe)
      }
    })

    if (this.world) {
      // update the Cannon physics engine
      this.world.step(1 / 60, dt)

      // update the debug wireframe renderer
      if (this.cannonDebugRenderer) {
        this.cannonDebugRenderer.update()
      }

      // recursively tell all child bodies to update
      this.world.bodies.forEach((body) => {
        if (typeof body.update === 'function') {
          body.update(dt, time)
        }
      })
    }

    // call the update listeners
    this.#updateListeners.forEach((fn) => fn(dt, time, xrframe))

    return this
  }

  onUpdate(fn) {
    this.#updateListeners.push(fn)
  }

  offUpdate(fn) {
    const index = this.#updateListeners.indexOf(fn)

    // return silently if the function can't be found
    if (index === -1) {
      return
    }

    this.#updateListeners.splice(index, 1)
  }

  draw = () => {
    if (this.composer) {
      // make sure to always render the last pass
      this.composer.passes.forEach((pass, i, passes) => {
        const isLastElement = i === passes.length - 1

        if (isLastElement) {
          pass.renderToScreen = true
        } else {
          pass.renderToScreen = false
        }
      })

      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
    return this
  }

  start = () => {
    if (this.isRunning) return
    this.renderer.setAnimationLoop(this.animate)
    this.isRunning = true
    return this
  }

  stop = () => {
    if (!this.isRunning) return
    this.renderer.setAnimationLoop(null)
    this.isRunning = false
    return this
  }

  animate = (now, xrframe) => {
    if (!this.isRunning) return

    if (this.stats) this.stats.begin()

    const dt = Math.min(this.maxDeltaTime, (now - this.#lastTime) / 1000)
    this.time += dt
    this.#lastTime = now
    this.update(dt, this.time, xrframe)
    this.draw()

    if (this.stats) this.stats.end()
  }

  get cursor() {
    return this.canvas.style.cursor
  }

  set cursor(cursor) {
    if (cursor) {
      this.canvas.style.cursor = cursor
    } else {
      this.canvas.style.cursor = null
    }
  }
}

function saveDataURI(name, dataURI) {
  const blob = dataURIToBlob(dataURI)

  // force download
  const link = document.createElement('a')
  link.download = name
  link.href = window.URL.createObjectURL(blob)
  link.onclick = setTimeout(() => {
    window.URL.revokeObjectURL(blob)
    link.removeAttribute('href')
  }, 0)

  link.click()
}

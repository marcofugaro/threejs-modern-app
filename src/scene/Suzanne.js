import * as THREE from 'three'
import assets from '../lib/AssetManager'

// elaborated three.js component example
// containing example usage of
//   - asset manager
//   - control panel
//   - touch events
//   - postprocessing
//   - screenshot saving

// preload the suzanne model
const suzanneKey = assets.queue({
  url: 'assets/suzanne.gltf',
  type: 'gltf',
})

// preload the materials
const albedoKey = assets.queue({
  url: 'assets/spotty-metal/albedo.jpg',
  type: 'texture',
})
const metalnessKey = assets.queue({
  url: 'assets/spotty-metal/metalness.jpg',
  type: 'texture',
})
const roughnessKey = assets.queue({
  url: 'assets/spotty-metal/roughness.jpg',
  type: 'texture',
})
const normalKey = assets.queue({
  url: 'assets/spotty-metal/normal.jpg',
  type: 'texture',
})

// preload the environment map
const hdrKey = assets.queue({
  url: 'assets/ouside-afternoon-blurred-hdr.jpg',
  type: 'env-map',
  // equirectangular means it's just one image, projected
  equirectangular: true,
})

export default class Suzanne extends THREE.Group {
  constructor(webgl, options) {
    super(options)
    this.webgl = webgl
    this.options = options

    const suzanneGltf = assets.get(suzanneKey)
    const suzanne = suzanneGltf.scene.clone()

    const material = new THREE.MeshStandardMaterial({
      map: assets.get(albedoKey),
      metalnessMap: assets.get(metalnessKey),
      roughnessMap: assets.get(roughnessKey),
      normalMap: assets.get(normalKey),
      normalScale: new THREE.Vector2(2, 2),
      envMap: assets.get(hdrKey).texture,
      roughness: 0.5,
      metalness: 0.8,
    })

    // apply the material to the model
    suzanne.traverse((child) => {
      if (child.isMesh) {
        child.material = material
      }
    })

    // make it a little bigger
    suzanne.scale.multiplyScalar(1.2)

    this.add(suzanne)

    // set the background as the hdr
    this.webgl.scene.background = assets.get(hdrKey)
  }

  onPointerDown(event, [x, y]) {
    // for example, check of we clicked on an
    // object with raycasting
    const coords = new THREE.Vector2().set(
      (x / this.webgl.width) * 2 - 1,
      (-y / this.webgl.height) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(coords, this.webgl.camera)
    const hits = raycaster.intersectObject(this, true)
    console.log(hits.length > 0 ? `Hit ${hits[0].object.name}!` : 'No hit')
  }

  onPointerMove(event, [x, y]) {}

  onPointerUp(event, [x, y]) {}

  update(dt, time) {
    this.rotation.y += dt * this.webgl.controls.angularVelocity
  }
}

// demo the save screenshot feature
export function addScreenshotButton(webgl) {
  const screenshotButton = document.createElement('div')

  // normally the styles would be in style.css
  screenshotButton.style.position = 'fixed'
  screenshotButton.style.bottom = 0
  screenshotButton.style.right = 0
  screenshotButton.style.background = 'tomato'
  screenshotButton.style.cursor = 'pointer'
  screenshotButton.style.padding = '8px 16px'
  screenshotButton.style.color = 'white'
  screenshotButton.style.fontSize = '24px'

  screenshotButton.textContent = 'Save screenshot'
  document.body.appendChild(screenshotButton)
  screenshotButton.addEventListener('click', webgl.saveScreenshot)
}

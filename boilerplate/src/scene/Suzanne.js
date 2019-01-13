import * as THREE from 'three'
import assets from 'lib/AssetManager'

// preload the suzanne head
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
  constructor({ webgl, ...options }) {
    super(options)
    this.webgl = webgl

    const suzanneGltf = assets.get(suzanneKey)
    const suzanne = suzanneGltf.scene

    const material = new THREE.MeshStandardMaterial({
      map: assets.get(albedoKey),
      metalnessMap: assets.get(metalnessKey),
      roughnessMap: assets.get(roughnessKey),
      normalMap: assets.get(normalKey),
      normalScale: new THREE.Vector2(3, 3),
      envMap: assets.get(hdrKey),
      envMapIntensity: 1,
    })

    // apply the material to the model
    suzanne.traverse(child => {
      if (child.isMesh) {
        child.material = material
      }
    })

    // make it a little bigger
    suzanne.scale.multiplyScalar(1.2)

    this.add(suzanne)

    // set the background as the hdr
    webgl.scene.background = assets.get(hdrKey).renderTarget
  }

  update(dt = 0, time = 0) {
    this.rotation.y += dt * 0.5
  }
}

// natural hemisphere light from
// https://threejs.org/examples/#webgl_lights_hemisphere
export function addNaturalLight(webgl) {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6)
  hemiLight.color.setHSL(0.6, 1, 0.6)
  hemiLight.groundColor.setHSL(0.095, 1, 0.75)
  hemiLight.position.set(0, 50, 0)
  webgl.scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.color.setHSL(0.1, 1, 0.95)
  dirLight.position.set(3, 5, 1)
  dirLight.position.multiplyScalar(50)
  webgl.scene.add(dirLight)

  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048

  var d = 50
  dirLight.shadow.camera.left = -d
  dirLight.shadow.camera.right = d
  dirLight.shadow.camera.top = d
  dirLight.shadow.camera.bottom = -d
  dirLight.shadow.camera.far = 3500
  dirLight.shadow.bias = -0.0001
}

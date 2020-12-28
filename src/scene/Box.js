import * as THREE from 'three'

// basic three.js component example

export default class Box extends THREE.Group {
  constructor(webgl, options = {}) {
    super(options)
    // these can be used also in other methods
    this.webgl = webgl
    this.options = options

    // destructure and default values like you do in React
    const { color = 0x00ff00 } = this.options

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color, wireframe: true })
    this.box = new THREE.Mesh(geometry, material)

    // add it to the group,
    // later the group will be added to the scene
    this.add(this.box)
  }

  update(dt, time) {
    this.box.rotation.y += dt * 0.5
  }
}

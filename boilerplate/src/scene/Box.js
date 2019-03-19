import * as THREE from 'three'

// basic three.js component example

export default class Box extends THREE.Group {
  constructor({ webgl, ...options }) {
    super(options)
    this.webgl = webgl

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    this.box = new THREE.Mesh(geometry, material)

    // add it to the group,
    // later the group will be added to the scene
    this.add(this.box)
  }

  update(dt, time) {
    this.box.rotation.y += dt * 0.5
  }
}

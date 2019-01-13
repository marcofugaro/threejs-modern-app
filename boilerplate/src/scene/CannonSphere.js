import * as THREE from 'three'
import CANNON from 'cannon'

// remember to add the body to the CANNON world and
// the mesh to the three js scene or some component
//
//   const sphere = new CannonSphere({ radius: 1, webgl })
//   webgl.world.addBody(sphere)
//   webgl.scene.add(sphere.mesh)

export default class CannonSphere extends CANNON.Body {
  mesh = new THREE.Group()

  constructor({ webgl, radius, ...options }) {
    super(options)
    this.webgl = webgl

    this.addShape(new CANNON.Sphere(radius))

    // show bounding sphere only while debugging,
    // usually you show another object in the scene
    if (window.DEBUG) {
      this.mesh.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(radius, 32, 32),
          new THREE.MeshLambertMaterial({ color: Math.random() * 0xfffff }),
        ),
      )
    }

    // sync the position the first time
    this.update()
  }

  update(dt = 0, time = 0) {
    // sync the mesh to the physical body
    this.mesh.position.copy(this.position)
    this.mesh.quaternion.copy(this.quaternion)
  }
}

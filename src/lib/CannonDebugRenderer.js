/* eslint-disable no-underscore-dangle */
import * as THREE from 'three'
import CANNON from 'cannon'

/**
 * Adds Three.js primitives into the scene where all the Cannon bodies and shapes are.
 * @class CannonDebugRenderer
 * @param {THREE.Scene} scene
 * @param {CANNON.World} world
 */

export default class CannonDebugRenderer {
  tmpVec0 = new CANNON.Vec3()
  tmpVec1 = new CANNON.Vec3()
  tmpVec2 = new CANNON.Vec3()
  tmpQuat0 = new CANNON.Vec3()

  constructor(scene, world) {
    this.scene = scene
    this.world = world

    this._meshes = []

    this._material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    this._sphereGeometry = new THREE.SphereGeometry(1)
    this._boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10)
    this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10)
  }

  update() {
    const { bodies } = this.world
    const meshes = this._meshes
    const shapeWorldPosition = this.tmpVec0
    const shapeWorldQuaternion = this.tmpQuat0

    let meshIndex = 0

    for (let i = 0; i !== bodies.length; i++) {
      const body = bodies[i]

      for (let j = 0; j !== body.shapes.length; j++) {
        const shape = body.shapes[j]

        this._updateMesh(meshIndex, body, shape)

        const mesh = meshes[meshIndex]

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition)
          body.position.vadd(shapeWorldPosition, shapeWorldPosition)

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion)

          // Copy to meshes
          mesh.position.copy(shapeWorldPosition)
          mesh.quaternion.copy(shapeWorldQuaternion)

          // Change the visiblity
          if ('visible' in body) {
            mesh.visible = body.visible
          }
        }

        meshIndex += 1
      }
    }

    for (let i = meshIndex; i < meshes.length; i++) {
      const mesh = meshes[i]
      if (mesh) {
        this.scene.remove(mesh)
      }
    }

    meshes.length = meshIndex
  }

  _updateMesh(index, body, shape) {
    let mesh = this._meshes[index]
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh)
      }
      mesh = this._meshes[index] = this._createMesh(shape)
    }
    this._scaleMesh(mesh, shape)
  }

  _createMesh(shape) {
    let mesh
    const material = this._material

    const geo = new THREE.Geometry()

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        mesh = new THREE.Mesh(this._sphereGeometry, material)
        break

      case CANNON.Shape.types.BOX:
        mesh = new THREE.Mesh(this._boxGeometry, material)
        break

      case CANNON.Shape.types.PLANE:
        mesh = new THREE.Mesh(this._planeGeometry, material)
        break

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        // Create mesh

        // Add vertices
        for (let i = 0; i < shape.vertices.length; i++) {
          const v = shape.vertices[i]
          geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z))
        }

        for (let i = 0; i < shape.faces.length; i++) {
          const face = shape.faces[i]

          // add triangles
          const a = face[0]
          for (let j = 1; j < face.length - 1; j++) {
            const b = face[j]
            const c = face[j + 1]
            geo.faces.push(new THREE.Face3(a, b, c))
          }
        }
        geo.computeBoundingSphere()
        geo.computeFaceNormals()

        mesh = new THREE.Mesh(geo, material)
        shape.geometryId = geo.id
        break

      case CANNON.Shape.types.TRIMESH:
        for (let i = 0; i < shape.indices.length / 3; i++) {
          shape.getTriangleVertices(i, this.tmpVec0, this.tmpVec1, this.tmpVec2)
          geo.vertices.push(
            new THREE.Vector3(this.tmpVec0.x, this.tmpVec0.y, this.tmpVec0.z),
            new THREE.Vector3(this.tmpVec1.x, this.tmpVec1.y, this.tmpVec1.z),
            new THREE.Vector3(this.tmpVec2.x, this.tmpVec2.y, this.tmpVec2.z)
          )
          const j = geo.vertices.length - 3
          geo.faces.push(new THREE.Face3(j, j + 1, j + 2))
        }
        geo.computeBoundingSphere()
        geo.computeFaceNormals()
        mesh = new THREE.Mesh(geo, material)
        shape.geometryId = geo.id
        break

      case CANNON.Shape.types.HEIGHTFIELD:
        for (let xi = 0; xi < shape.data.length - 1; xi++) {
          for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
            for (let k = 0; k < 2; k++) {
              shape.getConvexTrianglePillar(xi, yi, k === 0)
              this.tmpVec0.copy(shape.pillarConvex.vertices[0])
              this.tmpVec1.copy(shape.pillarConvex.vertices[1])
              this.tmpVec2.copy(shape.pillarConvex.vertices[2])
              this.tmpVec0.vadd(shape.pillarOffset, this.tmpVec0)
              this.tmpVec1.vadd(shape.pillarOffset, this.tmpVec1)
              this.tmpVec2.vadd(shape.pillarOffset, this.tmpVec2)
              geo.vertices.push(
                new THREE.Vector3(this.tmpVec0.x, this.tmpVec0.y, this.tmpVec0.z),
                new THREE.Vector3(this.tmpVec1.x, this.tmpVec1.y, this.tmpVec1.z),
                new THREE.Vector3(this.tmpVec2.x, this.tmpVec2.y, this.tmpVec2.z)
              )
              const ii = geo.vertices.length - 3
              geo.faces.push(new THREE.Face3(ii, ii + 1, ii + 2))
            }
          }
        }
        geo.computeBoundingSphere()
        geo.computeFaceNormals()
        mesh = new THREE.Mesh(geo, material)
        shape.geometryId = geo.id
        break
      default:
        break
    }

    if (mesh) {
      this.scene.add(mesh)
    }

    return mesh
  }

  _typeMatch(mesh, shape) {
    if (!mesh) {
      return false
    }
    const geo = mesh.geometry
    return (
      (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
    )
  }

  _scaleMesh(mesh, shape) {
    const { radius } = shape

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        mesh.scale.set(radius, radius, radius)
        break

      case CANNON.Shape.types.BOX:
        mesh.scale.copy(shape.halfExtents)
        mesh.scale.multiplyScalar(2)
        break

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        mesh.scale.set(1, 1, 1)
        break

      case CANNON.Shape.types.TRIMESH:
        mesh.scale.copy(shape.scale)
        break

      case CANNON.Shape.types.HEIGHTFIELD:
        mesh.scale.set(1, 1, 1)
        break
      default:
        break
    }
  }
}

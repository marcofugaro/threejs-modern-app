import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'

export default function loadGLTF(url, options = {}) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    if (options.meshOpt) {
      loader.setMeshoptDecoder(MeshoptDecoder)
    } else if (options.draco) {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
      loader.setDRACOLoader(dracoLoader)
    }

    loader.load(url, resolve, null, (err) =>
      reject(new Error(`Could not load GLTF asset ${url}:\n${err}`))
    )
  })
}

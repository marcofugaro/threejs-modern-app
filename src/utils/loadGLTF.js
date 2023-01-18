import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

export default function loadGLTF(url, options = {}) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    if (options.draco) {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
      loader.setDRACOLoader(dracoLoader)
    }

    loader.load(url, resolve, null, (err) =>
      reject(new Error(`Could not load GLTF asset ${url}:\n${err}`))
    )
  })
}

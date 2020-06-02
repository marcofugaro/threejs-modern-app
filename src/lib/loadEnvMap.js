// Inspiration for this code goes to Matt DesLauriers @mattdesl,
// really awesome dude, give him a follow!
// https://github.com/mattdesl/threejs-app/blob/master/src/util/loadEnvMap.js
import * as THREE from 'three'
import highestPowerOfTwo from 'highest-power-two'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader'
import loadTexture from './loadTexture'

export default async function loadEnvMap(url, options) {
  const renderer = options.renderer

  if (!renderer) {
    throw new Error(`Env map requires renderer to passed in the options for ${url}!`)
  }

  if (options.equirectangular) {
    const texture = await loadTexture(url, { renderer })

    if (options.pmrem) {
      return pmremEquirectangular(texture, renderer)
    } else {
      const size = highestPowerOfTwo(texture.image.naturalHeight)
      const renderTarget = new THREE.WebGLCubeRenderTarget(size, {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
      })

      const outTexture = renderTarget.fromEquirectangularTexture(renderer, texture)

      texture.dispose() // dispose original texture
      texture.image.data = null // remove image reference

      return outTexture
    }
  }

  const basePath = url
  const extension = options.extension || '.jpg'
  const urls = generateCubeUrls(`${basePath.replace(/\/$/, '')}/`, extension)

  if (extension === '.hdr') {
    // load a float HDR texture
    return new Promise((resolve, reject) => {
      new HDRCubeTextureLoader().load(
        THREE.UnsignedByteType,
        urls,
        (cubeMap) => resolve(assignCubemapOptions(cubeMap, options)),
        null,
        () => reject(new Error(`Could not load env map: ${basePath}`))
      )
    })
  }

  // load a RGBM encoded texture
  return new Promise((resolve, reject) => {
    new THREE.CubeTextureLoader().load(
      urls,
      (cubeMap) => resolve(assignCubemapOptions(cubeMap, options)),
      null,
      () => reject(new Error(`Could not load env map: ${basePath}`))
    )
  })
}

function assignCubemapOptions(cubeMap, options) {
  if (options.encoding) {
    cubeMap.encoding = options.encoding
  }
  if (options.format) {
    cubeMap.format = options.format
  }
  if (options.pmrem) {
    cubeMap = pmremCubemap(cubeMap, options.renderer)
  }
  return cubeMap
}

// prefilter the environment map for irradiance
function pmremEquirectangular(texture, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const cubeRenderTarget = pmremGenerator.fromEquirectangular(texture)

  pmremGenerator.dispose() // dispose PMREMGenerator
  texture.dispose() // dispose original texture
  texture.image.data = null // remove image reference

  return cubeRenderTarget.texture
}

// prefilter the environment map for irradiance
function pmremCubemap(cubeMap, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileCubemapShader()
  const renderTarget = pmremGenerator.fromCubemap(cubeMap)

  pmremGenerator.dispose() // dispose PMREMGenerator
  cubeMap.dispose() // dispose original texture
  cubeMap.image.data = null // remove image reference

  return renderTarget.texture
}

function generateCubeUrls(prefix, postfix) {
  return [
    `${prefix}px${postfix}`,
    `${prefix}nx${postfix}`,
    `${prefix}py${postfix}`,
    `${prefix}ny${postfix}`,
    `${prefix}pz${postfix}`,
    `${prefix}nz${postfix}`,
  ]
}

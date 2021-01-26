import * as THREE from 'three'
// TODO lazy load these, or put them in different files
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader'

export default function loadEnvMap(url, { renderer, ...options }) {
  if (!renderer) {
    throw new Error(`Env map requires renderer to passed in the options for ${url}!`)
  }

  const isEquirectangular = !Array.isArray(url)

  let loader
  if (isEquirectangular) {
    const extension = url.slice(url.lastIndexOf('.') + 1)

    switch (extension) {
      case 'hdr': {
        loader = new RGBELoader().setDataType(THREE.UnsignedByteType).loadAsync(url)
        break
      }
      case 'exr': {
        loader = new EXRLoader().setDataType(THREE.UnsignedByteType).loadAsync(url)
        break
      }
      case 'png':
      case 'jpg': {
        loader = new THREE.TextureLoader().loadAsync(url).then((texture) => {
          if (renderer.outputEncoding === THREE.sRGBEncoding && !options.linear) {
            texture.encoding = THREE.sRGBEncoding
          }
          return texture
        })
        break
      }
      default: {
        throw new Error(`Extension ${extension} not supported`)
      }
    }

    loader = loader.then((texture) => {
      if (options.pmrem) {
        return equirectangularToPMREMCube(texture, renderer)
      } else {
        return equirectangularToCube(texture)
      }
    })
  } else {
    const extension = url[0].slice(url.lastIndexOf('.') + 1)

    switch (extension) {
      case 'hdr': {
        loader = new HDRCubeTextureLoader().setDataType(THREE.UnsignedByteType).loadAsync(url)
        break
      }
      case 'png':
      case 'jpg': {
        loader = new THREE.CubeTextureLoader().loadAsync(url).then((texture) => {
          if (renderer.outputEncoding === THREE.sRGBEncoding && !options.linear) {
            texture.encoding = THREE.sRGBEncoding
          }
          return texture
        })
        break
      }
      default: {
        throw new Error(`Extension ${extension} not supported`)
      }
    }

    loader = loader.then((texture) => {
      if (options.pmrem) {
        return cubeToPMREMCube(texture, renderer)
      } else {
        return texture
      }
    })
  }

  // apply eventual texture options, such as wrap, repeat...
  const textureOptions = Object.keys(options).filter(
    (option) => !['pmrem', 'linear'].includes(option)
  )
  textureOptions.forEach((option) => {
    loader = loader.then((texture) => {
      texture[option] = options[option]
      return texture
    })
  })

  return loader
}

// prefilter the equirectangular environment map for irradiance
function equirectangularToPMREMCube(texture, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const cubeRenderTarget = pmremGenerator.fromEquirectangular(texture)

  pmremGenerator.dispose() // dispose PMREMGenerator
  texture.dispose() // dispose original texture
  texture.image.data = null // remove image reference

  return cubeRenderTarget.texture
}

// prefilter the cubemap environment map for irradiance
function cubeToPMREMCube(texture, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileCubemapShader()

  const cubeRenderTarget = pmremGenerator.fromCubemap(texture)

  pmremGenerator.dispose() // dispose PMREMGenerator
  texture.dispose() // dispose original texture
  texture.image.data = null // remove image reference

  return cubeRenderTarget.texture
}

// transform an equirectangular texture to a cubetexture that
// can be used as an envmap or scene background
function equirectangularToCube(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping
  return texture
}

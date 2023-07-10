import {
  CubeTextureLoader,
  EquirectangularReflectionMapping,
  PMREMGenerator,
  SRGBColorSpace,
  TextureLoader,
  UnsignedByteType,
} from 'three'
// TODO lazy load these, or put them in different files
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js'

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
        loader = new RGBELoader().setDataType(UnsignedByteType).loadAsync(url)
        break
      }
      case 'exr': {
        loader = new EXRLoader().setDataType(UnsignedByteType).loadAsync(url)
        break
      }
      case 'png':
      case 'jpg': {
        loader = new TextureLoader().loadAsync(url).then((texture) => {
          if (renderer.outputColorSpace === SRGBColorSpace && options.gamma) {
            texture.colorSpace = SRGBColorSpace
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
        loader = new HDRCubeTextureLoader().setDataType(UnsignedByteType).loadAsync(url)
        break
      }
      case 'png':
      case 'jpg': {
        loader = new CubeTextureLoader().loadAsync(url).then((texture) => {
          if (renderer.outputColorSpace === SRGBColorSpace && options.gamma) {
            texture.colorSpace = SRGBColorSpace
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
  const pmremGenerator = new PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const cubeRenderTarget = pmremGenerator.fromEquirectangular(texture)

  pmremGenerator.dispose() // dispose PMREMGenerator
  texture.dispose() // dispose original texture
  texture.image.data = null // remove image reference

  return cubeRenderTarget.texture
}

// prefilter the cubemap environment map for irradiance
function cubeToPMREMCube(texture, renderer) {
  const pmremGenerator = new PMREMGenerator(renderer)
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
  texture.mapping = EquirectangularReflectionMapping
  return texture
}

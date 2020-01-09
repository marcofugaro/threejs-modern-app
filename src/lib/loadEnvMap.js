// Inspiration for this code goes to Matt DesLauriers @mattdesl,
// really awesome dude, give him a follow!
// https://github.com/mattdesl/threejs-app/blob/master/src/util/loadEnvMap.js
import * as THREE from 'three'
import clamp from 'lodash/clamp'
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader'
import loadTexture from './loadTexture'

export default async function loadEnvMap(url, options) {
  const renderer = options.renderer

  if (!renderer) {
    throw new Error(`PBR Map requires renderer to passed in the options for ${url}!`)
  }

  if (options.equirectangular) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const texture = await loadTexture(url, { renderer })

    const cubeRenderTarget = pmremGenerator.fromEquirectangular(texture)

    pmremGenerator.dispose() // dispose PMREMGenerator
    texture.dispose() // dispose original texture
    texture.image.data = null // remove image reference

    return cubeRenderTarget.texture
  }

  const basePath = url

  const isHDR = options.hdr
  const extension = isHDR ? '.hdr' : '.png'
  const urls = genCubeUrls(`${basePath.replace(/\/$/, '')}/`, extension)

  if (isHDR) {
    // load a float HDR texture
    return new Promise((resolve, reject) => {
      new HDRCubeTextureLoader().load(
        THREE.UnsignedByteType,
        urls,
        map => resolve(buildCubeMap(map, options)),
        null,
        () => reject(new Error(`Could not load PBR map: ${basePath}`))
      )
    })
  }

  // load a RGBM encoded texture
  return new Promise((resolve, reject) => {
    new THREE.CubeTextureLoader().load(
      urls,
      cubeMap => {
        cubeMap.encoding = THREE.RGBM16Encoding
        resolve(buildCubeMap(cubeMap, options))
      },
      null,
      () => reject(new Error(`Could not load PBR map: ${basePath}`))
    )
  })
}

function buildCubeMap(cubeMap, options) {
  if (options.pbr || typeof options.level === 'number') {
    // prefilter the environment map for irradiance
    const pmremGenerator = new THREE.PMREMGenerator(cubeMap)
    pmremGenerator.compileCubemapShader()
    if (options.pbr) {
      const target = pmremGenerator.fromCubemap(cubeMap)
      cubeMap = target.texture
    } else {
      const idx = clamp(Math.floor(options.level), 0, pmremGenerator.cubeLods.length)
      cubeMap = pmremGenerator.cubeLods[idx].texture
    }
    pmremGenerator.dispose()
  }
  if (options.mapping) cubeMap.mapping = options.mapping
  return cubeMap
}

function genCubeUrls(prefix, postfix) {
  return [
    `${prefix}px${postfix}`,
    `${prefix}nx${postfix}`,
    `${prefix}py${postfix}`,
    `${prefix}ny${postfix}`,
    `${prefix}pz${postfix}`,
    `${prefix}nz${postfix}`,
  ]
}

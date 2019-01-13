// Inspiration for this class goes to Matt DesLauriers @mattdesl,
// really awesome dude, give him a follow!
// https://github.com/mattdesl/threejs-app/blob/master/src/util/AssetManager.js
import pMap from 'p-map'
import prettyMs from 'pretty-ms'
import loadImage from 'image-promise'
// TODO import the GLTFLoader from three.js when this issue will be solved
// https://github.com/mrdoob/three.js/issues/9562
import { GLTFLoader } from './three/GLTFLoader'
import loadTexture from './loadTexture'
import loadEnvMap from './loadEnvMap'

class AssetManager {
  #queue = []
  #cache = {}
  #onProgressListeners = []
  #asyncConcurrency = 10

  addProgressListener(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('onProgress must be a function')
    }
    this.#onProgressListeners.push(fn)
  }

  // Add an asset to be queued, input: { url, type, ...options }
  queue({ url, type, ...options }) {
    if (!url) throw new TypeError('Must specify a URL or opt.url for AssetManager#queue()')

    if (!this._getQueued(url)) {
      this.#queue.push({ url, type: type || this._extractType(url), ...options })
    }

    return url
  }

  _getQueued(url) {
    return this.#queue.find(item => item.url === url)
  }

  _extractType(url) {
    const ext = url.slice(url.lastIndexOf('.'))

    switch (true) {
      case /\.(gltf|glb)$/i.test(ext):
        return 'gltf'
      case /\.json$/i.test(ext):
        return 'json'
      case /\.svg$/i.test(ext):
        return 'svg'
      case /\.(jpe?g|png|gif|bmp|tga|tif)$/i.test(ext):
        return 'image'
      case /\.(wav|mp3)$/i.test(ext):
        return 'audio'
      case /\.(mp4|webm|ogg|ogv)$/i.test(ext):
        return 'video'
      default:
        throw new Error(`Could not load ${url}, unknown file extension!`)
    }
  }

  // Fetch a loaded asset by URL
  get = url => {
    if (!url) throw new TypeError('Must specify an URL for AssetManager#get()')
    if (!(url in this.#cache)) {
      throw new Error(`Could not find an asset by the URL ${url}`)
    }

    return this.#cache[url]
  }

  // Loads a single asset
  async loadSingle({ renderer, ...item }) {
    // renderer is used to load textures and env maps,
    // but require it always since it is an extensible pattern
    if (!renderer) {
      throw new Error('You must provide a renderer to the load function')
    }

    try {
      this.#cache[item.url] = await this._loadItem({ renderer, ...item })
    } catch (err) {
      delete this.#cache[item.url]
      console.error(`[📦 assets] Skipping ${item.url} from asset loading: \n${err}`)
    }
  }

  // Loads all queued assets
  async load({ renderer }) {
    // renderer is used to load textures and env maps,
    // but require it always since it is an extensible pattern
    if (!renderer) {
      throw new Error('You must provide a renderer to the load function')
    }

    const queue = this.#queue.slice()
    this.#queue.length = 0 // clear queue

    const total = queue.length
    if (total === 0) {
      // resolve first this functions and then call the progress listeners
      setTimeout(() => this.#onProgressListeners.forEach(fn => fn(1)), 0)
      return
    }

    if (window.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(`[📦 assets] ⏱ Start loading of ${total} queued items`)
      this.loadingStart = Date.now()
    }

    await pMap(
      queue,
      async (item, i) => {
        try {
          this.#cache[item.url] = await this._loadItem({ renderer, ...item })
        } catch (err) {
          delete this.#cache[item.url]
          console.error(`[📦 assets] Skipping ${item.url} from asset loading: \n${err}`)
        }

        const percent = (i + 1) / total
        this.#onProgressListeners.forEach(fn => fn(percent))
      },
      { concurrency: this.#asyncConcurrency },
    )

    if (window.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(`[📦 assets] ⏱ Assets loaded in ${prettyMs(Date.now() - this.loadingStart)}`)
    }
  }

  // Loads a single asset on demand, returning from
  // cache if it exists otherwise adding it to the cache
  // after loading.
  async _loadItem({ url, type, renderer, ...options }) {
    if (url in this.#cache) {
      return this.#cache[url]
    }

    if (window.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(`[📦 assets] Loading ${url}`)
    }

    switch (type) {
      case 'gltf':
        return new Promise((resolve, reject) => {
          new GLTFLoader().load(url, resolve, null, err =>
            reject(new Error(`Could not load GLTF asset ${url}. ${err}`)),
          )
        })
      case 'json':
        return fetch(url).then(response => response.json())
      case 'env-map':
        return loadEnvMap(url, { renderer, ...options })
      case 'svg':
      case 'image':
        return loadImage(url, { crossorigin: 'anonymous' })
      case 'texture':
        return loadTexture(url, { renderer, ...options })
      case 'audio':
        // You might not want to load big audio files and
        // store them in memory, that might be inefficient.
        // Rather load them outside of the queue
        return fetch(url).then(response => response.arrayBuffer())
      case 'video':
        // You might not want to load big video files and
        // store them in memory, that might be inefficient.
        // Rather load them outside of the queue
        return fetch(url).then(response => response.blob())
      default:
        throw new Error(`Could not load ${url}, the type ${type} is unknown!`)
    }
  }
}

// asset manager is a singleton, you can require it from
// different files and use the same instance.
// A plain js object would have worked just fine,
// fucking java patterns
export default new AssetManager()

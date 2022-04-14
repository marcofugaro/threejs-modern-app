import pMap from 'p-map'
import prettyMs from 'pretty-ms'
import loadImage from 'image-promise'
import omit from 'lodash/omit'
import loadTexture from './loadTexture'
import loadEnvMap from './loadEnvMap'
import loadGLTF from './loadGLTF'

class AssetManager {
  #queue = []
  #loaded = {}
  #onProgressListeners = []
  #asyncConcurrency = 10
  #logs = []

  addProgressListener(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('onProgress must be a function')
    }
    this.#onProgressListeners.push(fn)
  }

  // Add an asset to be queued, input: { url, type, ...options }
  queue({ url, type, ...options }) {
    if (!url) throw new TypeError('Must specify a URL or opt.url for AssetManager.queue()')

    const queued = this._getQueued(url)
    if (queued) {
      // if it's already present, add only if the options are different
      const queuedOptions = omit(queued, ['url', 'type'])
      if (JSON.stringify(options) !== JSON.stringify(queuedOptions)) {
        const hash = performance.now().toFixed(3).replace('.', '')
        const key = `${url}.${hash}`
        this.#queue.push({ key, url, type: type || this._extractType(url), ...options })
        return key
      }

      return queued.url
    }

    this.#queue.push({ url, type: type || this._extractType(url), ...options })
    return url
  }

  _getQueued(url) {
    return this.#queue.find((item) => item.url === url)
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
  get = (key) => {
    if (!key) throw new TypeError('Must specify an URL for AssetManager.get()')

    return this.#loaded[key]
  }

  // Loads a single asset on demand.
  async loadSingle({ renderer, ...item }) {
    // renderer is used to load textures and env maps,
    // but require it always since it is an extensible pattern
    if (!renderer) {
      throw new Error('You must provide a renderer to the loadSingle function.')
    }

    try {
      const itemLoadingStart = performance.now()

      const key = item.key || item.url
      if (!(key in this.#loaded)) {
        this.#loaded[key] = await this._loadItem({ renderer, ...item })
      }

      if (window.DEBUG) {
        console.log(
          `📦 Loaded single asset %c${item.url}%c in ${prettyMs(
            performance.now() - itemLoadingStart
          )}`,
          'color:blue',
          'color:black'
        )
      }

      return key
    } catch (err) {
      console.error(`📦 Asset ${item.url} was not loaded:\n${err}`)
    }
  }

  // Loads all queued assets
  async load({ renderer }) {
    // renderer is used to load textures and env maps,
    // but require it always since it is an extensible pattern
    if (!renderer) {
      throw new Error('You must provide a renderer to the load function.')
    }

    const queue = this.#queue.slice()
    this.#queue.length = 0 // clear queue

    const total = queue.length
    if (total === 0) {
      // resolve first this functions and then call the progress listeners
      setTimeout(() => this.#onProgressListeners.forEach((fn) => fn(1)), 0)
      return
    }

    const loadingStart = performance.now()

    await pMap(
      queue,
      async (item, i) => {
        try {
          const itemLoadingStart = performance.now()

          const key = item.key || item.url
          if (!(key in this.#loaded)) {
            this.#loaded[key] = await this._loadItem({ renderer, ...item })
          }

          if (window.DEBUG) {
            this.log(
              `Loaded %c${item.url}%c in ${prettyMs(performance.now() - itemLoadingStart)}`,
              'color:blue',
              'color:black'
            )
          }
        } catch (err) {
          this.logError(`Asset ${item.url} was not loaded:\n${err}`)
        }

        const percent = (i + 1) / total
        this.#onProgressListeners.forEach((fn) => fn(percent))
      },
      { concurrency: this.#asyncConcurrency }
    )

    if (window.DEBUG) {
      const errors = this.#logs.filter((log) => log.type === 'error')

      if (errors.length === 0) {
        this.groupLog(`📦 Assets loaded in ${prettyMs(performance.now() - loadingStart)} ⏱`)
      } else {
        this.groupLog(
          `📦 %c Could not load ${errors.length} asset${errors.length > 1 ? 's' : ''} `,
          'color:white;background:red;'
        )
      }
    }
  }

  // Loads a single asset.
  _loadItem({ url, type, renderer, ...options }) {
    switch (type) {
      case 'gltf':
        return loadGLTF(url, options)
      case 'json':
        return fetch(url).then((response) => response.json())
      case 'envmap':
      case 'envMap':
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
        return fetch(url).then((response) => response.arrayBuffer())
      case 'video':
        // You might not want to load big video files and
        // store them in memory, that might be inefficient.
        // Rather load them outside of the queue
        return fetch(url).then((response) => response.blob())
      default:
        throw new Error(`Could not load ${url}, the type ${type} is unknown!`)
    }
  }

  log(...text) {
    this.#logs.push({ type: 'log', text })
  }

  logError(...text) {
    this.#logs.push({ type: 'error', text })
  }

  groupLog(...text) {
    console.groupCollapsed(...text)
    this.#logs.forEach((log) => {
      console[log.type](...log.text)
    })
    console.groupEnd()

    this.#logs.length = 0 // clear logs
  }
}

// asset manager is a singleton, you can require it from
// different files and use the same instance.
// A plain js object would have worked just fine,
// fucking java patterns
export default new AssetManager()

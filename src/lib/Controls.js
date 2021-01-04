import State from 'controls-state'
import wrapGUI from 'controls-gui'

let controls

function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]))
}

function fromObjectToSlider(object) {
  return State.Slider(object.value, {
    min: object.min,
    max: object.max,
    step: object.step || 0.01,
    ...(object.scale === 'exp' && {
      min: object.min || 0.01,
      mapping: (x) => Math.pow(10, x),
      inverseMapping: Math.log10,
    }),
  })
}

export function initControls(object, options = {}) {
  const stateObject = mapValues(object, (value) => {
    if (
      typeof value === 'object' &&
      (value.hasOwnProperty('value') ||
        value.hasOwnProperty('max') ||
        value.hasOwnProperty('min') ||
        value.hasOwnProperty('step'))
    ) {
      return fromObjectToSlider(value)
    }

    if (typeof value === 'object') {
      return mapValues(value, (v) => {
        if (
          typeof v === 'object' &&
          (v.hasOwnProperty('value') ||
            v.hasOwnProperty('max') ||
            v.hasOwnProperty('min') ||
            v.hasOwnProperty('step'))
        ) {
          return fromObjectToSlider(v)
        }

        return value
      })
    }

    return value
  })

  const controlsState = State(stateObject)
  const controlsInstance = options.hideControls
    ? controlsState
    : wrapGUI(controlsState, { expanded: !options.closeControls })

  // add the custom controls-gui styles
  if (!options.hideControls) {
    const styles = `
      [class^="controlPanel-"] [class*="__field"]::before {
        content: initial !important;
      }
      [class^="controlPanel-"] [class*="__labelText"] {
        text-indent: 6px !important;
      }
      [class^="controlPanel-"] [class*="__field--button"] > button::before {
        content: initial !important;
      }
    `
    const style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = styles
    document.head.appendChild(style)
  }

  controls = controlsInstance
  return controlsInstance
}

export function wireValue(object, fn) {
  let fnString = fn.toString()

  if (fnString.slice(-1) === '}') {
    fnString = fnString.slice(0, -1)
  }

  const accessorStart = fnString.indexOf('.controls.') + '.controls.'.length
  fnString = fnString.slice(accessorStart)

  const accessor = fnString.trim()

  controls.$onChanges((cons) => {
    if (cons[accessor]) {
      object[accessor] = cons[accessor].value
    }
  })

  return fn()
}

export function wireUniform(object, fn) {
  let fnString = fn.toString()

  if (fnString.slice(-1) === '}') {
    fnString = fnString.slice(0, -1)
  }

  const accessorStart = fnString.indexOf('.controls.') + '.controls.'.length
  fnString = fnString.slice(accessorStart)

  const accessor = fnString.trim()

  const accessorUniform = accessor.slice(accessor.indexOf('.') + 1)

  controls.$onChanges((cons) => {
    if (cons[accessor]) {
      object.uniforms[accessorUniform].value = cons[accessor].value
    }
  })

  return { value: fn() }
}

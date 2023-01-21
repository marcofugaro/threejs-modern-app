import { NumberController } from 'lil-gui'

// Exponential slider for lil-gui.
// Only for numbers > 0

const mapping = (x) => Math.pow(10, x)
const inverseMapping = Math.log10

export class ExponentialNumberController extends NumberController {
  updateDisplay() {
    super.updateDisplay()

    if (this._hasSlider) {
      const value = inverseMapping(this.getValue())
      const min = inverseMapping(this._min)
      const max = inverseMapping(this._max)
      let percent = (value - min) / (max - min)
      percent = Math.max(0, Math.min(percent, 1))

      this.$fill.style.width = percent * 100 + '%'
    }

    return this
  }

  _initSlider() {
    this._hasSlider = true

    // Build DOM
    // ---------------------------------------------------------------------

    this.$slider = document.createElement('div')
    this.$slider.classList.add('slider')

    this.$fill = document.createElement('div')
    this.$fill.classList.add('fill')

    this.$slider.appendChild(this.$fill)
    this.$widget.insertBefore(this.$slider, this.$input)

    this.domElement.classList.add('hasSlider')

    // Map clientX to value
    // ---------------------------------------------------------------------

    const min = inverseMapping(this._min)
    const max = inverseMapping(this._max)

    const clamp = (value) => {
      if (value < min) value = min
      if (value > max) value = max
      return value
    }

    const map = (v, a, b, c, d) => {
      return ((v - a) / (b - a)) * (d - c) + c
    }

    const setValueFromX = (clientX) => {
      const rect = this.$slider.getBoundingClientRect()
      let value = map(clientX, rect.left, rect.right, min, max)
      this.setValue(this._snap(mapping(clamp(this._snap(value)))))
    }

    const mouseDown = (e) => {
      this._setDraggingStyle(true)
      setValueFromX(e.clientX)
      window.addEventListener('pointermove', mouseMove)
      window.addEventListener('pointerup', mouseUp)
    }

    const mouseMove = (e) => {
      setValueFromX(e.clientX)
    }

    const mouseUp = () => {
      this._callOnFinishChange()
      this._setDraggingStyle(false)
      window.removeEventListener('pointermove', mouseMove)
      window.removeEventListener('pointerup', mouseUp)
    }

    this.$slider.addEventListener('pointerdown', mouseDown)
  }
}

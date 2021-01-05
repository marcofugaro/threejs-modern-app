// demo the save screenshot feature
export function addScreenshotButton(webgl) {
  const screenshotButton = document.createElement('div')

  // normally the styles would be in style.css
  screenshotButton.style.position = 'fixed'
  screenshotButton.style.bottom = 0
  screenshotButton.style.right = 0
  screenshotButton.style.background = 'tomato'
  screenshotButton.style.cursor = 'pointer'
  screenshotButton.style.padding = '8px 16px'
  screenshotButton.style.margin = '12px'
  screenshotButton.style.borderRadius = '3px'
  screenshotButton.style.color = 'white'
  screenshotButton.style.fontSize = '24px'

  screenshotButton.textContent = '📸 Save screenshot'
  screenshotButton.addEventListener('click', webgl.saveScreenshot)

  document.body.appendChild(screenshotButton)
}

// demo the save video feature
export function addRecordButton(webgl) {
  const recordButton = document.createElement('div')

  // normally the styles would be in style.css
  recordButton.style.position = 'fixed'
  recordButton.style.bottom = 0
  recordButton.style.left = 0
  recordButton.style.background = 'tomato'
  recordButton.style.cursor = 'pointer'
  recordButton.style.padding = '8px 16px'
  recordButton.style.margin = '12px'
  recordButton.style.borderRadius = '3px'
  recordButton.style.color = 'white'
  recordButton.style.fontSize = '24px'

  recordButton.textContent = '🔴 Start recording gif'
  recordButton.addEventListener('click', () => {
    if (!webgl.isRecording) {
      webgl.startRecording()
      recordButton.textContent = '🟥 Stop recording gif'
    } else {
      webgl.stopRecording()
      recordButton.textContent = '🔴 Start recording gif'
    }
  })

  document.body.appendChild(recordButton)
}

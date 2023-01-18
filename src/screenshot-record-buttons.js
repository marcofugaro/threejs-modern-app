// normally the styles would be in style.css
const buttonStyles = `
  .button {
    background: chocolate;
    box-shadow: 0px 5px 0px 0px #c71e1e;
    cursor: pointer;
    padding: 12px 16px;
    margin: 12px;
    border-radius: 5px;
    color: white;
    font-size: 24px;
  }

  .button:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  .button[disabled] {
    pointer-events: none;
    opacity: 0.7;
  }
`

// demo the save screenshot feature
export function addScreenshotButton(webgl) {
  document.head.innerHTML = `${document.head.innerHTML}<style>${buttonStyles}</style>`

  const screenshotButton = document.createElement('div')
  screenshotButton.classList.add('button')
  screenshotButton.style.position = 'fixed'
  screenshotButton.style.bottom = 0
  screenshotButton.style.right = 0

  screenshotButton.textContent = '📸 Save screenshot'
  screenshotButton.addEventListener('click', () => webgl.saveScreenshot())

  document.body.appendChild(screenshotButton)
}

// demo the save video feature
export function addRecordButton(webgl) {
  document.head.innerHTML = `${document.head.innerHTML}<style>${buttonStyles}</style>`

  const recordButton = document.createElement('div')
  recordButton.classList.add('button')
  recordButton.style.position = 'fixed'
  recordButton.style.bottom = 0
  recordButton.style.left = 0

  recordButton.textContent = '🔴 Start recording mp4'
  recordButton.addEventListener('click', async () => {
    if (!webgl.isRecording) {
      recordButton.textContent = '🟥 Stop recording mp4'
      webgl.startRecording()
    } else {
      recordButton.textContent = '⏳ Processing video...'
      recordButton.setAttribute('disabled', '')
      await webgl.stopRecording()
      recordButton.removeAttribute('disabled')
      recordButton.textContent = '🔴 Start recording mp4'
    }
  })

  document.body.appendChild(recordButton)
}

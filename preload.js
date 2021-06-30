// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const noble = require('noble')
const electron = require('electron')
const buffer = require('buffer')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

window.noble = noble
window.electron = electron
window.buffer = buffer

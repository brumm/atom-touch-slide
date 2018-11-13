'use babel'

import { getCurrentWindow, TouchBar, nativeImage } from 'remote'
import { CompositeDisposable, Disposable } from 'atom'
import debounce from 'lodash.debounce'
const { TouchBarScrubber, TouchBarLabel } = TouchBar

import { getStyledLine } from './utils'

function canvasBuffer(canvas) {
  const type = 'image/png'
  const quality = 0.9

  const data = canvas.toDataURL(type, quality)
  const img = nativeImage.createFromDataURL(data)
  return img.toPNG()
}

const baseWidth = 10 * 2
const baseHeight = 60 * 2

const canvas = document.createElement('canvas')
canvas.setAttribute('width', baseWidth)
canvas.setAttribute('height', baseHeight)
const ctx = canvas.getContext('2d')
const fontFamily = atom.config.get('editor.fontFamily')
const cursorHeight = baseHeight - 30 * 2

const drawCharacter = (char, { fontSize = 40, color = 'white', hasCursor } = {}) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = color
  ctx.font = `${fontSize}px "${fontFamily}"`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(char, canvas.width / 2, canvas.height / 2)

  if (hasCursor) {
    const oldFillStyle = ctx.fillStyle
    ctx.fillStyle = 'white'
    const yPos = baseHeight / 2 - cursorHeight / 2
    ctx.fillRect(0, yPos, 4, cursorHeight)
    ctx.fillStyle = oldFillStyle
  }

  return nativeImage.createFromBuffer(canvasBuffer(canvas)).resize({ width: 8 })
}

class TouchSlide {
  subscriptions = new CompositeDisposable()

  activate = () => {
    this.currentWindow = getCurrentWindow()
    this.scrubber = new TouchBarScrubber({
      selectedStyle: 'outline',
      overlayStyle: null,
      mode: 'fixed',
      select: this.moveCursor,
    })

    this.touchBar = new TouchBar([this.scrubber])

    this.currentWindow.setTouchBar(this.touchBar)

    this.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        editor.onDidStopChanging(() => this.updateTouchbar(editor))
        editor.onDidChangeCursorPosition(() => this.updateTouchbar(editor))
      })
    )
  }

  moveCursor = index => {
    const editor = atom.workspace.getActiveTextEditor()
    const { row } = editor.getCursorBufferPosition()
    editor.setCursorBufferPosition([row, index])
  }

  updateTouchbar = debounce(editor => {
    const { row, column } = editor.getCursorBufferPosition()

    // if (this.lastRow === row) {
    //   return
    // }

    const line = getStyledLine(editor, row).map(([text, color], index) => ({
      icon: drawCharacter(text, { color, hasCursor: index === column }),
    }))

    this.scrubber.items = line
    this.lastRow = row
  }, 150)

  deactivate = () => {
    this.subscriptions.dispose()
    this.currentWindow.setTouchBar()
  }
}

export default new TouchSlide()

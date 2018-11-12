'use babel'

import { getCurrentWindow, TouchBar } from 'remote'
import { CompositeDisposable, Disposable } from 'atom'
const { TouchBarScrubber, TouchBarLabel } = TouchBar

class TouchSlide {
  subscriptions = new CompositeDisposable()

  activate = () => {
    this.currentWindow = getCurrentWindow()
    this.scrubber = new TouchBarScrubber({
      selectedStyle: 'outline',
      overlayStyle: 'outline',
      mode: 'fixed',
      select: this.moveCursor,
    })

    this.touchBar = new TouchBar([this.scrubber])

    this.currentWindow.setTouchBar(this.touchBar)

    this.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        this.lastEditor = editor
        editor.onDidChange(() => this.updateTouchbar(editor))
        editor.onDidChangeCursorPosition(() => this.updateTouchbar(editor))
      })
    )
  }

  moveCursor = index => {
    const editor = this.lastEditor
    const row = this.lastCursorBufferRow
    editor.setCursorBufferPosition([row, index])
  }

  updateTouchbar = editor => {
    const { row, column } = editor.getCursorBufferPosition()
    this.lastCursorBufferRow = row

    if (this.lastRow === row) {
      return
    }

    const line = editor
      .lineTextForBufferRow(row)
      .split('')
      .map(label => new TouchBarLabel({ label }))

    this.scrubber.items = line

    this.lastRow = row
  }

  deactivate = () => {
    this.subscriptions.dispose()
    this.currentWindow.setTouchBar()
  }
}

export default new TouchSlide()

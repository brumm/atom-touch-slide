'use babel'

result = []
const makeNode = ({ nodeValue, parentElement }) =>
  (nodeValue || '').split('').map(text => [text, window.getComputedStyle(parentElement).color])

const recursivelyGetStyledChildren = node => {
  if (node.firstChild === null) {
    result = result.concat(makeNode(node))
  } else if (node.childNodes.length > 0) {
    children = node.childNodes
    Array.from(children).forEach(function(child) {
      if (child.firstChild === null) {
        result = result.concat(makeNode(child))
      } else {
        recursivelyGetStyledChildren(child)
      }
    })
  }
  return result
}

export const getStyledLine = (editor, row) => {
  const editorElement = atom.views.getView(editor)
  const line = editorElement.querySelector(`.lines [data-screen-row="${row}"]`)
  const foo = recursivelyGetStyledChildren(line)
  result = []
  return foo
}

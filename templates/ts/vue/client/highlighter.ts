/* Taken from https://github.com/Remeic/vue-highlighter/blob/master/src/highlighter.js */

let originalContent = undefined
/**
 * Default color of highlighted texts
 * @type {string}
 */
const textColorDefault = '#fff'

/**
 * Default background color of highlighted texts
 * @type {string}
 */
const bgColorDefault = '#009688'

/**
 * Default padding of highlight containers
 * @type {string}
 */
const paddingDefault = '0px 5px'

/**
 * Create a RegEx pattern to find the desired words
 * @param {(string|string[])} word - A string or an array of strings to use to create the RegEx pattern
 * @param {boolean} [liveHighlighting=false] - Specify if the pattern should be a live search. Default is false
 * @returns {string} The RegEx pattern to find looked for words
 */
function selectPattern(word, liveHighlighting = false) {
  let result = ''
  let explodedWord = Array.isArray(word) ? word.join('|') : word
  if (!liveHighlighting) {
    result = '\\b(' + explodedWord + ')\\b'
  } else {
    result = '(' + explodedWord + ')'
  }
  return result
}

/**
 * Set text color of highlighted text
 * @param {string} [color=textColorDefault] - See {@link testColor} for valid colors
 * @returns {string} Return the passed string if it is valid color, the {@link textColorDefault} otherwise
 */
function testTextColor(color = textColorDefault) {
  let result = textColorDefault
  if (testColor(color)) {
    result = color
  }
  return result
}

/**
 * Set text color of highlighted text
 * @param {string} [color=bgColorDefault] - See {@link testColor} for valid colors
 * @returns {string} Return the passed string if it is valid color, the {@link bgColorDefault} otherwise
 */
function testBgColor(color = bgColorDefault) {
  let result = bgColorDefault
  if (testColor(color)) {
    result = color
  }
  return result
}

/**
 * Test if a string representing a color is valid
 * @param {string} color - Color to test. Valid color are default CSS text colors (e.g.: 'black') and 3 or 6 hexadecimals preceded by a #
 * @returns {boolean} True if the color is considered valid, false otherwise
 */
function testColor(color) {
  let result = false
  let isAColor = /(^#[0-9a-zA-F]{8}$)|(^#[0-9a-zA-F]{6}$)|(^#[0-a-z9A-F]{4}$)|(^#[0-9a-zA-F]{3}$)/i.test(
    color
  )
  let isAString = /^[a-zA-Z]+$/.test(color)
  if (isAColor || isAString) {
    result = true
  }
  return result
}

/**
 * Test if the passed padding value is valid
 * @param {string} padding - The padding value to test
 * @returns {string} The passed padding if it is valid, {@link paddingDefault} otherwise
 */
function testPadding(padding) {
  let result = paddingDefault
  let isAValidValue = /^(\d+(cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)\s?){1,4}$/i.test(
    padding
  )
  if (isAValidValue) {
    result = padding
  }
  return result
}

/**
 * Create tags with highlighted looked for text
 * @param {string} content - Content where find text to highlight
 * @param {(string|string[])} word - A word or an array of words to looking for
 * @param {string} patternSelected - RegEx pattern to find looked for words
 * @param {string} color - Text color of highlighted container
 * @param {string} bgColor - Background color of highlighted container
 * @param {string} padding - Padding of highlighted container
 * @returns {string} Return replaced content with highlighted tags
 */
function highlight(content, word, patternSelected, color, bgColor, padding) {
  const spanStart =
    "<span style='padding:" +
    padding +
    '; background-color:' +
    bgColor +
    '; color:' +
    color +
    ";'>"
  const spanEnd = '</span>'
  let result = content
  if (word != '') {
    let regex = new RegExp(patternSelected, 'g')
    result = content.replace(regex, spanStart + '$&' + spanEnd)
  }
  return result
}

const vueHighlighter = {
  bind(el, binding, vnode) {
    originalContent = el.innerHTML
    let pattern = ''
    let word = ''
    let color = textColorDefault
    let bgColor = bgColorDefault
    let padding = paddingDefault
    if (binding.value.word != undefined) {
      word = binding.value.word
    }
    if (binding.value.live != undefined) {
      pattern = selectPattern(word, binding.value.live)
    }
    if (binding.value.style != undefined) {
      color = testTextColor(binding.value.style.color)
      bgColor = testBgColor(binding.value.style.bgColor)
      padding = testPadding(binding.value.style.padding)
    }
    el.innerHTML = highlight(
      originalContent,
      word,
      pattern,
      color,
      bgColor,
      padding
    )
  },
  update(el, binding, node, oldNode) {
    let pattern = ''
    let color = textColorDefault
    let bgColor = bgColorDefault
    let padding = paddingDefault
    if (binding.value.style != undefined) {
      color = testTextColor(binding.value.style.color)
      bgColor = testBgColor(binding.value.style.bgColor)
      padding = testPadding(binding.value.style.padding)
    }
    if (binding.value.live) {
      pattern = selectPattern(binding.value.word, binding.value.live)
      el.innerHTML = highlight(
        node.children[0].text,
        binding.value.word,
        pattern,
        color,
        bgColor,
        padding
      )
    } else {
      pattern = selectPattern(binding.value.word)
      el.innerHTML = highlight(
        originalContent,
        binding.value.word,
        pattern,
        color,
        bgColor,
        padding
      )
    }
  },
  unbind(el) {
    el.innerHTML = originalContent
  },
}

export default vueHighlighter

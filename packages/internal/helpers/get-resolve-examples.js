const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _resolveExamples
function getResolveExamples() {
  if (_resolveExamples) {
    return _resolveExamples
  }

  const resolveExamples = []

  for (const filePath of find('./examples/*/package.json', {
    cwd: getResolveDir(),
    absolute: true,
    ignore: ['**/node_modules/**', './node_modules/**'],
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }
    if (
      filePath.includes('packages\\internal') ||
      filePath.includes('packages/internal')
    ) {
      continue
    }
    if (
      filePath.includes(`optional\\${'dependencies'}`) ||
      filePath.includes(`optional/${'dependencies'}`)
    ) {
      continue
    }

    const { name, description, resolveJs } = require(filePath)
    if (!resolveJs || !resolveJs.isResolveAppTemplate) {
      continue
    }
    if (!description) {
      throw new Error(`Example "${name}" .description must be a string`)
    }

    resolveExamples.push({ name, description })
  }

  resolveExamples.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  _resolveExamples = resolveExamples

  return resolveExamples
}

module.exports = { getResolveExamples }

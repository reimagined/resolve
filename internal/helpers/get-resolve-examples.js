const glob = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _resolveExamples
function getResolveExamples() {
  if (_resolveExamples) {
    return _resolveExamples
  }

  const sources = ['./examples/**/package.json', './templates/**/package.json']
  const resolveDir = getResolveDir()

  const packages = sources
    .map((source) =>
      glob(source, {
        cwd: resolveDir,
        absolute: true,
        ignore: ['**/node_modules/**', './node_modules/**', '**/dist/**'],
      })
    )
    .flat(1)

  const resolveExamples = []

  for (const filePath of packages) {
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
    if (!resolveJs || !resolveJs.isAppTemplate) {
      continue
    }
    if (!description) {
      throw new Error(`Example "${name}" .description must be a string`)
    }

    resolveExamples.push({
      name,
      description,
      path: filePath.replace(resolveDir, '').replace('/package.json', ''),
    })
  }

  resolveExamples.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  _resolveExamples = resolveExamples

  return resolveExamples
}

module.exports = { getResolveExamples }

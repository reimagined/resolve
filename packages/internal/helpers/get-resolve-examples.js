const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _resolveExamples
function getResolveExamples({isSupportMonorepo = false, isIncludeDescription = true} = {}) {
  if (_resolveExamples) {
    return _resolveExamples
  }

  const resolveExamples = []

  for (const filePath of find(`./examples/${isSupportMonorepo ? '**' : '*'}/package.json`, {
    cwd: getResolveDir(),
    absolute: true
  })) {
    if (filePath.includes('node_modules') || filePath.includes('/dist/') || filePath.includes('\\dist\\')) {
      continue
    }
    if (
      filePath.includes('packages\\internal') ||
      filePath.includes('packages/internal')
    ) {
      continue
    }

    const { name, description } = require(filePath)

    if (!description && isIncludeDescription) {
      throw new Error(`Example "${name}" .description must be a string`)
    }

    resolveExamples.push({ name, description, filePath})
  }

  resolveExamples.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  _resolveExamples = resolveExamples

  return resolveExamples
}

module.exports = { getResolveExamples }

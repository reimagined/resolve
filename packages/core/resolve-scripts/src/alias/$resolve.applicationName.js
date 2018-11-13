import resolveFile from '../resolve_file'

export default () => {
  const { name: applicationName } = require(resolveFile('package.json'))
  const exports = []

  exports.push(
    `const applicationName = ${JSON.stringify(applicationName)}`,
    ``,
    `export default applicationName`
  )

  return {
    code: exports.join('\r\n')
  }
}

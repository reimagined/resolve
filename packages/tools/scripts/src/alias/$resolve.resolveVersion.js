import resolveFileOrModule from '../resolve_file_or_module'

export default () => {
  const exports = []

  const runtimePackageJson = require(resolveFileOrModule(
    '@resolve-js/runtime/package.json'
  ))

  exports.push(
    `const resolveVersion = ${JSON.stringify(runtimePackageJson.version)}`,
    ``,
    `export default resolveVersion`
  )

  return exports.join('\r\n')
}

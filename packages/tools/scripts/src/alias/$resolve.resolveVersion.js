import resolveFileOrModule from '../resolve_file_or_module'

const importResolveVersion = () => {
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

export default importResolveVersion

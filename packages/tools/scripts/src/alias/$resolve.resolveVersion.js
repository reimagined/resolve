import { resolveResource } from '../resolve-resource'

const importResolveVersion = () => {
  const exports = []

  const runtimePackageJson = require(resolveResource(
    '@resolve-js/runtime-base/package.json'
  ).result)

  exports.push(
    `const resolveVersion = ${JSON.stringify(runtimePackageJson.version)}`,
    ``,
    `export default resolveVersion`
  )

  return exports.join('\r\n')
}

export default importResolveVersion

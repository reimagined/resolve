import { resolveResource } from '../resolve-resource'

const importApplicationName = ({ resolveConfig }) => {
  const exports = []

  const applicationName =
    resolveConfig.name == null
      ? require(resolveResource('package.json').result).name
      : resolveConfig.name

  exports.push(
    `const applicationName = ${JSON.stringify(applicationName)}`,
    ``,
    `export default applicationName`
  )

  return exports.join('\r\n')
}

export default importApplicationName

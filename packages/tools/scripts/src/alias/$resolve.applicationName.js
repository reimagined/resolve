import resolveFile from '../resolve_file'

const importApplicationName = ({ resolveConfig }) => {
  const exports = []

  const applicationName =
    resolveConfig.name == null
      ? require(resolveFile('package.json')).name
      : resolveConfig.name

  exports.push(
    `const applicationName = ${JSON.stringify(applicationName)}`,
    ``,
    `export default applicationName`
  )

  return exports.join('\r\n')
}

export default importApplicationName

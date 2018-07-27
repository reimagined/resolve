export default ({ resolveConfig }) => {
  const exports = []

  exports.push(
    `const applicationName = ${JSON.stringify(resolveConfig.applicationName)}`,
    ``,
    `export default applicationName`
  )

  return {
    code: exports.join('\r\n')
  }
}

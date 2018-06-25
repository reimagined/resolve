export default ({ deployOptions }) => {
  const exports = []

  exports.push(
    `const applicationName = ${JSON.stringify(deployOptions.applicationName)}`,
    ``,
    `export default applicationName`
  )

  return {
    code: exports.join('\r\n')
  }
}

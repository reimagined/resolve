export default () => {
  const exports = []

  exports.push(`export * from 'resolve-redux'`)

  return {
    code: exports.join('\r\n')
  }
}

import resolveFile from '../resolve_file'

export default ({ resolveConfig }) => {
  const clientIndexPath = resolveFile(
    resolveConfig.index,
    'resolve-runtime/lib/common/defaults/client-index.js'
  )

  const exports = [
    `import clientIndex from ${JSON.stringify(clientIndexPath)}`,
    `export default clientIndex`
  ]

  return {
    code: exports.join('\r\n')
  }
}

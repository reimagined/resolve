export function getSourceInfo(userObject) {
  try {
    const sourcedecl = userObject.__SOURCE_DELCARATION__
    const {
      sourceCode,
      filename,
      startLine,
      startColumn,
      endLine,
      endColumn
    } = sourcedecl
    return (
      `in ${filename} at ${startLine}:${startColumn} / ${endLine}:${endColumn} ` +
      `"""${sourceCode}"""`
    )
  } catch (err) {
    return '(Source information is unavailable)'
  }
}

export function raiseError(errorText, errorObject) {
  const errorSource =
    typeof errorObject !== 'undefined' ? getSourceInfo(errorObject) : ''
  // eslint-disable-next-line no-console
  console.error('Error: ', errorText, ' ', errorSource)
  process.exit(1)
}

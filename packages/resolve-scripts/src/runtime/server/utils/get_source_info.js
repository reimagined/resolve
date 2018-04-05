const getSourceInfo = userObject => {
  try {
    const sourceDeclaration = userObject.__SOURCE_DELCARATION__
    const {
      sourceCode,
      filename,
      startLine,
      startColumn,
      endLine,
      endColumn
    } = sourceDeclaration
    return (
      `in ${filename} at ${startLine}:${startColumn} / ${endLine}:${endColumn} ` +
      `"""${sourceCode}"""`
    )
  } catch (err) {
    return '(Source information is unavailable)'
  }
}

export default getSourceInfo

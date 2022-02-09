// eslint-disable-next-line @typescript-eslint/no-var-requires
const imports = require('busboy/lib/utils.js')

const parseContentType = (
  contentType: string
  // eslint-disable-next-line spellcheck/spell-checker
): { type: string; subType: string; params: Record<string, string> } => {
  // eslint-disable-next-line spellcheck/spell-checker
  const { type, subtype: subType, params } = imports.parseContentType(
    contentType
  )
  return { type, subType, params }
}

export default parseContentType

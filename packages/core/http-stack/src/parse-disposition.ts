// eslint-disable-next-line @typescript-eslint/no-var-requires
const imports = require('busboy/lib/utils.js')

const parseDisposition: (
  disposition: string
  // eslint-disable-next-line spellcheck/spell-checker
) => { type: string; params: Record<string, string> } = imports.parseDisposition

export default parseDisposition

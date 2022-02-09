// eslint-disable-next-line @typescript-eslint/no-var-requires
const imports = require('busboy/lib/utils.js')

const convertToUTF8: (
  data: string | Buffer,
  charset: string,
  hint?: number
  // eslint-disable-next-line spellcheck/spell-checker
) => { type: string; params: Record<string, string> } = imports.convertToUTF8

export default convertToUTF8

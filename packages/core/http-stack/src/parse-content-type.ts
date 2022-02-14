// eslint-disable-next-line @typescript-eslint/no-var-requires
import type { ContentType } from './types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const imports = require('busboy/lib/utils.js')

const parseContentType = (contentType: string): ContentType => {
  const {
    type,
    // eslint-disable-next-line spellcheck/spell-checker
    subtype: subType,
    params: { charset = 'utf-8', ...params },
  } = imports.parseContentType(contentType)
  return {
    type,
    subType,
    params: {
      ...params,
      charset: charset === undefined ? undefined : charset.toLocaleLowerCase(),
    },
  }
}

export default parseContentType

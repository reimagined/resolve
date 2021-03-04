import type { EscapeableMethod } from './types'

const escapeStr: EscapeableMethod = (str) =>
  `'${String(str).replace(/(['])/gi, '$1$1')}'`

export default escapeStr

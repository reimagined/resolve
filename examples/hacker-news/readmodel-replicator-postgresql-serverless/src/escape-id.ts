import type { EscapeableMethod } from './types'

const escapeId: EscapeableMethod = (str) =>
  `"${String(str).replace(/(["])/gi, '$1$1')}"`

export default escapeId

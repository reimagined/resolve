const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`

export default escapeId

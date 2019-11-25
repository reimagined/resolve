import * as resolveRedux from 'resolve-redux'

const getNativeChunk = resolveChunk => ({ ...resolveChunk, resolveRedux })

export default getNativeChunk

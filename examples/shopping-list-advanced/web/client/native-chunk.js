import * as resolveRedux from '@resolve-js/redux'

const getNativeChunk = (resolveChunk) => ({ ...resolveChunk, resolveRedux })

export default getNativeChunk

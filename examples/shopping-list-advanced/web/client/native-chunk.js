import * as resolveRedux from '@reimagined/redux'

const getNativeChunk = (resolveChunk) => ({ ...resolveChunk, resolveRedux })

export default getNativeChunk

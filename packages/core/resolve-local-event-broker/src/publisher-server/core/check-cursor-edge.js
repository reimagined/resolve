const checkCursorEdge = (events, cursor) => {
  const cursorBuffer =
    cursor != null ? Buffer.from(cursor, 'base64') : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex')
    )
  }
  for (const event of events) {
    const { threadId, threadCounter } = event
    const cursorThreadCounter = parseInt(vectorConditions[threadId], 16)
    if (threadCounter < cursorThreadCounter) {
      return false
    }
  }
  return true
}

export default checkCursorEdge

const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const getNextCursor = async (prevCursor, events) => {
  const cursorBuffer =
    prevCursor != null
      ? Buffer.from(prevCursor, 'base64')
      : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex')
    )
  }

  for (const event of events) {
    const { threadId, threadCounter } = event
    const oldThreadCounter = parseInt(vectorConditions[threadId], 16)

    vectorConditions[threadId] = Math.max(threadCounter + 1, oldThreadCounter)
      .toString(16)
      .padStart(12, '0')
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = threadCounter.match(split2RegExp)
    for (const byteHex of threadCounterBytes) {
      nextConditionsBuffer[byteIndex++] = Buffer.from(byteHex, 'hex')[0]
    }
  }

  return nextConditionsBuffer.toString('base64')
}

export default getNextCursor

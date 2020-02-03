const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g
const sortExpression = { timestamp: 1, threadCounter: 1 }
const projectionExpression = { _id: 0 }

const loadEventsByCursor = async (
  { database, collectionName },
  { eventTypes, aggregateIds, cursor, limit },
  callback
) => {
  const cursorBuffer =
    cursor != null ? Buffer.from(cursor, 'base64') : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      `0x${cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex')}`
    )
  }

  const batchSize = limit != null ? limit : 0x7fffffff
  const findExpression = {
    $and: [
      ...(eventTypes != null ? [{ type: { $in: eventTypes } }] : []),
      ...(aggregateIds != null ? [{ aggregateId: { $in: aggregateIds } }] : []),
      {
        $or: vectorConditions.map((threadCounter, threadId) => ({
          $and: [
            { threadId: { $eq: threadId } },
            { threadCounter: { $gte: parseInt(threadCounter, 16) } }
          ]
        }))
      }
    ]
  }

  const collection = await database.collection(collectionName)

  const cursorStream = collection
    .find(findExpression)
    .sort(sortExpression)
    .project(projectionExpression)
    .stream()

  let lastError = null

  for (
    let event = await cursorStream.next(), eventsLeft = batchSize;
    event != null && eventsLeft-- > 0;
    event = await cursorStream.next()
  ) {
    try {
      const threadId = +event.threadId
      const threadCounter = +event.threadCounter
      event[Symbol.for('threadCounter')] = threadCounter
      event[Symbol.for('threadId')] = threadId

      const oldThreadCounter = parseInt(
        vectorConditions[threadId].substring(2),
        16
      )

      vectorConditions[threadId] = `0x${Math.max(
        threadCounter + 1,
        oldThreadCounter
      )
        .toString(16)
        .padStart(12, '0')}`

      delete event.threadId
      delete event.threadCounter

      await callback(event)
    } catch (error) {
      lastError = error
      break
    }
  }

  await cursorStream.close()

  if (lastError != null) {
    throw lastError
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = threadCounter.substring(2).match(split2RegExp)
    for (const byteHex of threadCounterBytes) {
      nextConditionsBuffer[byteIndex++] = Buffer.from(byteHex, 'hex')[0]
    }
  }

  return nextConditionsBuffer.toString('base64')
}

export default loadEventsByCursor

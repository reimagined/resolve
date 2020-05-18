const saveEventOnly = async function({ database, collectionName }, event) {
  const collection = await database.collection(collectionName)
  const currentThreadId = Math.floor(Math.random() * 256)

  const nextThreadCounter =
    ~~Object(
      (
        await collection
          .find({ threadId: currentThreadId })
          .sort({ threadCounter: -1 })
          .project({ threadCounter: 1 })
          .toArray()
      )[0]
    ).threadCounter + 1

  await collection.insertOne({
    ...event,
    threadId: currentThreadId,
    threadCounter: nextThreadCounter
  })
}

export default saveEventOnly

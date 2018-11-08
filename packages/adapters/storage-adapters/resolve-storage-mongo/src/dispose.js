const dispose = async ({ collection, client }, { dropEvents }) => {
  if (dropEvents) {
    await collection.deleteMany({})
    await collection.dropIndexes()
  }

  await client.close()
}

export default dispose

const drop = async ({ collection }) => {
  await collection.deleteMany({})
  await collection.dropIndexes()
}

export default drop

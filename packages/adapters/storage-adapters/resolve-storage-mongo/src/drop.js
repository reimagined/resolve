const drop = async ({ database, collectionName }) => {
  try {
    await database.dropCollection(`${collectionName}-freeze`)
  } catch (error) {
    if (+error.code !== 26) {
      throw error
    }
  }
  await database.dropCollection(collectionName)
}

export default drop

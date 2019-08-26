const drop = async ({ database, collectionName }) => {
  await database.dropCollection(`${collectionName}-freeze`)
  await database.dropCollection(collectionName)
}

export default drop

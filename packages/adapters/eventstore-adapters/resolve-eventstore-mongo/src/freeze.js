const freeze = async ({ database, collectionName }) => {
  await database.createCollection(`${collectionName}-freeze`)
}

export default freeze

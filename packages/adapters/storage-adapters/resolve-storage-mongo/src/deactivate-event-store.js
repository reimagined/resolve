const deactivateEventStore = async ({ database, collectionName }) => {
  await database.createCollection(`${collectionName}-freeze`)
}

export default deactivateEventStore

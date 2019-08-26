const activateEventStore = async ({ database, collectionName }) => {
  await database.dropCollection(`${collectionName}-freeze`)
}

export default activateEventStore

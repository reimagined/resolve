const unfreeze = async ({ database, collectionName }) => {
  await database.dropCollection(`${collectionName}-freeze`)
}

export default unfreeze

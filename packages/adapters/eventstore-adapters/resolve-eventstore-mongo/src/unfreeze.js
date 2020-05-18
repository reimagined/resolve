const unfreeze = async ({ database, collectionName }) => {
  try {
    await database.dropCollection(`${collectionName}-freeze`)
  } catch (error) {
    if (+error.code !== 26) {
      throw error
    }
  }
}

export default unfreeze

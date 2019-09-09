const isFrozen = async ({ database, collectionName }) => {
  try {
    await database.collection(`${collectionName}-freeze`, { strict: true })

    return true
  } catch (error) {
    return false
  }
}

export default isFrozen

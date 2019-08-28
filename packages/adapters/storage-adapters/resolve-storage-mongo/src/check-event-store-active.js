const checkEventStoreActive = async ({ database, collectionName }) => {
  try {
    await database.collection(`${collectionName}-freeze`, { strict: true })

    return false
  } catch (error) {
    return true
  }
}

export default checkEventStoreActive

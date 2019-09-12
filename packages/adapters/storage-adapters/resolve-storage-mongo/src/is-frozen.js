const isFrozen = async ({ database, collectionName }) => {
  try {
    await new Promise((resolve, reject) =>
      database.collection(`${collectionName}-freeze`, { strict: true }, error =>
        error != null ? reject(error) : resolve()
      )
    )

    return true
  } catch (error) {
    return false
  }
}

export default isFrozen

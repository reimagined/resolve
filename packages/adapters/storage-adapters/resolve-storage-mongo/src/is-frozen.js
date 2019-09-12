const isFrozen = async ({ database, collectionName }) => {
  await database.collection(`${collectionName}-freeze`, { strict: true }, 
    error => {
      if (!error) {
        throw new Error('Event store is frozen')
      }
    }
  )
}

export default isFrozen

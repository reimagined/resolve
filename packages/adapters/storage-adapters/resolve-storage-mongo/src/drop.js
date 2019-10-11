const drop = async pool => {
  try {
    await pool.database.dropCollection(`${pool.collectionName}-freeze`)
  } catch (error) {
    if (+error.code !== 26) {
      throw error
    }
  }

  await pool.database.dropCollection(pool.collectionName)
}

export default drop

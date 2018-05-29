import NeDB from 'nedb'

export default ({ pathToFile } = {}) => {
  const db = new NeDB(
    pathToFile
      ? { filename: pathToFile, autoload: true }
      : { inMemoryOnly: true }
  )
  let flowPromise = Promise.resolve()

  return Object.freeze({
    loadSnapshot: async key =>
      await new Promise((resolve, reject) =>
        db.findOne(
          { key },
          (err, doc) => (err ? reject(err) : resolve(doc && doc.value))
        )
      ),

    saveSnapshot: (key, value) => {
      flowPromise = flowPromise
        .then(
          () =>
            new Promise((resolve, reject) =>
              db.update(
                { key },
                { key, value },
                { upsert: true },
                err => (err ? reject(err) : resolve())
              )
            )
        )
        .catch(err => console.error('Save snapshot error: ', err))
    }
  })
}

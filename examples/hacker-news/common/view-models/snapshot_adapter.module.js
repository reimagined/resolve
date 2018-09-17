import NeDB from 'nedb'

export default ({ pathToFile, bucketSize = 100 } = {}) => {
  const db = new NeDB(
    pathToFile
      ? { filename: pathToFile, autoload: true }
      : { inMemoryOnly: true }
  )
  let flowPromise = Promise.resolve()
  const countersMap = new Map()

  return Object.freeze({
    loadSnapshot: async key =>
      await new Promise((resolve, reject) =>
        db.findOne(
          { key },
          (err, doc) => (err ? reject(err) : resolve(doc && doc.value))
        )
      ),

    saveSnapshot: (key, value) => {
      if (!countersMap.has(key)) {
        countersMap.set(key, 0)
      }
      const currentCount = countersMap.get(key)
      countersMap.set(key, currentCount + 1)

      if (currentCount % bucketSize !== 0) {
        return
      }

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
        .catch(err => {
          // eslint-disable-next-line
          console.error('Save snapshot error: ', err)
        })
    }
  })
}

import 'regenerator-runtime/runtime'

async function disposeDatabase(metaCollection, collectionsPrefix, database) {
  const collectionDescriptors = await metaCollection.find({}).toArray()

  for (const { key } of collectionDescriptors) {
    await database.dropCollection(`${collectionsPrefix}${key}`)
  }

  await metaCollection.drop()
  await database.close()
}

export default function reset(repository) {
  if (repository.disposePromise) {
    return repository.disposePromise
  }

  const disposePromise = repository.connectionPromise.then(
    disposeDatabase.bind(
      null,
      repository.metaCollection,
      repository.collectionsPrefix
    )
  )

  Object.keys(repository).forEach(key => {
    delete repository[key]
  })

  repository.disposePromise = disposePromise
  return disposePromise
}

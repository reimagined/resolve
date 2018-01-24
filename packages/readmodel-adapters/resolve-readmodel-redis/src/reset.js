import 'regenerator-runtime/runtime'

import { del } from './redisApi'
import redisAdapter from './adapter'

const disposeDatabase = async ({ metaName, lastTimestampKey }, client) => {
  const tempRepository = {
    metaName,
    lastTimestampKey,
    client
  }

  const adapter = await redisAdapter(tempRepository)

  const { meta } = tempRepository

  const names = await meta.list()
  const promises = names.map(async name => {
    await adapter.del(name)
  })
  await Promise.all(promises)
  await Promise.all([
    await del(client, metaName),
    await del(client, lastTimestampKey)
  ])
}

const reset = repository => {
  if (repository.disposePromise) {
    return repository.disposePromise
  }

  const { client, metaName, lastTimestampKey } = repository

  const disposePromise = repository.connectionPromise.then(
    disposeDatabase.bind(
      null,
      {
        metaName,
        lastTimestampKey
      },
      client
    )
  )

  Object.keys(repository).forEach(key => {
    delete repository[key]
  })

  repository.disposePromise = disposePromise
  return disposePromise
}

export default reset

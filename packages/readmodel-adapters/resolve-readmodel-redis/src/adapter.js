import { del, hget, hset, hdel } from './redisApi'
import createMeta from './meta'

const hgetCommand = async ({ client, meta }, key, field) => {
  const result = await hget(client, key, field)
  return result === undefined ? null : result
}

const hsetCommand = async (
  { client, meta, lastTimestamp },
  key,
  field,
  value
) => {
  if (value === null || value === undefined) {
    await hdel(client, key, field)
    await meta.del(key)
  } else {
    await hset(client, key, field, value)
    if (!await meta.exists(key)) {
      await meta.create(key)
    }
  }
  await meta.setLastTimestamp(lastTimestamp)
}

const delCommand = async ({ client, meta, lastTimestamp }, key) => {
  await del(client, key)
  await meta.del(key)
  await meta.setLastTimestamp(lastTimestamp)
}

const adapter = async repository => {
  repository.meta = await createMeta(repository)

  return Object.freeze({
    hget: hgetCommand.bind(null, repository),
    hset: hsetCommand.bind(null, repository),
    del: delCommand.bind(null, repository)
  })
}

export default adapter

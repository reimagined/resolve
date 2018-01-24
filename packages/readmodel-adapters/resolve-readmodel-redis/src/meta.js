import { hget, hdel, hset, hkeys } from './redisApi'

const DEFAULT_META = {}

const create = async (
  { client, metaName, lastTimestampKey },
  cache,
  newName
) => {
  await hset(client, metaName, newName, DEFAULT_META)
  cache[newName] = true
}

const del = async ({ client, metaName, lastTimestampKey }, cache, key) => {
  await hdel(client, metaName, key)
  delete cache[key]
}

const getLastTimestamp = async ({ client, metaName, lastTimestampKey }) =>
  await hget(client, metaName, lastTimestampKey)

const setLastTimestamp = async (
  { client, metaName, lastTimestampKey },
  lastTimestamp
) => {
  await hset(client, metaName, lastTimestampKey, lastTimestamp)
}

const getKeys = async ({ client, metaName }) => {
  const result = await hkeys(client, metaName)
  return result ? result : {}
}

export default async repository => {
  const cache = await getKeys(repository)

  return Object.freeze({
    create: create.bind(null, repository, cache),
    del: del.bind(null, repository, cache),
    exists: async name => !!cache[name],
    getLastTimestamp: getLastTimestamp.bind(null, repository),
    setLastTimestamp: setLastTimestamp.bind(null, repository),
    list: async () => Object.keys(cache)
  })
}

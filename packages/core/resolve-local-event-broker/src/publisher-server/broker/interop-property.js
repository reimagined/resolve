import { SUBSCRIBERS_TABLE_NAME } from '../constants'

const interopProperty = async (pool, method, payload) => {
  const {
    database: {
      runQuery,
      runRawQuery,
      escapeId,
      escapeStr,
      encodeJsonPath,
      decodeJsonPath,
    },
    parseSubscription,
  } = pool
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const { eventSubscriber, key, value } = payload

  switch (method) {
    case 'listProperties': {
      const result = await runQuery(`
        SELECT "properties" FROM ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      `)

      if (result == null || result.length !== 1) {
        throw new Error('Invalid subscriber')
      }

      let { properties } = parseSubscription(result[0])
      if (properties == null) {
        properties = {}
      }
      properties = Object.keys(properties).reduce((acc, key) => {
        acc[decodeJsonPath(key)] = properties[key]
        return acc
      }, {})

      return properties
    }
    case 'getProperty': {
      const result = await runQuery(`
        SELECT "properties" FROM ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      `)

      if (result == null || result.length !== 1) {
        throw new Error('Invalid subscriber')
      }

      let { properties } = parseSubscription(result[0])
      if (properties == null) {
        properties = {}
      }

      return properties[encodeJsonPath(key)]
    }
    case 'setProperty': {
      await runRawQuery(`
        UPDATE ${subscribersTableNameAsId} SET "properties" = json_set(COALESCE("properties", json('{}')),
        ${escapeStr(`$."${encodeJsonPath(key)}"`)}, json(${escapeStr(
        JSON.stringify(value)
      )}))
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

        COMMIT;
        BEGIN IMMEDIATE;
      `)

      return null
    }
    case 'deleteProperty': {
      await runRawQuery(`
        UPDATE ${subscribersTableNameAsId} SET "properties" = json_remove(COALESCE("properties", json('{}')),
        ${escapeStr(`$."${encodeJsonPath(key)}"`)})
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};
      
        COMMIT;
        BEGIN IMMEDIATE;
      `)

      return null
    }
    default: {
      throw new Error(
        `Wrong interop property ${method} with payload ${JSON.stringify(
          payload
        )}`
      )
    }
  }
}

export default interopProperty

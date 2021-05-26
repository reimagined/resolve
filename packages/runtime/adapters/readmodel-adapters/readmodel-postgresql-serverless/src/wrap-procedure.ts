// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// This file is entry point for PLV8 procedure for Postgresql Ecmascript engine
// This entry point should never be executed in NodeJS or browser environment
// See more documentation here https://plv8.github.io/
import { splitNestedPath } from '@resolve-js/readmodel-base'
import buildUpsertDocument from './build-upsert-document'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import makeNestedPath from './make-nested-path'
import escapeId from './escape-id'
import escapeStr from './escape-str'
import makeSqlQuery from './make-sql-query'

// Event loop rules in PLV8 are slightly different from NodeJS environment
// None of the *async* or *await* below have been mistakenly missed
const executeSync = (asyncFunc) => {
  if (
    typeof Promise.installGlobally !== 'function' ||
    typeof Promise.uninstallGlobally !== 'function' ||
    typeof plv8 === undefined
  ) {
    throw new Error(`Should not be executed in NodeJS or browser environment`)
  }
  let result = null
  void Promise.resolve().then(async () => {
    result = await asyncFunc()
  })
  return result
}

const baseMethods = {
  searchToWhereExpression,
  updateToSetExpression,
  buildUpsertDocument,
  splitNestedPath,
  makeNestedPath,
  escapeId,
  escapeStr,
}

const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const executeProjection = async (name, options, ...args) => {
  const methods = { ...baseMethods, ...options }
  switch (name) {
    case 'defineTable':
    case 'insert':
    case 'update':
    case 'delete': {
      await plv8.execute(makeSqlQuery(methods, name, ...args))
      return null
    }
    case 'findOne': {
      const result = await plv8.execute(makeSqlQuery(methods, name, ...args))
      return result.map(filterFields.bind(null, args[2]))
    }
    case 'find': {
      const result = await plv8.execute(makeSqlQuery(methods, name, ...args))
      return result.length > 0 ? filterFields(args[2], result[0]) : null
    }
    case 'count': {
      const result = await plv8.execute(makeSqlQuery(methods, name, ...args))
      return result.length > 0 ? +result[0].Count : 0
    }
    default: {
      throw new Error(`Invalid read-model store method ${name}`)
    }
  }
}

const getStoreAndProjection = (readModel, options) => {
  const { name: readModelName, projection } = readModel
  const store = new Proxy(
    {},
    {
      get(_, key) {
        return executeProjection.bind(null, key, {
          ...options,
          readModelName,
        })
      },
      set() {
        throw new Error('Read-model Store API is immutable')
      },
    }
  )
  return { store, projection }
}

const wrapProcedure = (readModel) => (input, options) =>
  executeSync(async () => {
    const { events, maxExecutionTime } = input
    if (!Array.isArray(events)) {
      throw new Error('Provided events is not array')
    }
    const { store, projection } = getStoreAndProjection(readModel, options)
    const getVacantTimeInMillis = ((time) => time - Date.now()).bind(
      null,
      Date.now() + maxExecutionTime
    )
    const encryptionError = new Error('EncryptionError')
    const encryption = new Proxy(
      {},
      {
        get() {
          throw encryptionError
        },
        set() {
          throw encryptionError
        },
      }
    )

    const result = {
      successEvents: [],
      failureEvent: null,
      failureError: null,
      status: 'OK_ALL',
    }
    try {
      for (const event of events) {
        try {
          const handler = projection[event.type]
          if (typeof handler === 'function') {
            await handler(store, event, encryption)
          }
          result.successEvents.push({
            threadId: event.threadId,
            threadCounter: event.threadCounter,
          })
          if (
            getVacantTimeInMillis() < 0 &&
            result.successEvents.length < events.length
          ) {
            result.status = 'OK_PARTIAL'
            break
          }
        } catch (error) {
          if (error === encryptionError) {
            throw error
          }
          result.failureError = serializeError(error)
          result.failureEvent = event
          result.status = 'CUSTOM_ERROR'
          break
        }
      }
    } catch (error) {
      if (error === encryptionError) {
        result.status = 'ENCRYPTION_ERROR'
      } else {
        result.status = 'CUSTOM_ERROR'
      }
    }

    return result
  })

export default wrapProcedure

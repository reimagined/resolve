// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// This file is entry point for PLV8 procedure for Postgresql Ecmascript engine
// This entry point should never be executed in NodeJS or browser environment
// See more documentation here https://plv8.github.io/
import { splitNestedPath, wrapWithCloneArgs } from '@resolve-js/readmodel-base'
import buildUpsertDocument from './build-upsert-document'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import makeNestedPath from './make-nested-path'
import escapeId from './escape-id'
import escapeStr from './escape-str'
import makeSqlQuery from './make-sql-query'

const DependencyError = function () {
  Error.call(this)
  this.name = 'DependencyError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, DependencyError)
  } else {
    this.stack = new Error().stack
  }
}

const checkEnvironment = () => {
  if (
    typeof Promise.installGlobally !== 'function' ||
    typeof Promise.uninstallGlobally !== 'function' ||
    typeof plv8 === undefined
  ) {
    throw new Error(`Should not be executed in NodeJS or browser environment`)
  }
}

// Event loop rules in PLV8 are slightly different from NodeJS environment
// None of the *async* or *await* below have been mistakenly missed
const syncExecuteFailure = {}
const executeSync = (asyncFunc, ...args) => {
  let result = syncExecuteFailure
  let isError = false
  void (async () => {
    try {
      result = await asyncFunc(...args)
    } catch (error) {
      result = error
      isError = true
    }
  })()
  if (isError) {
    throw result
  }
  if (result === syncExecuteFailure) {
    throw new DependencyError('SyncExecuteFailure')
  }

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

const filterFields = (fieldList, inputRow) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be an object with enumerated selected fields'
    )
  }
  const row = { ...inputRow }

  const fieldNames = fieldList != null ? Object.keys(fieldList) : []
  if (fieldList == null || fieldNames.length === 0) {
    return row
  }

  const inclusiveMode = fieldList[fieldNames[0]] === 1
  const resultRow = {}

  for (const key of Object.keys(row)) {
    if (
      (inclusiveMode && fieldList.hasOwnProperty(key)) ||
      (!inclusiveMode && !fieldList.hasOwnProperty(key))
    ) {
      resultRow[key] = row[key]
    }
  }

  return resultRow
}

const executeProjection = async (
  name,
  options,
  readModelName,
  ...inputArgs
) => {
  const args = wrapWithCloneArgs((...currentArgs) => currentArgs)(...inputArgs)
  const methods = { ...baseMethods, ...options }
  switch (name) {
    case 'defineTable':
    case 'insert':
    case 'update':
    case 'delete': {
      await plv8.execute(makeSqlQuery(methods, readModelName, name, ...args))
      return null
    }
    case 'findOne': {
      const result = await plv8.execute(
        makeSqlQuery(methods, readModelName, name, ...args)
      )
      return result.length > 0 ? filterFields(args[2], result[0]) : null
    }
    case 'find': {
      const result = await plv8.execute(
        makeSqlQuery(methods, readModelName, name, ...args)
      )
      return result.map(filterFields.bind(null, args[2]))
    }
    case 'count': {
      const result = await plv8.execute(
        makeSqlQuery(methods, readModelName, name, ...args)
      )
      return result.length > 0 ? +result[0].Count : 0
    }
    default: {
      throw new Error(`Invalid read-model store method ${name}`)
    }
  }
}

const cursorStrToHex = (cursor) => {
  if (
    cursor == null ||
    cursor.constructor !== String ||
    cursor.length !== 2048
  ) {
    throw new Error('Invalid cursor')
  }
  const base64Mapping = [
    // eslint-disable-next-line spellcheck/spell-checker
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  ]
  let result = []
  for (let i = 0; i < cursor.length / 8; i++) {
    let chunk = [...cursor.slice(i * 8, i * 8 + 8)]
    let bin = chunk
      .map((x) => base64Mapping.indexOf(x).toString(2).padStart(6, 0))
      .join('')
    let hex = (+`0b${bin}`).toString(16).padStart(12, 0)
    result.push(hex)
  }
  return result
}

const getStoreAndProjection = (readModel, options) => {
  const { name: readModelName, projection } = readModel
  const store = new Proxy(
    {},
    {
      get(_, key) {
        return executeProjection.bind(null, key, options, readModelName)
      },
      set() {
        throw new Error('Read-model Store API is immutable')
      },
    }
  )
  return { store, projection }
}

const wrapProcedure = (readModel) => (input, options) => {
  checkEnvironment()

  const {
    events: inputEvents,
    eventstoreLocalTableName,
    maxExecutionTime,
  } = input
  if (inputEvents != null && eventstoreLocalTableName != null) {
    throw new Error(
      'Providing events and eventstoreLocalTableName is mutually exclusive'
    )
  }
  let events = inputEvents
  if (eventstoreLocalTableName != null) {
    try {
      events = null
      const databaseNameAsId = escapeId(options.schemaName)
      const ledgerTableNameAsId = escapeId(
        `${options.tablePrefix}__${options.schemaName}__LEDGER__`
      )
      const eventsTableAsId = escapeId(eventstoreLocalTableName)
      const [{ EventTypes, Cursor }] = plv8.execute(`
      SELECT "EventTypes", "Cursor" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
      WHERE "EventSubscriber" = ${escapeStr(readModel.name)}
    `)

      events = plv8.execute(`SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}
      WHERE 1=1 ${
        EventTypes != null && EventTypes.length > 0
          ? `AND "type" IN (${EventTypes.map(escapeStr)})`
          : ''
      } AND (${cursorStrToHex(Cursor)
        .map(
          (threadCounter, threadId) =>
            `"threadId" = ${+threadId} AND "threadCounter" >= x'${threadCounter}'::INT8 `
        )
        .join(' OR ')})
      ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
      LIMIT 1000
    `)
    } catch (err) {
      throw new Error('Local events reading failed')
    }
  }

  if (!Array.isArray(events)) {
    throw new Error('Provided events is not array')
  }
  const { store, projection } = getStoreAndProjection(readModel, options)
  const getVacantTimeInMillis = ((time) => time - Date.now()).bind(
    null,
    Date.now() + maxExecutionTime
  )

  const encryption = new Proxy(
    {},
    {
      get() {
        throw new DependencyError('GetEncryption')
      },
      set() {
        throw new DependencyError('SetEncryption')
      },
    }
  )

  const result = {
    appliedEventsThreadData: [],
    appliedCount: 0,
    successEvent: null,
    failureEvent: null,
    failureError: null,
    status: 'OK_ALL',
  }
  try {
    for (const event of events) {
      try {
        const handler = projection[event.type]
        if (typeof handler === 'function') {
          executeSync(handler, store, event, encryption)
          result.successEvent = event
        }
        result.appliedEventsThreadData.push({
          threadId: event.threadId,
          threadCounter: event.threadCounter,
        })
        result.appliedCount++
        if (
          getVacantTimeInMillis() < 0 &&
          result.appliedCount < events.length
        ) {
          result.status = 'OK_PARTIAL'
          break
        }
      } catch (error) {
        if (error != null && error.name === 'DependencyError') {
          throw error
        }
        result.failureError = serializeError(error)
        result.failureEvent = event
        result.status = 'CUSTOM_ERROR'
        break
      }
    }
  } catch (error) {
    result.status = 'DEPENDENCY_ERROR'
    result.failureError = serializeError(error)
    result.appliedEventsThreadData = []
    result.successEvent = null
    result.failureEvent = null
    result.appliedCount = 0
  }

  return result
}

export default wrapProcedure

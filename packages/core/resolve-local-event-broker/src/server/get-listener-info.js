import { READ_MODEL_STATUS } from '../constants'

const ALLOWED_READ_MODEL_STATUS = Object.values(READ_MODEL_STATUS)

const getListenerInfo = async (
  { database, escapeId, escape, serializedFields },
  listenerId,
  rawResult = false
) => {
  let metaListenerInfo = await database.get(`
    SELECT ${Object.keys(serializedFields)
      .map(escapeId)
      .join(', ')} 
    FROM ${escapeId('Listeners')}
    WHERE ${escapeId('ListenerId')} = ${escape(listenerId)}
  `)

  if (metaListenerInfo != null) {
    for (const fieldName of Object.keys(serializedFields)) {
      metaListenerInfo[fieldName] =
        metaListenerInfo[fieldName] != null
          ? serializedFields[fieldName].parse(metaListenerInfo[fieldName])
          : null
    }
  } else {
    metaListenerInfo = null
  }

  if (rawResult) {
    return metaListenerInfo
  }

  const actualInfo = {
    currentSkipCount: 0,
    abutTimestamp: 0,
    skipCount: 0,
    status: READ_MODEL_STATUS.running,
    isFirstRun: false,
    properties: {}
  }

  if (metaListenerInfo == null) {
    actualInfo.isFirstRun = true
    return actualInfo
  }

  Object.assign(actualInfo, {
    abutTimestamp: Number(metaListenerInfo.AbutTimestamp),
    skipCount: Number(metaListenerInfo.SkipCount),
    properties: Object(metaListenerInfo.Properties),
    status: metaListenerInfo.Status
  })

  if (!ALLOWED_READ_MODEL_STATUS.includes(actualInfo.status)) {
    throw new Error(`Read model invalid status: ${actualInfo.status}`)
  }

  return actualInfo
}

export default getListenerInfo

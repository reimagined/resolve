import { READ_MODEL_STATUS } from './constants'

const ALLOWED_READ_MODEL_STATUS = Object.values(READ_MODEL_STATUS)

const getListenerInfo = async (pool, listenerId) => {
  const metaListenerInfo = await pool.meta.getListenerInfo(listenerId)
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

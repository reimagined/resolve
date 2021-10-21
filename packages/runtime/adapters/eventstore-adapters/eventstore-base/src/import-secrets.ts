import stream from 'stream'
import { EOL } from 'os'

import {
  BUFFER_SIZE,
  PARTIAL_SECRET_FLAG,
  BATCH_SIZE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
} from './constants'

import { ResourceNotExistError } from './resource-errors'
import { AdapterBoundPool, ImportSecretsOptions } from './types'

type ImportStreamContext = {
  pool: any
  maintenanceMode: ImportSecretsOptions['maintenanceMode']
}

const SecretsStream = function (
  this: any,
  { pool, maintenanceMode }: ImportStreamContext
): void {
  stream.Writable.call(this, { objectMode: true })

  this.pool = pool
  this.byteOffset = 0
  this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
  this.beginPosition = 0
  this.endPosition = 0
  this.vacantSize = BUFFER_SIZE
  this.injectSecretPromiseSet = new Set()
  this.savedErrors = []
  this.maxIdx = 0
  this.maintenanceMode = maintenanceMode
  this.isMaintenanceInProgress = false
  this.parsedRecordCount = 0
  this.bypassMode = false

  this.on('timeout', () => {
    this.externalTimeout = true
  })
}

SecretsStream.prototype = Object.create(stream.Writable.prototype)
SecretsStream.prototype.constructor = stream.Writable

SecretsStream.prototype._write = async function (
  chunk: any,
  encoding: any,
  callback: any
): Promise<void> {
  if (this.bypassMode) {
    await new Promise((resolve) => setImmediate(resolve))
    callback()
    return
  }

  try {
    const { dropSecrets, initSecrets, freeze, injectSecret }: any = this.pool

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === false
    ) {
      this.isMaintenanceInProgress = true
      try {
        await dropSecrets()
      } catch (error) {
        if (!ResourceNotExistError.is(error)) {
          throw error
        }
      }
      await initSecrets()
      await freeze()
    }

    if (this.encoding == null) {
      this.encoding = encoding
    } else if (this.encoding !== encoding) {
      throw new Error('Multiple encodings not supported')
    }
    if (chunk.byteLength > this.vacantSize) {
      throw new Error('Buffer overflow')
    }

    if (chunk.byteLength + this.endPosition <= BUFFER_SIZE) {
      chunk.copy(this.buffer, this.endPosition)
    } else {
      chunk.copy(
        this.buffer,
        this.endPosition,
        0,
        BUFFER_SIZE - this.endPosition
      )
      chunk.copy(
        this.buffer,
        0,
        BUFFER_SIZE - this.endPosition,
        chunk.byteLength
      )
    }
    this.endPosition = (this.endPosition + chunk.byteLength) % BUFFER_SIZE
    this.vacantSize -= chunk.byteLength

    if (this.vacantSize === BUFFER_SIZE) {
      callback()
      return
    }

    let eolPosition = 0
    while (true) {
      eolPosition = chunk.indexOf('\n', eolPosition, this.encoding)
      if (eolPosition < 0) {
        break
      } else {
        eolPosition++
      }

      const endRecordPosition: number =
        (BUFFER_SIZE + this.endPosition - chunk.byteLength + eolPosition) %
        BUFFER_SIZE
      let stringifiedRecord = null
      let recordByteLength = 0

      if (this.beginPosition < endRecordPosition) {
        stringifiedRecord = this.buffer
          .slice(this.beginPosition, endRecordPosition)
          .toString(this.encoding)

        recordByteLength += endRecordPosition - this.beginPosition
      } else {
        stringifiedRecord = this.buffer
          .slice(this.beginPosition, BUFFER_SIZE)
          .toString(this.encoding)
        stringifiedRecord += this.buffer
          .slice(0, endRecordPosition)
          .toString(this.encoding)

        recordByteLength += BUFFER_SIZE - this.beginPosition + endRecordPosition
      }

      this.vacantSize += recordByteLength
      this.beginPosition = endRecordPosition
      this.byteOffset += recordByteLength

      const secret: any = JSON.parse(stringifiedRecord)

      this.maxIdx = Math.max(this.maxIdx, secret.idx)

      const injectSecretPromise = injectSecret(secret).catch(
        this.savedErrors.push.bind(this.savedErrors)
      )
      void injectSecretPromise.then(
        this.injectSecretPromiseSet.delete.bind(
          this.injectSecretPromiseSet,
          injectSecretPromise
        )
      )
      this.injectSecretPromiseSet.add(injectSecretPromise)

      if (this.parsedRecordCount++ >= BATCH_SIZE) {
        await Promise.all([...this.injectSecretPromiseSet])
        if (this.externalTimeout === true) {
          this.bypassMode = true
        }
        this.parsedRecordCount = 0
      }
    }

    callback()
  } catch (error) {
    callback(error)
  }
}

SecretsStream.prototype._final = async function (callback: any): Promise<void> {
  if (this.bypassMode) {
    try {
      await Promise.all([...this.injectSecretPromiseSet])
      callback()
    } catch (err) {
      callback(err)
    } finally {
      this.buffer = null
    }
    return
  }

  try {
    const { unfreeze, injectSecret } = this.pool

    if (this.vacantSize !== BUFFER_SIZE) {
      let stringifiedRecord = null
      let recordByteLength = 0

      if (this.beginPosition < this.endPosition) {
        stringifiedRecord = this.buffer
          .slice(this.beginPosition, this.endPosition)
          .toString(this.encoding)

        recordByteLength += this.endPosition - this.beginPosition
      } else {
        stringifiedRecord = this.buffer
          .slice(this.beginPosition, BUFFER_SIZE)
          .toString(this.encoding)
        stringifiedRecord += this.buffer
          .slice(0, this.endPosition)
          .toString(this.encoding)

        recordByteLength += BUFFER_SIZE - this.beginPosition + this.endPosition
      }

      let secret: any = PARTIAL_SECRET_FLAG
      try {
        secret = JSON.parse(stringifiedRecord)
      } catch {}

      if (secret !== PARTIAL_SECRET_FLAG) {
        this.maxIdx = Math.max(this.maxIdx, secret.idx)

        this.byteOffset += recordByteLength

        const injectSecretPromise: any = injectSecret(secret).catch(
          this.savedErrors.push.bind(this.savedErrors)
        )
        void injectSecretPromise.then(
          this.injectSecretPromiseSet.delete.bind(
            this.injectSecretPromiseSet,
            injectSecretPromise
          )
        )
        this.injectSecretPromiseSet.add(injectSecretPromise)
      }
    }

    await Promise.all([...this.injectSecretPromiseSet])

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === true
    ) {
      this.isMaintenanceInProgress = false
      await unfreeze()
    }

    if (this.savedErrors.length > 0) {
      const error = new Error(
        this.savedErrors.map(({ message }: any) => message).join(EOL)
      )
      error.stack = this.savedErrors.map(({ stack }: any) => stack).join(EOL)
      throw error
    }

    callback()
  } catch (error) {
    callback(error)
  } finally {
    this.buffer = null
  }
}

const importSecretsStream = <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  {
    maintenanceMode = MAINTENANCE_MODE_AUTO,
  }: Partial<ImportSecretsOptions> = {}
): stream.Writable => {
  if (pool.injectSecret === undefined)
    throw new Error('injectSecret is not defined for this adapter')

  switch (maintenanceMode) {
    case MAINTENANCE_MODE_AUTO:
    case MAINTENANCE_MODE_MANUAL:
      return new (SecretsStream as any)({
        pool,
        maintenanceMode,
      })
    default:
      throw new Error(`Wrong maintenance mode ${String(maintenanceMode)}`)
  }
}

export default importSecretsStream

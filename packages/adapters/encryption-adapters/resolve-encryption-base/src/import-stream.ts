import Stream from 'stream'
import { Pool, Secret } from './types'

import {
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  BATCH_SIZE,
  PARTIAL_EVENT_FLAG,
  BUFFER_SIZE
} from './constants'

export class ImportStream<Database> extends Stream.Writable {
  pool: Pool<Database>
  byteOffset: number
  sequenceIndex: number
  buffer: Buffer | null

  beginPosition = 0
  endPosition = 0
  vacantSize = BUFFER_SIZE

  saveSecretPromiseSet: Set<Promise<void | number>>
  saveSecretErrors: Array<Error> = []
  timestamp = 0
  maintenanceMode: symbol
  isMaintenanceInProgress = false
  parsedSecretsCount = 0
  bypassMode = false
  externalTimeout = false
  waitConnect: (pool: Pool<Database>) => Promise<void>

  encoding?: string | null

  constructor({
    pool,
    maintenanceMode,
    byteOffset,
    sequenceIndex
  }: {
    pool: Pool<Database>
    maintenanceMode: symbol
    byteOffset: number
    sequenceIndex: number
  }) {
    super()
    Stream.Writable.call(this, { objectMode: true })

    this.pool = pool
    this.byteOffset = byteOffset
    this.sequenceIndex = sequenceIndex
    this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
    this.saveSecretPromiseSet = new Set()
    this.maintenanceMode = maintenanceMode
    this.encoding = null

    this.on('timeout', () => {
      this.externalTimeout = true
    })

    this.waitConnect = async (pool: Pool<Database>): Promise<void> => {
      pool.isInitialized = true
      await pool.connectPromiseResolve()
      await pool.connectPromise
    }
  }

  async _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    if (this.bypassMode) {
      await new Promise(resolve => setImmediate(resolve))
      callback()
      return
    }

    try {
      await this.waitConnect(this.pool)
      /*     const { drop, init, freeze, saveSecretOnly } = this.pool.store

    if (
      this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
      this.isMaintenanceInProgress === false
    ) {
      this.isMaintenanceInProgress = true
      await drop()
      await init()
      await freeze()
    } */

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

        const endSecretPosition =
          (BUFFER_SIZE + this.endPosition - chunk.byteLength + eolPosition) %
          BUFFER_SIZE
        let stringifiedSecret = null
        let secretByteLength = 0

        if (this.beginPosition < endSecretPosition) {
          stringifiedSecret = this.buffer
            ? this.buffer
                .slice(this.beginPosition, endSecretPosition)
                .toString(this.encoding)
            : ''

          secretByteLength += endSecretPosition - this.beginPosition
        } else {
          stringifiedSecret = this.buffer
            ? this.buffer
                .slice(this.beginPosition, BUFFER_SIZE)
                .toString(this.encoding)
            : ''
          stringifiedSecret += this.buffer
            ? this.buffer.slice(0, endSecretPosition).toString(this.encoding)
            : ''

          secretByteLength +=
            BUFFER_SIZE - this.beginPosition + endSecretPosition
        }

        this.vacantSize += secretByteLength
        this.beginPosition = endSecretPosition
        this.byteOffset += secretByteLength

        const secret = JSON.parse(stringifiedSecret)
        secret[Symbol.for('sequenceIndex')] = this.sequenceIndex++
        // this.timestamp = Math.max(this.timestamp, secret.timestamp)

        // const saveSecretPromise = saveSecretOnly(secret).catch(
        const saveSecretPromise = this.pool.store
          .set(secret.id, secret.key)
          .catch(this.saveSecretErrors.push.bind(this.saveSecretErrors))
        void saveSecretPromise.then(
          this.saveSecretPromiseSet.delete.bind(
            this.saveSecretPromiseSet,
            saveSecretPromise
          )
        )
        this.saveSecretPromiseSet.add(saveSecretPromise)

        if (this.parsedSecretsCount++ >= BATCH_SIZE) {
          await Promise.all([...this.saveSecretPromiseSet])
          if (this.externalTimeout === true) {
            this.bypassMode = true
          }
          this.parsedSecretsCount = 0
        }
      }

      callback()
    } catch (error) {
      callback(error)
    }
  }

  async _final(callback: (error?: Error | null) => void): Promise<void> {
    if (this.bypassMode) {
      await new Promise(resolve => setImmediate(resolve))
      this.buffer = null
      callback()
      return
    }

    try {
      await this.waitConnect(this.pool)
      // const { unfreeze, saveEventOnly } = this.pool

      if (this.vacantSize !== BUFFER_SIZE) {
        let stringifiedSecret = null
        let eventByteLength = 0

        if (this.beginPosition < this.endPosition) {
          stringifiedSecret = this.buffer
            ? this.buffer
                .slice(this.beginPosition, this.endPosition)
                .toString(this.encoding === null ? undefined : this.encoding)
            : ''

          eventByteLength += this.endPosition - this.beginPosition
        } else {
          stringifiedSecret = this.buffer
            ? this.buffer
                .slice(this.beginPosition, BUFFER_SIZE)
                .toString(this.encoding === null ? undefined : this.encoding)
            : ''
          stringifiedSecret += this.buffer
            ? this.buffer
                .slice(0, this.endPosition)
                .toString(this.encoding === null ? undefined : this.encoding)
            : ''

          eventByteLength += BUFFER_SIZE - this.beginPosition + this.endPosition
        }

        interface SecretObject {
          id: string | null
          key: string | null
        }

        let secret: SecretObject // symbol | object = PARTIAL_EVENT_FLAG

        try {
          secret = JSON.parse(stringifiedSecret)
        } catch {
          secret = { id: null, key: null }
        }

        // if (secret !== PARTIAL_EVENT_FLAG) {
        if (secret.id != null && secret.key != null) {
          // secret[Symbol.for('sequenceIndex')] = this.sequenceIndex++
          // this.timestamp = Math.max(this.timestamp, event.timestamp)

          this.byteOffset += eventByteLength

          const secretKey: string = secret.key
          const secretId: string = secret.id

          // const saveSecretPromise = saveSecretOnly(secret).catch(
          const saveSecretPromise = this.pool.store
            .set(secretId, secretKey)
            .catch(this.saveSecretErrors.push.bind(this.saveSecretErrors))
          void saveSecretPromise.then(
            this.saveSecretPromiseSet.delete.bind(
              this.saveSecretPromiseSet,
              saveSecretPromise
            )
          )
          this.saveSecretPromiseSet.add(saveSecretPromise)
        }
      }

      await Promise.all([...this.saveSecretPromiseSet])

      if (
        this.maintenanceMode === MAINTENANCE_MODE_AUTO &&
        this.isMaintenanceInProgress === true
      ) {
        this.isMaintenanceInProgress = false
        // await unfreeze()
      }

      if (this.saveSecretErrors.length > 0) {
        throw new Error(this.saveSecretErrors.join('\n'))
      }
      callback()
    } catch (error) {
      callback(error)
    }
  }
}

function createImportStream<Database>(
  pool: Pool<Database>,
  {
    // maintenanceMode = MAINTENANCE_MODE_AUTO,
    byteOffset = 0,
    sequenceIndex = 1
  }
): ImportStream<Database> {
  const maintenanceMode = MAINTENANCE_MODE_AUTO

  return new ImportStream({
    pool,
    maintenanceMode,
    byteOffset,
    sequenceIndex
  })
}

export default createImportStream

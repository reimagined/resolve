import Stream from 'stream'
import { Pool } from './types'

import {
  KEYS_TABLE,
  MAINTENANCE_MODE_AUTO,
  MAINTENANCE_MODE_MANUAL,
  BATCH_SIZE
} from './constants'

export class ExportStream<Database> extends Stream.Readable {
  secretsByteSize = 0
  pool: Pool<Database>
  initialCursor: number
  offset: number
  readerId: any = null
  bufferSize: number
  initPromise: Promise<void | Error>
  initError: Error | null

  cursor: number | null
  lastSecretOffset: number | null = null
  // this.injectString = injectString.bind(this, pool)
  // this.injectNumber = injectNumber.bind(this, pool)
  maintenanceMode: symbol
  isBufferOverflow = false

  isLastBatch = false
  isStreamPaused = false

  rows: any[] = []

  constructor({
    pool,
    maintenanceMode,
    cursor,
    bufferSize
  }: {
    pool: Pool<Database>
    maintenanceMode: symbol
    cursor: number
    bufferSize: number
  }) {
    super()
    Stream.Readable.call(this, { objectMode: true })

    this.pool = pool
    this.cursor = cursor
    this.initialCursor = cursor
    this.offset = cursor
    this.bufferSize = bufferSize
    this.initError = null

    const waitConnect = async (pool: Pool<Database>): Promise<void> => {
      pool.isInitialized = true
      await pool.connectPromiseResolve()
      await pool.connectPromise
    }
    this.initPromise = waitConnect(pool)
      .then(this.startProcessSecrets.bind(this))
      .catch((error: Error) => (this.initError = error))

    // this.injectString = injectString.bind(this, pool)
    // this.injectNumber = injectNumber.bind(this, pool)
    this.maintenanceMode = maintenanceMode

    this.rows = []
  }

  async startProcessSecrets(): Promise<void> {
    try {
      if (this.maintenanceMode === MAINTENANCE_MODE_AUTO) {
        // await Object.freeze(this.pool) // TODO: freeze
      }
    } catch (error) {
      this.emit('error', error)
    }
  }

  async endProcessSecrets(): Promise<void> {
    try {
      if (this.maintenanceMode === MAINTENANCE_MODE_AUTO) {
        // await Object.unfreeze(this.pool) // TODO: unfreeze
      }
    } catch (error) {
      this.emit('error', error)
    }
  }

  processSecrets(): void {
    for (
      let secret = this.rows.shift();
      secret != null;
      secret = this.rows.shift()
    ) {
      if (this.destroyed) {
        this.rows.length = 0
        return
      } else {
        const secretOffset = secret.secretOffset
        delete secret.secretOffset
        delete secret[Symbol.for('sequenceIndex')]

        let chunk: Buffer | null = Buffer.from(
          JSON.stringify(secret) + '\n',
          'utf8'
        )
        const byteLength = chunk.byteLength
        if (this.secretsByteSize + byteLength > this.bufferSize) {
          this.isBufferOverflow = true
          chunk = null
          this.cursor = secretOffset
        } else {
          this.lastSecretOffset = secretOffset
        }
        this.secretsByteSize += byteLength

        const isPaused = this.push(chunk) === false

        if (isPaused) {
          this.isStreamPaused = true
          return
        }
      }
    }

    if (this.isLastBatch) {
      if (this.cursor == null) {
        this.cursor = this.offset
      }
      this.push(null)
    }
  }

  async secretReader(currentReaderId: any): Promise<void> {
    try {
      await this.initPromise
      while (true) {
        if (this.readerId !== currentReaderId) {
          throw new Error('Reader thread changed before done')
        }
        let nextRows: any = null

        if (this.initError !== null) {
          throw this.initError
        }

        if (this.pool.store.paginateSecrets != null) {
          nextRows = await this.pool.store.paginateSecrets(
            this.offset,
            BATCH_SIZE
          )
        } else {
          nextRows = []
        }

        if (nextRows.length === 0 && !this.isLastBatch) {
          this.isLastBatch = true
          await this.endProcessSecrets()
        }

        if (this.readerId !== currentReaderId) {
          throw new Error('Reader thread changed before done')
        }

        for (let index = 0; index < nextRows.length; index++) {
          const secret = { ...nextRows[index] }
          secret.secretOffset = this.offset + index
          this.rows.push(secret)
        }
        this.offset += nextRows.length
        this.processSecrets()
        if (this.isStreamPaused || nextRows.length === 0) {
          this.readerId = null
          return
        }
      }
    } catch (error) {
      this.emit('error', error)
      if (!this.destroyed) {
        this.push(null)
      }
      this.readerId = Symbol()
    }
  }

  _read(): void {
    this.processSecrets()

    if (this.readerId == null) {
      this.readerId = Symbol()
      void this.secretReader(this.readerId)
    }
  }

  end(): void {
    this.readerId = Symbol()
    this.rows.length = 0
    if (this.lastSecretOffset == null) {
      this.cursor = this.initialCursor
    } else {
      this.cursor = this.lastSecretOffset + 1
    }
    this.push(null)
  }
}

function createExportStream<Database>(
  pool: Pool<Database>,
  {
    cursor = 0,
    // maintenanceMode = MAINTENANCE_MODE_AUTO,
    bufferSize = Number.POSITIVE_INFINITY
  }
): ExportStream<Database> {
  const maintenanceMode = MAINTENANCE_MODE_AUTO

  return new ExportStream({
    pool,
    maintenanceMode,
    cursor,
    bufferSize
  })
}

export default createExportStream

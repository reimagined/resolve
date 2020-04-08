import { v4 } from 'uuid'
import { AggregateId, EncryptionKey } from 'resolve-encryption-base'
import { Database } from 'sqlite'

import connect from './connect'
import { KeyStoreOptions } from './types'

export type KeyStore = {
  create: (selector: AggregateId) => Promise<EncryptionKey>
  get: (selector: AggregateId) => Promise<EncryptionKey | null>
  set: (selector: AggregateId, key: EncryptionKey) => Promise<void>
  forget: (selector: AggregateId) => Promise<void>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: (database: Database) => Promise<void>
}

const keysTable = 'keys'
let database: Database

// TODO: move calling adapter.init() to resolve
const initDatabase = (database: Database): Promise<Database> =>
  database.exec(`CREATE TABLE IF NOT EXISTS ${keysTable} (
    id uuid NOT NULL,
    key text,
    PRIMARY KEY(id)
  )`)

const getDatabase = async (options: KeyStoreOptions): Promise<Database> => {
  if (!database) {
    database = await connect(options)
    await initDatabase(database)
  }
  return database
}

export const createStore = (options: KeyStoreOptions): KeyStore => ({
  create: (): Promise<EncryptionKey> => Promise.resolve(v4()),
  get: async (selector: AggregateId): Promise<EncryptionKey | null> => {
    const connection = await getDatabase(options)
    const keyRecord = await connection.get(
      `SELECT key FROM ${keysTable} WHERE id = ?`,
      selector as string
    )
    // console.log('--- keyRecord from storage', keyRecord)
    return keyRecord ? keyRecord.key : null
  },
  set: async (selector: AggregateId, key: EncryptionKey): Promise<void> => {
    const connection = await getDatabase(options)
    await connection.exec(
      `INSERT INTO ${keysTable}(id, key) VALUES ("${selector}","${key}")`
    )
  },
  forget: async (selector: AggregateId): Promise<void> => {
    const connection = await getDatabase(options)
    await connection.exec(`DELETE FROM ${keysTable} WHERE id="${selector}"`)
  },
  init: async (): Promise<void> => {
    const connection = await getDatabase(options)
    await initDatabase(connection)
  },
  drop: async (): Promise<void> => {
    const connection = await getDatabase(options)
    await connection.exec(`DROP TABLE IF NOT EXISTS ${keysTable}`)
  },
  dispose: async (database: Database): Promise<void> => {
    if (database) {
      database.close()
    }
  }
})

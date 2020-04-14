import { v4 } from 'uuid'
import {
  AggregateId,
  EncryptionKey,
  KeyStore,
  Pool
} from 'resolve-encryption-base'
import { Database } from 'sqlite'

const keysTable = 'keys'

export const createStore = (pool: Pool<Database>): KeyStore => {
  return {
    create: (): Promise<EncryptionKey> => Promise.resolve(v4()),
    get: async (selector: AggregateId): Promise<EncryptionKey | null> => {
      const { database } = pool
      const keyRecord = await database.get(
        `SELECT key FROM ${keysTable} WHERE id = ?`,
        selector as string
      )
      return keyRecord ? keyRecord.key : null
    },
    set: async (selector: AggregateId, key: EncryptionKey): Promise<void> => {
      const { database } = pool
      try {
        await database.exec(
          `BEGIN IMMEDIATE;
        INSERT INTO ${keysTable}(idx, id, key) VALUES (
          "(SELECT max(idx) + 1 FROM ${keysTable})",
          "${selector}",
          "${key}"
        );
        COMMIT;`
        )
      } catch (error) {
        try {
          await database.exec('ROLLBACK;')
        } catch (e) {}

        throw error
      }
    },
    forget: async (selector: AggregateId): Promise<void> => {
      const { database } = pool
      await database.exec(`DELETE FROM ${keysTable} WHERE id="${selector}"`)
    },
    init: async (): Promise<void> => {
      const { database } = pool
      await database.exec(`CREATE TABLE IF NOT EXISTS ${keysTable} (
        idx BIG INT NOT NULL,
        id uuid NOT NULL,
        key text,
        PRIMARY KEY(id, idx)
      )`)
    },
    drop: async (): Promise<void> => {
      const { database } = pool
      await database.exec(`DROP TABLE IF EXISTS ${keysTable}`)
    },
    dispose: async (): Promise<void> => {
      const { database } = pool
      await database.close()
    }
  }
}

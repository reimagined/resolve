import { v4 } from 'uuid'
import {
  AggregateId,
  EncryptionKey,
  KeyStore,
  Pool
} from 'resolve-encryption-base'
import { Database } from 'sqlite'

import { KEYS_TABLE } from './constants'
import shapeSecret from './shape-secret'

export const createStore = (pool: Pool<Database>): KeyStore => {
  return {
    create: (): Promise<EncryptionKey> => Promise.resolve(v4()),
    get: async (selector: AggregateId): Promise<EncryptionKey | null> => {
      const { database } = pool
      const keyRecord = await database.get(
        `SELECT key FROM ${KEYS_TABLE} WHERE id = ?`,
        selector as string
      )
      return keyRecord ? keyRecord.key : null
    },
    set: async (selector: AggregateId, key: EncryptionKey): Promise<void> => {
      const { database } = pool
      try {
        await database.exec(
          `BEGIN IMMEDIATE;
        INSERT INTO ${KEYS_TABLE}(idx, id, key) VALUES (
          ((SELECT IFNULL(MAX(idx), 0) + 1 FROM ${KEYS_TABLE})),
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
      await database.exec(`DELETE FROM ${KEYS_TABLE} WHERE id="${selector}"`)
    },
    init: async (): Promise<void> => {
      const { database } = pool
      await database.exec(`CREATE TABLE IF NOT EXISTS ${KEYS_TABLE} (
        idx BIG INT NOT NULL,
        id uuid NOT NULL,
        key text,
        PRIMARY KEY(id, idx)
      )`)
    },
    drop: async (): Promise<void> => {
      const { database } = pool
      await database.exec(`DROP TABLE IF EXISTS ${KEYS_TABLE}`)
    },
    dispose: async (): Promise<void> => {
      const { database } = pool
      await database.close()
    },
    paginateSecrets: async (
      offset: number,
      batchSize: number
    ): Promise<object[]> => {
      const { database } = pool
      const rows = await database.all(
        `SELECT * FROM ${KEYS_TABLE}
        ORDER BY "idx" ASC
        LIMIT ${+offset}, ${+batchSize}`
      )

      const resultRows = []
      for (let index = 0; index < rows.length; index++) {
        const secret = rows[index]
        resultRows.push(
          shapeSecret(secret, { [Symbol.for('sequenceIndex')]: offset + index })
        )
      }

      return resultRows
    }
  }
}

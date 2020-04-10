import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { executeStatement } from 'resolve-cloud-common/postgres'
import { v4 } from 'uuid'
import {
  AggregateId,
  EncryptionKey,
  KeyStore,
  Pool
} from 'resolve-encryption-base'
import { KeyStoreOptions } from './types'

export const createStore = (
  pool: Pool<RDSDataService>,
  options: KeyStoreOptions
): KeyStore => {
  const credentials = {
    Region: options.region,
    ResourceArn: options.resourceArn,
    SecretArn: options.secretArn
  }
  const { databaseName, tableName } = options
  return {
    create: (): Promise<EncryptionKey> => Promise.resolve(v4()),
    get: async (selector: AggregateId): Promise<EncryptionKey | null> => {
      const queryResult = await executeStatement({
        ...credentials,
        Sql: `SELECT * FROM "${databaseName}".${tableName} WHERE "id"='${selector}' LIMIT 1`
      })
      if (queryResult.length) {
        return queryResult[0].key
      }

      return null
    },
    set: async (selector: AggregateId, key: EncryptionKey): Promise<void> => {
      executeStatement({
        ...credentials,
        Sql: `INSERT INTO "${databaseName}".${tableName}("id", "key") values ('${selector}', '${key}')`
      })
    },
    forget: async (selector: AggregateId): Promise<void> => {
      executeStatement({
        ...credentials,
        Sql: `DELETE FROM "${databaseName}".${tableName} WHERE "id"='${selector}'`
      })
    },
    init: async (): Promise<void> => {
      executeStatement({
        ...credentials,
        Sql: `CREATE TABLE IF NOT EXISTS "${databaseName}".${tableName} (
            id uuid NOT NULL,
            key text COLLATE pg_catalog."default",
            CONSTRAINT keys_pkey PRIMARY KEY (id)
        )`
      })
    },
    drop: async (): Promise<void> => {
      executeStatement({
        ...credentials,
        Sql: `DROP TABLE IF EXISTS "${databaseName}".${tableName}`
      })
    },
    dispose: async (): Promise<void> => {}
  }
}

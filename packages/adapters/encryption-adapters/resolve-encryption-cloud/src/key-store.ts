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
import shapeSecret from './shape-secret'

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
        Sql: `CREATE TABLE IF NOT EXISTS "${databaseName}"."${tableName}" (
            idx BIGSERIAL,
            id uuid NOT NULL PRIMARY KEY,
            key text COLLATE pg_catalog."default"
          );
          CREATE UNIQUE INDEX IF NOT EXISTS keys_index on "${databaseName}"."${tableName}"(idx);
          `
      })
    },
    paginateSecrets: async (
      offset: number,
      batchSize: number
    ): Promise<object[]> => {
      const queryResult = await executeStatement({
        ...credentials,
        Sql: `SELECT * FROM "${databaseName}".${tableName} ORDER BY "idx" OFFSET ${+offset} LIMIT ${+batchSize}`
      })

      const resultRows = []
      for (let index = 0; index < queryResult.length; index++) {
        const secret = {
          id: queryResult[index].id,
          key: queryResult[index].key
        }
        resultRows.push(shapeSecret(secret, {}))
      }

      return resultRows
    },
    drop: async (): Promise<void> => {
      executeStatement({
        ...credentials,
        Sql: `DROP INDEX IF EXISTS "${databaseName}"."keys_index";
          DROP TABLE IF EXISTS "${databaseName}"."${tableName}";`
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispose: async (): Promise<void> => {}
  }
}

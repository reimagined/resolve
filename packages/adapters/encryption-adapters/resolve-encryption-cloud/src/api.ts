import { executeStatement } from 'resolve-cloud-common/postgres'
import { v4 as uuid4 } from 'uuid'

/*
CREATE TABLE "deployment-id".keys
(
    id uuid NOT NULL,
    key text COLLATE pg_catalog."default",
    CONSTRAINT keys_pkey PRIMARY KEY (id)
)
*/

type CloudCredentials = {
  Region: string
  ResourceArn: string
  SecretArn: string
}

const database = process.env.RESOLVE_ES_DATABASE
const tableName: string = process.env.RESOLVE_KEYS_TABLE || 'keys'
const credentials: CloudCredentials = {
  Region: process.env.AWS_REGION || '',
  ResourceArn: process.env.RESOLVE_ES_CLUSTER_ARN || '',
  SecretArn: process.env.RESOLVE_ES_SECRET_STORE_ARN || ''
}

export const getKey = async (keyId: string): Promise<string | null> => {
  const queryResult = await executeStatement({
    ...credentials,
    Sql: `SELECT * FROM "${database}".${tableName} WHERE "id"='${keyId}' LIMIT 1`
  })
  if (queryResult.length) {
    return queryResult[0].key
  }

  return null
}

export const insertKey = async (
  keyId: string,
  keyValue: string
): Promise<Array<{ [key: string]: any }>> =>
  executeStatement({
    ...credentials,
    Sql: `INSERT INTO "${database}".${tableName}("id", "key") values ('${keyId}', '${keyValue}')`
  })

export const forgetKey = async (
  keyId: string
): Promise<Array<{ [key: string]: any }>> =>
  executeStatement({
    ...credentials,
    Sql: `DELETE FROM "${database}".${tableName} WHERE "id"='${keyId}'`
  })

// TODO: generate proper key, not just random sequence
export const generateKey = (): string => uuid4()

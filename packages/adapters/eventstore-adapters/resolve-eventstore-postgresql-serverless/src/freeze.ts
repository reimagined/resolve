import { AdapterPool } from './types'
import { EventstoreAlreadyFrozenError } from 'resolve-eventstore-base'

const freeze = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}: AdapterPool): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`)

  try {
    await executeStatement(
      `CREATE TABLE ${databaseNameAsId}.${freezeTableNameAsId} (
      "surrogate" BIGINT NOT NULL,
      PRIMARY KEY("surrogate")
    );
    COMMENT ON TABLE ${databaseNameAsId}.${freezeTableNameAsId}
    IS 'RESOLVE EVENT STORE ${freezeTableNameAsId} FREEZE MARKER';
    `
    )
  } catch (error) {
    throw new EventstoreAlreadyFrozenError()
  }
}

export default freeze

import { EOL } from 'os';
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base';
import getLog from './get-log';

const drop = async ({
  databaseName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
}) => {
  const log = getLog(`dropEventStore`);

  const databaseNameAsId = escapeId(databaseName);
  const eventsTableNameAsId = escapeId(eventsTableName);
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`);
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`);
  const snapshotsTableNameAsId = escapeId(snapshotsTableName);

  const aggregateIdAndVersionIndexName = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  );
  const aggregateIndexName = escapeId(`${eventsTableName}-aggregateId`);
  const aggregateVersionIndexName = escapeId(
    `${eventsTableName}-aggregateVersion`
  );
  const typeIndexName = escapeId(`${eventsTableName}-type`);
  const timestampIndexName = escapeId(`${eventsTableName}-timestamp`);

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${eventsTableNameAsId}`,

    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIdAndVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${aggregateVersionIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${typeIndexName}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${timestampIndexName}`,

    `DROP TABLE ${databaseNameAsId}.${threadsTableNameAsId}`,

    `DROP TABLE ${databaseNameAsId}.${snapshotsTableNameAsId}`,

    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`,
  ];
  const errors = [];

  for (const statement of statements) {
    try {
      await executeStatement(statement);
    } catch (error) {
      if (error != null) {
        if (/Table.*? does not exist$/i.test(error.message)) {
          throw new EventstoreResourceNotExistError(
            `duplicate event store resource drop detected`
          );
        } else {
          log.error(error.message);
          log.verbose(error.stack);
        }
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.stack).join(EOL));
  }
};

export default drop;

import getLog from './js/get-log';
import { SecretsManager } from 'resolve-core';
import { AdapterPool } from './types';

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const log = getLog('secretsManager:getSecret');
  log.debug(`retrieving secret value from the database`);

  const { secretsDatabase, secretsTableName, escapeId } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`secretsDatabase: ${secretsDatabase}`);
  log.verbose(`secretsTableName: ${secretsTableName}`);

  log.debug(`executing SQL query`);
  const keyRecord = await secretsDatabase.get(
    `SELECT "secret" FROM ${escapeId(secretsTableName)} WHERE id = ?`,
    selector
  );

  log.debug(`query executed, returning result`);

  const { secret } = keyRecord || { secret: null };

  return secret;
};

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret');
  log.debug(`setting secret value within database`);
  const { secretsDatabase, secretsTableName, escape, escapeId } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`secretsDatabase: ${secretsDatabase}`);
  log.verbose(`secretsTableName: ${secretsTableName}`);

  const tableId = escapeId(secretsTableName);

  try {
    log.debug(`executing SQL query`);
    await secretsDatabase.exec(
      `BEGIN IMMEDIATE;
       INSERT INTO ${tableId}(
        "idx", 
        "id", 
        "secret"
        ) VALUES (
         COALESCE(
          (SELECT MAX("idx") FROM ${tableId}) + 1,
          0
         ),
         ${escape(selector)},
         ${escape(secret)}
       );
       COMMIT;`
    );
    log.debug(`query executed successfully`);
  } catch (error) {
    log.error(error.message);
    log.verbose(error.stack);
    try {
      log.debug(`rolling back`);
      await secretsDatabase.exec('ROLLBACK;');
    } catch (e) {
      log.error(e.message);
      log.verbose(e.stack);
    }
    throw error;
  }
};

const deleteSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<void> => {
  const log = getLog('secretsManager:deleteSecret');
  log.debug(`removing secret from the database`);
  const { secretsDatabase, secretsTableName, escapeId } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`secretsDatabase: ${secretsDatabase}`);
  log.verbose(`secretsTableName: ${secretsTableName}`);

  log.debug(`executing SQL query`);
  await secretsDatabase.exec(
    `DELETE FROM ${escapeId(secretsTableName)} WHERE id="${selector}"`
  );
  log.debug(`query executed successfully`);
};

const getSecretsManager = (pool: AdapterPool): SecretsManager => {
  const log = getLog('getSecretsManager');
  log.debug('building secrets manager');
  const manager = Object.freeze({
    getSecret: getSecret.bind(null, pool),
    setSecret: setSecret.bind(null, pool),
    deleteSecret: deleteSecret.bind(null, pool),
  });
  log.debug('secrets manager built');
  return manager;
};

export default getSecretsManager;

import getLog from './js/get-log';
import { SecretsManager } from 'resolve-core';
import { AdapterPool } from './types';

const getSecret = async (
  pool: AdapterPool,
  selector: string
): Promise<string> => {
  const log = getLog('secretsManager:getSecret');
  log.debug(`retrieving secret value from the database`);

  const {
    secrets: { connection, tableName },
    escape,
    escapeId,
  } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`tableName: ${tableName}`);

  const sql = `SELECT \`secret\` FROM ${escapeId(
    tableName
  )} WHERE id = ${escape(selector)}`;

  log.verbose(sql);

  log.debug(`executing SQL query`);
  const [rows] = await connection.query(sql);

  log.debug(`query executed, returning result`);

  const { secret } = rows && rows.length ? rows[0] : { secret: null };

  return secret;
};

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret');
  log.debug(`setting secret value within database`);
  const {
    secrets: { tableName, connection },
    escape,
    escapeId,
  } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`tableName: ${tableName}`);

  const tableId = escapeId(tableName);

  // prettier-ignore
  const query =
     `START TRANSACTION;
     
      SELECT @idx := COALESCE(MAX(\`idx\`) + 1, 0) FROM ${tableId};
      
      INSERT INTO ${tableId}(
       \`idx\`,
       \`id\`, 
       \`secret\`
       ) VALUES(
        @idx,
        ${escape(selector)},
        ${escape(secret)}
      );
      
      COMMIT;`

  log.verbose(`SQL query verbose output hidden due to security`);

  try {
    log.debug(`executing SQL query`);
    await connection.query(query);
    log.debug(`query executed successfully`);
  } catch (error) {
    log.error(error.message);
    log.verbose(error.stack);
    try {
      log.debug(`rolling back`);
      await connection.query('ROLLBACK;');
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
  const {
    secrets: { tableName, connection },
    escapeId,
    escape,
  } = pool;

  log.verbose(`selector: ${selector}`);
  log.verbose(`tableName: ${tableName}`);

  log.debug(`executing SQL query`);
  await connection.execute(
    `DELETE FROM ${escapeId(tableName)} WHERE \`id\` = ${escape(selector)}`
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

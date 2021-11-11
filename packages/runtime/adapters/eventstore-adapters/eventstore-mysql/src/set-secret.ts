import { getLog } from './get-log'
import { AdapterPool } from './types'

const setSecret = async (
  pool: AdapterPool,
  selector: string,
  secret: string
): Promise<void> => {
  const log = getLog('secretsManager:setSecret')
  log.debug(`setting secret value within database`)
  const { secretsTableName, escape, escapeId } = pool

  log.verbose(`selector: ${selector}`)
  log.verbose(`tableName: ${secretsTableName}`)

  const tableId = escapeId(secretsTableName)

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

  log.verbose(`SQL query verbose output hidden due to security reasons`)

  try {
    log.debug(`executing SQL query`)
    await pool.query(query)
    log.debug(`query executed successfully`)
  } catch (error) {
    log.error(error.message)
    log.verbose(error.stack)
    try {
      log.debug(`rolling back`)
      await pool.query('ROLLBACK;')
    } catch (e) {
      log.error(e.message)
      log.verbose(e.stack)
    }
    throw error
  }
}

export default setSecret

import connectEventStore from './js/connect'
import { AdapterPool, AdapterSpecific } from './types'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connectSecretsStore = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<void> => {
  for (let retry = 0; ; retry++) {
    try {
      const secretsDatabase = await specific.sqlite.open(
        pool.config.secretsFile
      )

      Object.assign(pool, {
        secretsDatabase
      })

      return
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
      } else {
        throw error
      }
    }
  }
}

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> =>
  Promise.all([
    connectEventStore(pool, specific),
    connectSecretsStore(pool, specific)
  ])

export default connect

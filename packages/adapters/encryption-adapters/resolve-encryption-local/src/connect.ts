import { open, Database } from 'sqlite'
import { KeyStoreOptions } from './types'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connect = async (options: KeyStoreOptions): Promise<Database> => {
  for (let retry = 0; ; retry++) {
    try {
      const connection = await open(options.databaseFile)
      return connection
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
      } else {
        throw error
      }
    }
  }
}

export default connect

import { getLog } from './get-log'

import tmp from 'tmp'
import os from 'os'
import fs from 'fs'
import BetterSqlite from 'better-sqlite3'

import type { AdapterPool, BetterSqliteDb } from './types'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const ensureConnect = async (pool: AdapterPool): Promise<BetterSqliteDb> => {
  const log = getLog('connect')

  if (pool.database !== undefined) return pool.database

  if (pool.connecting) {
    for (let retry = 0; ; retry++) {
      const timeout = fullJitter(retry)
      await new Promise((resolve) => setTimeout(resolve, timeout))
      if (pool.database !== undefined) return pool.database
      if (timeout >= 10000) {
        throw new Error('Waited too long for sqlite connection')
      }
    }
  }

  pool.connecting = true
  log.debug('connecting to sqlite database')

  let connector: () => BetterSqliteDb
  if (pool.databaseFile === ':memory:') {
    log.debug(`using memory connector`)
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${os.tmpdir()}/storage-${+process.env
        .RESOLVE_LAUNCH_ID}.db`
      const removeCallback = () => {
        if (fs.existsSync(tmpName)) {
          fs.unlinkSync(tmpName)
        }
      }

      if (!fs.existsSync(tmpName)) {
        fs.writeFileSync(tmpName, '')
        process.on('SIGINT', removeCallback)
        process.on('SIGTERM', removeCallback)
        process.on('beforeExit', removeCallback)
        process.on('exit', removeCallback)
      }

      pool.memoryStore = {
        name: tmpName,
        drop: removeCallback,
      }
    } else {
      const temporaryFile = tmp.fileSync()
      pool.memoryStore = {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile),
      }
    }

    const memoryStoreFileName = pool.memoryStore.name
    connector = () => {
      return new BetterSqlite(memoryStoreFileName)
    }
  } else {
    log.debug(`using disk file connector`)
    connector = () => {
      return new BetterSqlite(pool.databaseFile)
    }
  }

  log.debug(`connecting`)
  let database: NonNullable<AdapterPool['database']>
  for (let retry = 0; ; retry++) {
    try {
      database = connector()
      break
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        log.warn(`received SQLITE_BUSY error code, retrying`)
        await new Promise((resolve) => setTimeout(resolve, fullJitter(retry)))
      } else {
        if (error != null) {
          log.error(error.message)
          log.verbose(error.stack)
        }
        throw error
      }
    }
  }

  log.debug(`adjusting connection`)

  const pragma = (pragmaSetting: string) => {
    log.verbose(`PRAGMA ${pragmaSetting}`)
    database.pragma(pragmaSetting)
  }

  pragma('busy_timeout=1000000')
  pragma(`encoding=${pool.escape('UTF-8')}`)
  pragma('synchronous=EXTRA')

  if (pool.databaseFile === ':memory:') {
    pragma('journal_mode=MEMORY')
  } else {
    pragma('journal_mode=DELETE')
  }

  pool.database = database
  log.debug('connection to sqlite databases established')
  return pool.database
}

export default ensureConnect

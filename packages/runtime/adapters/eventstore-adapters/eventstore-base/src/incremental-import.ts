import type { AdapterBoundPool, VersionlessEvent } from './types'

const incrementalImport = async <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  events: VersionlessEvent[]
): Promise<void> => {
  try {
    const importId = await pool.beginIncrementalImport()
    await pool.pushIncrementalImport(events, importId)
    await pool.commitIncrementalImport(importId)
  } catch (error) {
    await pool.rollbackIncrementalImport()
    throw error
  }
}

export default incrementalImport

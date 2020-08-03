import { EventForIncrementalImport } from './types'

async function incrementalImport (pool: any, events: Array<EventForIncrementalImport>) {
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

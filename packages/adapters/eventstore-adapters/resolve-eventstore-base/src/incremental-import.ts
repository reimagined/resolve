import {
  AdapterPoolConnected,
  AdapterPoolConnectedProps,
  InputEvent,
} from './types'

const incrementalImport = async <
  ConnectedProps extends AdapterPoolConnectedProps
>(
  pool: AdapterPoolConnected<ConnectedProps>,
  events: InputEvent[]
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
